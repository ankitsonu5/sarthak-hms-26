const db = require('../../config/db');
const medicationHandler = require('./handlers/medication.handler');
const labHandler = require('./handlers/lab.handler');
const radiologyHandler = require('./handlers/radiology.handler');
const dietHandler = require('./handlers/diet.handler');

const ITEM_HANDLERS = {
    'Medication': async (conn, id, item) => medicationHandler.processIPDMedication(conn, id, item.medication_details),
    'Lab': async (conn, id, item) => labHandler.processIPDLab(conn, id, item.lab_details),
    'Radiology': async (conn, id, item) => radiologyHandler.processIPDRadiology(conn, id, item.radiology_details),
    'Diet': async (conn, id, item) => dietHandler.processIPDDiet(conn, id, item.diet_details),
    'Nursing': async (conn, id, item) => dietHandler.processIPDNursing(conn, id, item.nursing_details)
};

exports.createIPDOrder = async (payload, userId) => {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [masterResult] = await conn.query(
            `CALL sp_create_ipd_order_master(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                payload.ipd_admission_id, payload.doctor_id,
                payload.priority || 'Routine', payload.order_source || 'Manual',
                payload.verbal_order_flag ? 1 : 0,
                payload.verbal_order_verified_by || null,
                payload.clinical_notes || null,
                payload.is_package_case ? 1 : 0, userId
            ]
        );

        const orderMasterId = masterResult[0][0].order_master_id;

        if (payload.items && Array.isArray(payload.items)) {
            for (const item of payload.items) {
                const [itemResult] = await conn.query(
                    `CALL sp_add_ipd_order_item(?, ?, ?, ?, ?, ?)`,
                    [
                        orderMasterId, item.order_type, item.reference_code || null,
                        item.scheduled_datetime || null, item.is_critical ? 1 : 0,
                        item.remarks || null
                    ]
                );

                const orderItemId = itemResult[0][0].order_item_id;

                const handler = ITEM_HANDLERS[item.order_type];
                if (handler && item[`${item.order_type.toLowerCase()}_details`] || item.medication_details || item.lab_details || item.radiology_details || item.diet_details || item.nursing_details) {
                    await handler(conn, orderItemId, item);
                }

                if (item.billing_details) {
                    const b = item.billing_details;
                    await conn.query(
                        `INSERT INTO ipd_order_billing (order_item_id, charge_amount, package_covered) VALUES (?, ?, ?)`,
                        [orderItemId, b.charge_amount, b.package_covered ? 1 : 0]
                    );
                }
            }
        }

        await conn.commit();
        return { order_master_id: orderMasterId, status: 'Success' };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.createCPOEOrder = async (payload, userId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [count] = await conn.query('SELECT COUNT(*) as c FROM doctor_order_header WHERE YEAR(created_at) = YEAR(CURDATE())');
        const orderNumber = `ORD-${new Date().getFullYear()}-${String(count[0].c + 1).padStart(6, '0')}`;

        const [headerResult] = await conn.query(
            `INSERT INTO doctor_order_header
            (order_number, patient_id, admission_id, encounter_id, order_type, priority, clinical_indication, ordered_by, status, order_datetime)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Draft', NOW())`,
            [orderNumber, payload.patient_id, payload.admission_id, payload.encounter_id, payload.order_type, payload.priority, payload.clinical_indication, userId]
        );

        const orderId = headerResult.insertId;

        if (payload.items && payload.items.length) {
            for (const item of payload.items) {
                const [itemResult] = await conn.query(
                    `INSERT INTO doctor_order_items
                    (order_id, item_category, item_name, quantity, execution_status)
                    VALUES (?, ?, ?, ?, 'Pending')`,
                    [orderId, item.category, item.name, item.quantity || 1]
                );

                const itemId = itemResult.insertId;

                if (item.category === 'Medication') {
                    await medicationHandler.processCPOEMedication(conn, itemId, item);
                } else if (item.category === 'Lab_Test') {
                    await labHandler.processCPOELab(conn, itemId, item);
                } else if (item.category === 'Radiology_Test') {
                    await radiologyHandler.processCPOERadiology(conn, itemId, item);
                }
            }
        }

        await conn.commit();
        return { order_id: orderId, order_number: orderNumber, status: 'Draft' };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.signOrder = async (orderId, userId) => {
    const conn = await db.getConnection();
    try {
        await conn.query(`UPDATE doctor_order_header SET status = 'Signed' WHERE order_id = ?`, [orderId]);
        await conn.query(
            `INSERT INTO doctor_order_status_log (order_id, previous_status, new_status, changed_by) VALUES (?, 'Draft', 'Signed', ?)`,
            [orderId, userId]
        );
        return { message: 'Order signed & sent to department' };
    } finally {
        conn.release();
    }
};

exports.getOrdersByAdmission = async (admissionId) => {
    const [rows] = await db.query(`
        SELECT om.*, doc.doctor_name
        FROM ipd_order_master om
        LEFT JOIN master_doctor doc ON om.doctor_id = doc.doctor_id
        WHERE om.ipd_admission_id = ?
        ORDER BY om.order_datetime DESC
    `, [admissionId]);
    return rows;
};

exports.getOrderById = async (orderId) => {
    const [master] = await db.query('SELECT * FROM ipd_order_master WHERE order_master_id = ?', [orderId]);
    if (!master.length) return null;

    const [items] = await db.query(`
        SELECT oi.*,
            mo.generic_name as drug_name, mo.dose, mo.frequency,
            lo.lab_test_id, ro.radiology_test_id
        FROM ipd_order_items oi
        LEFT JOIN ipd_medication_orders mo ON oi.order_item_id = mo.order_item_id
        LEFT JOIN ipd_lab_orders lo ON oi.order_item_id = lo.order_item_id
        LEFT JOIN ipd_radiology_orders ro ON oi.order_item_id = ro.order_item_id
        WHERE oi.order_master_id = ?
    `, [orderId]);

    return { master: master[0], items };
};

exports.getOrdersByPatient = async (patientId) => {
    const [orders] = await db.query(`
        SELECT h.*, i.item_name, i.item_category, i.execution_status
        FROM doctor_order_header h
        LEFT JOIN doctor_order_items i ON h.order_id = i.order_id
        WHERE h.patient_id = ?
        ORDER BY h.order_datetime DESC
    `, [patientId]);
    return orders;
};

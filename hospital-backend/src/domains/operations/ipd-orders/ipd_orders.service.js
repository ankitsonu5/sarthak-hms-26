const db = require('../../../config/db');

exports.createDoctorOrder = async (payload, userId) => {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        console.log("Starting IPD Doctor Order for Admission ID:", payload.ipd_admission_id);

        // 1️⃣ Create Order Master
        const [masterResult] = await conn.query(
            `CALL sp_create_ipd_order_master(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                payload.ipd_admission_id,
                payload.doctor_id,
                payload.priority || 'Routine',
                payload.order_source || 'Manual',
                payload.verbal_order_flag ? 1 : 0,
                payload.verbal_order_verified_by || null,
                payload.clinical_notes || null,
                payload.is_package_case ? 1 : 0,
                userId // created_by
            ]
        );

        const orderMasterId = masterResult[0][0].order_master_id;

        // 2️⃣ Process Order Items
        if (payload.items && Array.isArray(payload.items)) {
            for (const item of payload.items) {
                // A) Create Generic Order Item
                const [itemResult] = await conn.query(
                    `CALL sp_add_ipd_order_item(?, ?, ?, ?, ?, ?)`,
                    [
                        orderMasterId,
                        item.order_type,
                        item.reference_code || null,
                        item.scheduled_datetime || null,
                        item.is_critical ? 1 : 0,
                        item.remarks || null
                    ]
                );

                const orderItemId = itemResult[0][0].order_item_id;

                // B) Create Type-Specific Order Details
                if (item.order_type === 'Medication' && item.medication_details) {
                    const m = item.medication_details;
                    await conn.query(
                        `CALL sp_add_ipd_medication_order(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            orderItemId,
                            m.drug_id,
                            m.generic_name || null,
                            m.dose || null,
                            m.dose_unit || null,
                            m.frequency || null,
                            m.route || 'Oral',
                            m.infusion_rate || null,
                            m.dilution_instruction || null,
                            m.start_datetime || null,
                            m.end_datetime || null,
                            m.is_prn ? 1 : 0,
                            m.max_daily_dose || null,
                            m.high_alert_flag ? 1 : 0
                        ]
                    );

                    // Initialize MAR (Medication Administration Record) - Optional
                    if (m.mar_schedules && Array.isArray(m.mar_schedules)) {
                        for (const schedule of m.mar_schedules) {
                            await conn.query(
                                `INSERT INTO ipd_medication_administration (medication_order_id, scheduled_time, status) VALUES (
                                    (SELECT medication_order_id FROM ipd_medication_orders WHERE order_item_id = ?), ?, 'Pending'
                                )`,
                                [orderItemId, schedule]
                            );
                        }
                    }
                } else if (item.order_type === 'Lab' && item.lab_details) {
                    const l = item.lab_details;
                    await conn.query(
                        `INSERT INTO ipd_lab_orders (order_item_id, lab_test_id, sample_type, fasting_required) VALUES (?, ?, ?, ?)`,
                        [orderItemId, l.lab_test_id, l.sample_type, l.fasting_required ? 1 : 0]
                    );
                } else if (item.order_type === 'Radiology' && item.radiology_details) {
                    const r = item.radiology_details;
                    await conn.query(
                        `INSERT INTO ipd_radiology_orders (order_item_id, radiology_test_id, clinical_indication, contrast_required) VALUES (?, ?, ?, ?)`,
                        [orderItemId, r.radiology_test_id, r.clinical_indication, r.contrast_required ? 1 : 0]
                    );
                } else if (item.order_type === 'Diet' && item.diet_details) {
                    const d = item.diet_details;
                    await conn.query(
                        `INSERT INTO ipd_diet_orders (order_item_id, diet_type, calories, npo_flag, feeding_route) VALUES (?, ?, ?, ?, ?)`,
                        [orderItemId, d.diet_type, d.calories, d.npo_flag ? 1 : 0, d.feeding_route]
                    );
                } else if (item.order_type === 'Nursing' && item.nursing_details) {
                    const n = item.nursing_details;
                    await conn.query(
                        `INSERT INTO ipd_nursing_orders (order_item_id, instruction, frequency) VALUES (?, ?, ?)`,
                        [orderItemId, n.instruction, n.frequency]
                    );
                }

                // C) Create Billing Link (Auto-Billing Setup)
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
        console.log("IPD Order Transaction Committed.");

        return {
            order_master_id: orderMasterId,
            status: 'Success'
        };

    } catch (err) {
        await conn.rollback();
        console.error("IPD Order Transaction Rolled Back:", err.message);
        throw err;
    } finally {
        conn.release();
    }
};
// 3️⃣ Get Order List for Admission
exports.getOrdersByAdmission = async (admissionId) => {
    const [rows] = await db.query(`
        SELECT om.*, doc.name as doctor_name
        FROM ipd_order_master om
        LEFT JOIN master_doctor doc ON om.doctor_id = doc.doctor_id
        WHERE om.ipd_admission_id = ?
        ORDER BY om.order_datetime DESC
    `, [admissionId]);
    return rows;
};

// 4️⃣ Get Order Detail with Items
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

    return {
        master: master[0],
        items: items
    };
};

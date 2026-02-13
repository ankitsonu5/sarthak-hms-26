const db = require('../../../config/db');

// 1. Create Enterprise Doctor Order
exports.createOrder = async (payload, userId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1.1 Generate Order Number
        const [count] = await conn.query('SELECT COUNT(*) as c FROM doctor_order_header WHERE YEAR(created_at) = YEAR(CURDATE())');
        const orderNumber = `ORD-${new Date().getFullYear()}-${String(count[0].c + 1).padStart(6, '0')}`;

        // 1.2 Insert Header
        const [headerResult] = await conn.query(
            `INSERT INTO doctor_order_header 
            (order_number, patient_id, admission_id, encounter_id, order_type, priority, clinical_indication, ordered_by, status, order_datetime) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Draft', NOW())`,
            [orderNumber, payload.patient_id, payload.admission_id, payload.encounter_id, payload.order_type, payload.priority, payload.clinical_indication, userId]
        );

        const orderId = headerResult.insertId;

        // 1.3 Insert Items & Specific Details
        if (payload.items && payload.items.length) {
            for (const item of payload.items) {
                // Insert Item
                const [itemResult] = await conn.query(
                    `INSERT INTO doctor_order_items 
                    (order_id, item_category, item_name, quantity, execution_status) 
                    VALUES (?, ?, ?, ?, 'Pending')`,
                    [orderId, item.category, item.name, item.quantity || 1]
                );

                const itemId = itemResult.insertId;

                // Handle Medication Specifics
                if (item.category === 'Medication') {
                    await conn.query(
                        `INSERT INTO medication_order_details 
                        (order_item_id, dosage, route, frequency, duration, prn_flag, high_alert_flag) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [itemId, item.dosage, item.route, item.frequency, item.duration, item.prn_flag || false, item.high_alert_flag || false]
                    );

                    // Generate Schedule if not PRN
                    if (!item.prn_flag) {
                        await generateMedicationSchedule(conn, itemId, item.frequency, item.duration);
                    }
                }

                // Handle Lab Specifics
                if (item.category === 'Lab_Test') {
                    await conn.query(
                        `INSERT INTO lab_sample_tracking 
                        (order_item_id, sample_type, fasting_required, result_status) 
                        VALUES (?, ?, ?, 'Pending')`,
                        [itemId, item.sample_type, item.fasting_required || false]
                    );
                }

                // Handle Radiology Specifics
                if (item.category === 'Radiology_Test') {
                    await conn.query(
                        `INSERT INTO radiology_execution 
                        (order_item_id, contrast_required, sedation_required) 
                        VALUES (?, ?, ?)`,
                        [itemId, item.contrast_required || false, item.sedation_required || false]
                    );
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

// Helper: Generate Medication Schedule (Simple logic)
async function generateMedicationSchedule(conn, itemId, frequency, duration) {
    // Logic to calculate dose times based on frequency (BID, TID, etc.)
    // For MVP, just inserting one scheduled dose as placeholder
    await conn.query(
        `INSERT INTO medication_schedule (order_item_id, scheduled_datetime, administration_status) VALUES (?, DATE_ADD(NOW(), INTERVAL 1 HOUR), 'Scheduled')`,
        [itemId]
    );
}

// 2. Sign Order (Finalize)
exports.signOrder = async (orderId, userId) => {
    const conn = await db.getConnection();
    try {
        await conn.query(`UPDATE doctor_order_header SET status = 'Signed' WHERE order_id = ?`, [orderId]);

        // Log Status Change
        await conn.query(`INSERT INTO doctor_order_status_log (order_id, previous_status, new_status, changed_by) VALUES (?, 'Draft', 'Signed', ?)`, [orderId, userId]);

        return { message: 'Order Signed & Sent to Department' };
    } finally {
        conn.release();
    }
};

// 3. Get Patient Orders
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

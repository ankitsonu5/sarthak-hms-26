exports.processIPDMedication = async (conn, orderItemId, details) => {
    const m = details;
    await conn.query(
        `CALL sp_add_ipd_medication_order(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            orderItemId, m.drug_id, m.generic_name || null,
            m.dose || null, m.dose_unit || null, m.frequency || null,
            m.route || 'Oral', m.infusion_rate || null, m.dilution_instruction || null,
            m.start_datetime || null, m.end_datetime || null,
            m.is_prn ? 1 : 0, m.max_daily_dose || null, m.high_alert_flag ? 1 : 0
        ]
    );

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
};

exports.processCPOEMedication = async (conn, itemId, item) => {
    await conn.query(
        `INSERT INTO medication_order_details
        (order_item_id, dosage, route, frequency, duration, prn_flag, high_alert_flag)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [itemId, item.dosage, item.route, item.frequency, item.duration, item.prn_flag || false, item.high_alert_flag || false]
    );

    if (!item.prn_flag) {
        await conn.query(
            `INSERT INTO medication_schedule (order_item_id, scheduled_datetime, administration_status) VALUES (?, DATE_ADD(NOW(), INTERVAL 1 HOUR), 'Scheduled')`,
            [itemId]
        );
    }
};

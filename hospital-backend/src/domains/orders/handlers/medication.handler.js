const { prisma } = require('../../../config/db');

exports.processIPDMedication = async (tx, orderItemId, details) => {
    const m = details;
    await tx.$executeRaw`
        INSERT INTO ipd_medication_orders
        (order_item_id, drug_id, generic_name, dose, dose_unit, frequency,
         route, infusion_rate, dilution_instruction, start_datetime, end_datetime,
         is_prn, max_daily_dose, high_alert_flag)
        VALUES (${orderItemId}, ${m.drug_id}, ${m.generic_name || null},
                ${m.dose || null}, ${m.dose_unit || null}, ${m.frequency || null},
                ${m.route || 'Oral'}, ${m.infusion_rate || null}, ${m.dilution_instruction || null},
                ${m.start_datetime || null}, ${m.end_datetime || null},
                ${m.is_prn || false}, ${m.max_daily_dose || null}, ${m.high_alert_flag || false})`;

    if (m.mar_schedules && Array.isArray(m.mar_schedules)) {
        for (const schedule of m.mar_schedules) {
            await tx.$executeRaw`
                INSERT INTO ipd_medication_administration (medication_order_id, scheduled_time, status)
                VALUES (
                    (SELECT medication_order_id FROM ipd_medication_orders WHERE order_item_id = ${orderItemId}),
                    ${schedule}, 'Pending'
                )`;
        }
    }
};

exports.processCPOEMedication = async (tx, itemId, item) => {
    await tx.$executeRaw`
        INSERT INTO medication_order_details
        (order_item_id, dosage, route, frequency, duration, prn_flag, high_alert_flag)
        VALUES (${itemId}, ${item.dosage}, ${item.route}, ${item.frequency},
                ${item.duration}, ${item.prn_flag || false}, ${item.high_alert_flag || false})`;

    if (!item.prn_flag) {
        await tx.$executeRaw`
            INSERT INTO medication_schedule (order_item_id, scheduled_datetime, administration_status)
            VALUES (${itemId}, NOW() + INTERVAL '1 hour', 'Scheduled')`;
    }
};

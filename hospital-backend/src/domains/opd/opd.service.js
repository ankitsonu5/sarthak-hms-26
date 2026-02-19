const db = require('../../config/db');

exports.createOPDVisit = async (payload, userId) => {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        console.log("Starting OPD Visit Creation for Patient ID:", payload.patient_id);

        // 1️⃣ Create OPD Visit (Calls sp_create_opd_visit)
        const [visitResult] = await conn.query(
            `CALL sp_create_opd_visit(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                payload.patient_id,
                payload.visit_type,
                payload.appointment_type,
                payload.visit_date,
                payload.visit_time,
                payload.hospital_branch_id,
                payload.department_id,
                payload.doctor_id,
                payload.opd_room || null,
                payload.queue_type,
                payload.chief_complaint,
                payload.complaint_duration || null,
                payload.visit_reason,
                userId // created_by
            ]
        );

        const row = visitResult[0][0];
        if (!row || !row.opd_visit_id) {
            throw new Error("Failed to create OPD visit record.");
        }

        const opdVisitId = row.opd_visit_id;
        const visitNo = row.visit_no;
        const tokenNo = row.token_no;

        console.log(`OPD Visit Created: ID=${opdVisitId}, VisitNo=${visitNo}, Token=${tokenNo}`);

        // 2️⃣ Save Vitals (Optional but likely present)
        if (payload.vitals) {
            const v = payload.vitals;
            await conn.query(
                `CALL sp_save_opd_vitals(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    opdVisitId,
                    v.height_cm || null,
                    v.weight_kg || null,
                    v.bmi || null,
                    v.blood_pressure || null,
                    v.pulse_rate || null,
                    v.temperature || null,
                    v.spo2 || null,
                    userId // recorded_by
                ]
            );
        }

        // 3️⃣ Save Billing
        if (payload.billing) {
            const b = payload.billing;
            await conn.query(
                `CALL sp_save_opd_billing(?, ?, ?, ?, ?, ?, ?)`,
                [
                    opdVisitId,
                    b.consultation_fee,
                    b.discount_amount || 0,
                    b.discount_reason || null,
                    b.net_amount,
                    b.payment_mode,
                    b.payment_status || 'Pending'
                ]
            );
        }

        // 4️⃣ Save Insurance / Corporate (Tagging)
        if (payload.insurance) {
            const i = payload.insurance;
            await conn.query(
                `CALL sp_save_opd_insurance(?, ?, ?, ?, ?, ?)`,
                [
                    opdVisitId,
                    i.patient_category,
                    i.corporate_name || null,
                    i.insurance_company || null,
                    i.tpa_name || null,
                    i.authorization_required ? 1 : 0
                ]
            );
        }

        await conn.commit();
        console.log("OPD Transaction Committed.");

        return {
            opd_visit_id: opdVisitId,
            visit_no: visitNo,
            token_no: tokenNo
        };

    } catch (err) {
        await conn.rollback();
        console.error("OPD Transaction Rolled Back:", err.message);
        throw err;
    } finally {
        conn.release();
    }
};
// 5️⃣ List All Visits
exports.getAllVisits = async () => {
    const [rows] = await db.query(`
        SELECT v.*, p.first_name, p.last_name, p.uhid 
        FROM opd_visit_master v
        JOIN patient_master p ON v.patient_id = p.patient_id
        ORDER BY v.created_at DESC
    `);
    return rows;
};

// 6️⃣ Get Visit by ID
exports.getVisitById = async (id) => {
    const [rows] = await db.query('SELECT * FROM opd_visit_master WHERE opd_visit_id = ?', [id]);
    return rows[0] || null;
};

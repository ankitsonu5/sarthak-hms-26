const db = require('../../../config/db');

exports.createPreAuth = async (payload, userId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO insurance_pre_authorization
             (ipd_admission_id, insurance_company_id, tpa_id, policy_number,
              requested_amount, diagnosis_summary, proposed_treatment,
              preauth_status_id, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                payload.ipd_admission_id,
                payload.insurance_company_id,
                payload.tpa_id || null,
                payload.policy_number,
                payload.requested_amount,
                payload.diagnosis_summary || null,
                payload.proposed_treatment || null,
                payload.preauth_status_id,
                userId
            ]
        );

        const [preauth] = await conn.query(
            'SELECT * FROM insurance_pre_authorization WHERE preauth_id = ?',
            [result.insertId]
        );

        await conn.commit();
        return preauth[0];
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.updatePreauthStatus = async (preauthId, payload, userId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(
            `UPDATE insurance_pre_authorization
             SET preauth_status_id = ?, approved_amount = ?, rejection_reason = ?,
                 responded_at = NOW(), updated_by = ?, updated_at = NOW()
             WHERE preauth_id = ?`,
            [
                payload.preauth_status_id,
                payload.approved_amount || null,
                payload.rejection_reason || null,
                userId,
                preauthId
            ]
        );

        const [preauth] = await conn.query(
            `SELECT pa.*, ps.status_name AS preauth_status,
                    ic.insurance_company_id, t.tpa_id
             FROM insurance_pre_authorization pa
             LEFT JOIN master_preauth_status ps ON pa.preauth_status_id = ps.preauth_status_id
             LEFT JOIN master_insurance_company ic ON pa.insurance_company_id = ic.insurance_company_id
             LEFT JOIN master_tpa t ON pa.tpa_id = t.tpa_id
             WHERE pa.preauth_id = ?`,
            [preauthId]
        );

        await conn.commit();
        return preauth[0];
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.getPreauthById = async (preauthId) => {
    const [rows] = await db.query(
        `SELECT pa.*, ps.status_name AS preauth_status,
                ic.insurance_company_id, t.tpa_id
         FROM insurance_pre_authorization pa
         LEFT JOIN master_preauth_status ps ON pa.preauth_status_id = ps.preauth_status_id
         LEFT JOIN master_insurance_company ic ON pa.insurance_company_id = ic.insurance_company_id
         LEFT JOIN master_tpa t ON pa.tpa_id = t.tpa_id
         WHERE pa.preauth_id = ?`,
        [preauthId]
    );
    return rows[0] || null;
};

exports.getPreauthsByAdmission = async (admissionId) => {
    const [rows] = await db.query(
        `SELECT pa.*, ps.status_name AS preauth_status
         FROM insurance_pre_authorization pa
         LEFT JOIN master_preauth_status ps ON pa.preauth_status_id = ps.preauth_status_id
         WHERE pa.ipd_admission_id = ?
         ORDER BY pa.requested_at DESC`,
        [admissionId]
    );
    return rows;
};

exports.getAllPreAuths = async () => {
    const [rows] = await db.query(
        `SELECT pa.*, ps.status_name AS preauth_status,
                a.admission_no, p.uhid, p.first_name, p.last_name
         FROM insurance_pre_authorization pa
         LEFT JOIN master_preauth_status ps ON pa.preauth_status_id = ps.preauth_status_id
         LEFT JOIN ipd_admission_master a ON pa.ipd_admission_id = a.ipd_admission_id
         LEFT JOIN patient_master p ON a.patient_id = p.patient_id
         ORDER BY pa.requested_at DESC`
    );
    return rows;
};

const db = require('../../../config/db');

exports.submitClaim = async (payload, userId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO insurance_claim_master
             (ipd_admission_id, preauth_id, insurance_company_id, tpa_id,
              claim_number, claim_amount, claim_status_id, submitted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                payload.ipd_admission_id,
                payload.preauth_id || null,
                payload.insurance_company_id,
                payload.tpa_id || null,
                payload.claim_number || null,
                payload.claim_amount,
                payload.claim_status_id
            ]
        );

        const [claim] = await conn.query(
            'SELECT * FROM insurance_claim_master WHERE claim_id = ?',
            [result.insertId]
        );

        // Initial tracking entry
        await conn.query(
            `INSERT INTO insurance_claim_tracking
             (claim_id, claim_status_id, remarks, updated_by)
             VALUES (?, ?, ?, ?)`,
            [result.insertId, payload.claim_status_id, 'Claim submitted', userId]
        );

        await conn.commit();
        return claim[0];
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.updateClaimStatus = async (claimId, payload, userId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const updates = ['claim_status_id = ?'];
        const params = [payload.claim_status_id];

        if (payload.approved_amount !== undefined) {
            updates.push('approved_amount = ?');
            params.push(payload.approved_amount);
        }
        if (payload.settled_amount !== undefined) {
            updates.push('settled_amount = ?');
            params.push(payload.settled_amount);
        }
        if (payload.settlement_date) {
            updates.push('settlement_date = ?');
            params.push(payload.settlement_date);
        }

        params.push(claimId);

        await conn.query(
            `UPDATE insurance_claim_master SET ${updates.join(', ')} WHERE claim_id = ?`,
            params
        );

        // Tracking entry for every status change
        await conn.query(
            `INSERT INTO insurance_claim_tracking
             (claim_id, claim_status_id, remarks, updated_by)
             VALUES (?, ?, ?, ?)`,
            [claimId, payload.claim_status_id, payload.remarks || null, userId]
        );

        const [claim] = await conn.query(
            `SELECT cm.*, cs.status_name AS claim_status
             FROM insurance_claim_master cm
             LEFT JOIN master_claim_status cs ON cm.claim_status_id = cs.claim_status_id
             WHERE cm.claim_id = ?`,
            [claimId]
        );

        await conn.commit();
        return claim[0];
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.addRejection = async (claimId, payload) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query(
            `INSERT INTO insurance_claim_rejection
             (claim_id, rejection_reason_id, rejection_amount, remarks)
             VALUES (?, ?, ?, ?)`,
            [claimId, payload.rejection_reason_id, payload.rejection_amount || null, payload.remarks || null]
        );

        const [rejections] = await conn.query(
            `SELECT cr.*, rr.reason_name
             FROM insurance_claim_rejection cr
             LEFT JOIN master_claim_rejection_reason rr ON cr.rejection_reason_id = rr.rejection_reason_id
             WHERE cr.claim_id = ?`,
            [claimId]
        );

        await conn.commit();
        return rejections;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.getClaimById = async (claimId) => {
    const [claim] = await db.query(
        `SELECT cm.*, cs.status_name AS claim_status,
                a.admission_no, p.uhid, p.first_name, p.last_name
         FROM insurance_claim_master cm
         LEFT JOIN master_claim_status cs ON cm.claim_status_id = cs.claim_status_id
         LEFT JOIN ipd_admission_master a ON cm.ipd_admission_id = a.ipd_admission_id
         LEFT JOIN patient_master p ON a.patient_id = p.patient_id
         WHERE cm.claim_id = ?`,
        [claimId]
    );

    if (!claim.length) return null;

    const [tracking] = await db.query(
        `SELECT ct.*, cs.status_name
         FROM insurance_claim_tracking ct
         LEFT JOIN master_claim_status cs ON ct.claim_status_id = cs.claim_status_id
         WHERE ct.claim_id = ?
         ORDER BY ct.updated_at ASC`,
        [claimId]
    );

    const [rejections] = await db.query(
        `SELECT cr.*, rr.reason_name
         FROM insurance_claim_rejection cr
         LEFT JOIN master_claim_rejection_reason rr ON cr.rejection_reason_id = rr.rejection_reason_id
         WHERE cr.claim_id = ?`,
        [claimId]
    );

    const [documents] = await db.query(
        `SELECT cd.*, dt.document_name
         FROM insurance_claim_document cd
         LEFT JOIN master_claim_document_type dt ON cd.document_type_id = dt.document_type_id
         WHERE cd.claim_id = ?`,
        [claimId]
    );

    return {
        claim: claim[0],
        tracking,
        rejections,
        documents
    };
};

exports.getClaimsByAdmission = async (admissionId) => {
    const [rows] = await db.query(
        `SELECT cm.*, cs.status_name AS claim_status
         FROM insurance_claim_master cm
         LEFT JOIN master_claim_status cs ON cm.claim_status_id = cs.claim_status_id
         WHERE cm.ipd_admission_id = ?
         ORDER BY cm.created_at DESC`,
        [admissionId]
    );
    return rows;
};

exports.getAllClaims = async () => {
    const [rows] = await db.query(
        `SELECT cm.*, cs.status_name AS claim_status,
                a.admission_no, p.uhid, p.first_name, p.last_name,
                ic.insurance_company_id
         FROM insurance_claim_master cm
         LEFT JOIN master_claim_status cs ON cm.claim_status_id = cs.claim_status_id
         LEFT JOIN ipd_admission_master a ON cm.ipd_admission_id = a.ipd_admission_id
         LEFT JOIN patient_master p ON a.patient_id = p.patient_id
         LEFT JOIN master_insurance_company ic ON cm.insurance_company_id = ic.insurance_company_id
         ORDER BY cm.created_at DESC`
    );
    return rows;
};

exports.getClaimTimeline = async (claimId) => {
    const [rows] = await db.query(
        `SELECT ct.*, cs.status_name
         FROM insurance_claim_tracking ct
         LEFT JOIN master_claim_status cs ON ct.claim_status_id = cs.claim_status_id
         WHERE ct.claim_id = ?
         ORDER BY ct.updated_at ASC`,
        [claimId]
    );
    return rows;
};

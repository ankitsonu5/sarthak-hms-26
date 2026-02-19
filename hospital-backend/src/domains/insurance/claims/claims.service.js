const db = require('../../../config/db');

exports.submitClaim = async (payload, userId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        let slaDueDate = null;
        if (payload.tpa_id) {
            const [tpa] = await conn.query('SELECT sla_days FROM master_tpa WHERE tpa_id = ?', [payload.tpa_id]);
            if (tpa.length && tpa[0].sla_days) {
                const d = new Date();
                d.setDate(d.getDate() + tpa[0].sla_days);
                slaDueDate = d.toISOString().slice(0, 10);
            }
        }

        const [result] = await conn.query(
            `INSERT INTO insurance_claim_master
             (ipd_admission_id, preauth_id, insurance_company_id, tpa_id,
              claim_number, claim_amount, claim_status_id, submitted_at, sla_due_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
            [
                payload.ipd_admission_id,
                payload.preauth_id || null,
                payload.insurance_company_id,
                payload.tpa_id || null,
                payload.claim_number || null,
                payload.claim_amount,
                payload.claim_status_id,
                slaDueDate
            ]
        );

        const [claim] = await conn.query(
            'SELECT * FROM insurance_claim_master WHERE claim_id = ?',
            [result.insertId]
        );

        await conn.query(
            `INSERT INTO insurance_claim_tracking (claim_id, claim_status_id, remarks, updated_by)
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

exports.updateClaimStatus = async (claimId, payload, userId, ipAddress = null) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [existing] = await conn.query(
            'SELECT claim_status_id FROM insurance_claim_master WHERE claim_id = ?',
            [claimId]
        );
        if (!existing.length) {
            await conn.rollback();
            return null;
        }
        const oldStatusId = existing[0].claim_status_id;

        const [oldStatusRow] = await conn.query(
            'SELECT status_name FROM master_claim_status WHERE claim_status_id = ?',
            [oldStatusId]
        );
        const [newStatusRow] = await conn.query(
            'SELECT status_name FROM master_claim_status WHERE claim_status_id = ?',
            [payload.claim_status_id]
        );

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

        await conn.query(
            `INSERT INTO insurance_claim_tracking (claim_id, claim_status_id, remarks, updated_by)
             VALUES (?, ?, ?, ?)`,
            [claimId, payload.claim_status_id, payload.remarks || null, userId]
        );

        await conn.query(
            `INSERT INTO insurance_claim_audit_log
             (claim_id, old_status_id, new_status_id, old_status_name, new_status_name, changed_by, ip_address, remarks)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                claimId,
                oldStatusId,
                payload.claim_status_id,
                oldStatusRow[0]?.status_name || null,
                newStatusRow[0]?.status_name || null,
                userId,
                ipAddress || null,
                payload.remarks || null
            ]
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
            `INSERT INTO insurance_claim_rejection (claim_id, rejection_reason_id, rejection_amount, remarks)
             VALUES (?, ?, ?, ?)`,
            [claimId, payload.rejection_reason_id, payload.rejection_amount || null, payload.remarks || null]
        );

        const [rejections] = await conn.query(
            `SELECT cr.*, rr.reason_name FROM insurance_claim_rejection cr
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
        `SELECT cm.*, cs.status_name AS claim_status, a.admission_no, p.uhid, p.first_name, p.last_name
         FROM insurance_claim_master cm
         LEFT JOIN master_claim_status cs ON cm.claim_status_id = cs.claim_status_id
         LEFT JOIN ipd_admission_master a ON cm.ipd_admission_id = a.ipd_admission_id
         LEFT JOIN patient_master p ON a.patient_id = p.patient_id
         WHERE cm.claim_id = ?`,
        [claimId]
    );
    if (!claim.length) return null;

    const [tracking] = await db.query(
        `SELECT ct.*, cs.status_name FROM insurance_claim_tracking ct
         LEFT JOIN master_claim_status cs ON ct.claim_status_id = cs.claim_status_id
         WHERE ct.claim_id = ? ORDER BY ct.updated_at ASC`,
        [claimId]
    );
    const [rejections] = await db.query(
        `SELECT cr.*, rr.reason_name FROM insurance_claim_rejection cr
         LEFT JOIN master_claim_rejection_reason rr ON cr.rejection_reason_id = rr.rejection_reason_id
         WHERE cr.claim_id = ?`,
        [claimId]
    );
    const [documents] = await db.query(
        `SELECT cd.*, dt.document_name FROM insurance_claim_document cd
         LEFT JOIN master_claim_document_type dt ON cd.document_type_id = dt.document_type_id
         WHERE cd.claim_id = ?`,
        [claimId]
    );
    const [auditLog] = await db.query(
        'SELECT * FROM insurance_claim_audit_log WHERE claim_id = ? ORDER BY changed_at ASC',
        [claimId]
    );

    return { claim: claim[0], tracking, rejections, documents, audit_log: auditLog };
};

exports.getClaimsByAdmission = async (admissionId) => {
    const [rows] = await db.query(
        `SELECT cm.*, cs.status_name AS claim_status FROM insurance_claim_master cm
         LEFT JOIN master_claim_status cs ON cm.claim_status_id = cs.claim_status_id
         WHERE cm.ipd_admission_id = ? ORDER BY cm.created_at DESC`,
        [admissionId]
    );
    return rows;
};

exports.getAllClaims = async () => {
    const [rows] = await db.query(
        `SELECT cm.*, cs.status_name AS claim_status, a.admission_no, p.uhid, p.first_name, p.last_name,
                ic.insurance_company_id FROM insurance_claim_master cm
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
        `SELECT ct.*, cs.status_name FROM insurance_claim_tracking ct
         LEFT JOIN master_claim_status cs ON ct.claim_status_id = cs.claim_status_id
         WHERE ct.claim_id = ? ORDER BY ct.updated_at ASC`,
        [claimId]
    );
    return rows;
};

exports.getAgingSummary = async () => {
    const [rows] = await db.query('SELECT * FROM v_insurance_claim_aging_summary');
    return rows;
};

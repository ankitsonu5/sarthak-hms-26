const db = require('../../../config/db');

exports.createEscalation = async (payload, userId) => {
    const [result] = await db.query(
        `INSERT INTO insurance_claim_escalation
         (claim_id, escalation_level, escalation_to_role_id, escalation_due_date, escalated_by, remarks)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            payload.claim_id,
            payload.escalation_level,
            payload.escalation_to_role_id || null,
            payload.escalation_due_date,
            userId,
            payload.remarks || null
        ]
    );
    const [row] = await db.query(
        `SELECT e.*, r.role_name FROM insurance_claim_escalation e
         LEFT JOIN master_escalation_role r ON e.escalation_to_role_id = r.escalation_role_id
         WHERE e.escalation_id = ?`,
        [result.insertId]
    );
    return row[0];
};

exports.acknowledge = async (escalationId, payload, userId) => {
    await db.query(
        `UPDATE insurance_claim_escalation
         SET acknowledged_at = NOW(), acknowledged_by = ?, resolution_remarks = ?
         WHERE escalation_id = ?`,
        [userId, payload.resolution_remarks || null, escalationId]
    );
    const [row] = await db.query(
        `SELECT e.*, r.role_name FROM insurance_claim_escalation e
         LEFT JOIN master_escalation_role r ON e.escalation_to_role_id = r.escalation_role_id
         WHERE e.escalation_id = ?`,
        [escalationId]
    );
    return row[0] || null;
};

exports.getByClaim = async (claimId) => {
    const [rows] = await db.query(
        `SELECT e.*, r.role_name FROM insurance_claim_escalation e
         LEFT JOIN master_escalation_role r ON e.escalation_to_role_id = r.escalation_role_id
         WHERE e.claim_id = ? ORDER BY e.escalated_at DESC`,
        [claimId]
    );
    return rows;
};

exports.getPendingEscalations = async () => {
    const [rows] = await db.query(
        `SELECT e.*, r.role_name, cm.claim_number, cs.status_name
         FROM insurance_claim_escalation e
         LEFT JOIN master_escalation_role r ON e.escalation_to_role_id = r.escalation_role_id
         LEFT JOIN insurance_claim_master cm ON e.claim_id = cm.claim_id
         LEFT JOIN master_claim_status cs ON cm.claim_status_id = cs.claim_status_id
         WHERE e.acknowledged_at IS NULL AND e.escalation_due_date >= CURDATE()
         ORDER BY e.escalation_due_date ASC`
    );
    return rows;
};

const db = require('../../../config/db');

exports.recordSettlement = async (payload) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO insurance_claim_settlement
             (claim_id, settled_amount, tds_amount, deduction_amount,
              payment_reference, payment_date, posted_to_ledger)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                payload.claim_id,
                payload.settled_amount,
                payload.tds_amount || null,
                payload.deduction_amount || null,
                payload.payment_reference || null,
                payload.payment_date || null,
                payload.posted_to_ledger || false
            ]
        );

        // Update settled_amount on claim master
        await conn.query(
            `UPDATE insurance_claim_master
             SET settled_amount = (
                 SELECT COALESCE(SUM(settled_amount), 0)
                 FROM insurance_claim_settlement
                 WHERE claim_id = ?
             ), settlement_date = COALESCE(settlement_date, NOW())
             WHERE claim_id = ?`,
            [payload.claim_id, payload.claim_id]
        );

        const [settlement] = await conn.query(
            'SELECT * FROM insurance_claim_settlement WHERE settlement_id = ?',
            [result.insertId]
        );

        await conn.commit();
        return settlement[0];
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.getSettlementsByClaim = async (claimId) => {
    const [rows] = await db.query(
        `SELECT s.*, cm.claim_number
         FROM insurance_claim_settlement s
         LEFT JOIN insurance_claim_master cm ON s.claim_id = cm.claim_id
         WHERE s.claim_id = ?
         ORDER BY s.payment_date DESC`,
        [claimId]
    );
    return rows;
};

exports.getSettlementById = async (settlementId) => {
    const [rows] = await db.query(
        `SELECT s.*, cm.claim_number, cm.claim_amount, cm.approved_amount
         FROM insurance_claim_settlement s
         LEFT JOIN insurance_claim_master cm ON s.claim_id = cm.claim_id
         WHERE s.settlement_id = ?`,
        [settlementId]
    );
    return rows[0] || null;
};

exports.markPostedToLedger = async (settlementId) => {
    await db.query(
        'UPDATE insurance_claim_settlement SET posted_to_ledger = TRUE WHERE settlement_id = ?',
        [settlementId]
    );

    const [rows] = await db.query(
        'SELECT * FROM insurance_claim_settlement WHERE settlement_id = ?',
        [settlementId]
    );
    return rows[0] || null;
};

exports.getReceivableSummary = async () => {
    const [rows] = await db.query(
        `SELECT cm.claim_id, cm.claim_number, cm.claim_amount, cm.approved_amount,
                COALESCE(cm.settled_amount, 0) AS settled_amount,
                (cm.approved_amount - COALESCE(cm.settled_amount, 0)) AS outstanding_amount,
                cs.status_name AS claim_status,
                a.admission_no, p.uhid, p.first_name, p.last_name
         FROM insurance_claim_master cm
         LEFT JOIN master_claim_status cs ON cm.claim_status_id = cs.claim_status_id
         LEFT JOIN ipd_admission_master a ON cm.ipd_admission_id = a.ipd_admission_id
         LEFT JOIN patient_master p ON a.patient_id = p.patient_id
         WHERE cm.approved_amount > COALESCE(cm.settled_amount, 0)
         ORDER BY cm.created_at ASC`
    );
    return rows;
};

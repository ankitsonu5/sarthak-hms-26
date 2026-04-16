const { prisma } = require('../../../config/db');

exports.recordSettlement = async (payload) => {
    return prisma.$transaction(async (tx) => {
        const result = await tx.$queryRaw`
            INSERT INTO insurance_claim_settlement
            (claim_id, settled_amount, tds_amount, deduction_amount,
             payment_reference, payment_date, posted_to_ledger)
            VALUES (${payload.claim_id}, ${payload.settled_amount},
                    ${payload.tds_amount || null}, ${payload.deduction_amount || null},
                    ${payload.payment_reference || null}, ${payload.payment_date || null},
                    ${payload.posted_to_ledger || false})
            RETURNING *`;

        await tx.$executeRaw`
            UPDATE insurance_claim_master
            SET settled_amount = (
                SELECT COALESCE(SUM(settled_amount), 0)
                FROM insurance_claim_settlement
                WHERE claim_id = ${payload.claim_id}
            ), settlement_date = COALESCE(settlement_date, NOW())
            WHERE claim_id = ${payload.claim_id}`;

        return result[0];
    });
};

exports.getSettlementsByClaim = async (claimId) => {
    return prisma.$queryRaw`
        SELECT s.*, cm.claim_number
        FROM insurance_claim_settlement s
        LEFT JOIN insurance_claim_master cm ON s.claim_id = cm.claim_id
        WHERE s.claim_id = ${claimId}
        ORDER BY s.payment_date DESC`;
};

exports.getSettlementById = async (settlementId) => {
    const rows = await prisma.$queryRaw`
        SELECT s.*, cm.claim_number, cm.claim_amount, cm.approved_amount
        FROM insurance_claim_settlement s
        LEFT JOIN insurance_claim_master cm ON s.claim_id = cm.claim_id
        WHERE s.settlement_id = ${settlementId}`;
    return rows[0] || null;
};

exports.markPostedToLedger = async (settlementId) => {
    await prisma.$executeRaw`
        UPDATE insurance_claim_settlement SET posted_to_ledger = TRUE WHERE settlement_id = ${settlementId}`;

    const rows = await prisma.$queryRaw`
        SELECT * FROM insurance_claim_settlement WHERE settlement_id = ${settlementId}`;
    return rows[0] || null;
};

exports.getReceivableSummary = async () => {
    return prisma.$queryRaw`
        SELECT cm.claim_id, cm.claim_number, cm.claim_amount, cm.approved_amount,
               COALESCE(cm.settled_amount, 0) AS settled_amount,
               (cm.approved_amount - COALESCE(cm.settled_amount, 0)) AS outstanding_amount,
               cs.status_name AS claim_status,
               a.admission_no, p.uhid, p.first_name, p.last_name
        FROM insurance_claim_master cm
        LEFT JOIN master_claim_status cs ON cm.claim_status_id = cs.claim_status_id
        LEFT JOIN ipd_admission_master a ON cm.ipd_admission_id = a.ipd_admission_id
        LEFT JOIN patient_master p ON a.patient_id = p.patient_id
        WHERE cm.approved_amount > COALESCE(cm.settled_amount, 0)
        ORDER BY cm.created_at ASC`;
};

const BaseJob = require('../core/base/BaseJob');
const db = require('../config/db');

class InsuranceAgingJob extends BaseJob {
    constructor() {
        super('insurance-aging');
    }

    async execute() {
        const conn = await db.getConnection();
        try {
            await conn.query(`
                UPDATE insurance_claim_master SET
                    aging_days = DATEDIFF(NOW(), submitted_at),
                    aging_bucket = CASE
                        WHEN DATEDIFF(NOW(), submitted_at) <= 30 THEN '0-30'
                        WHEN DATEDIFF(NOW(), submitted_at) <= 60 THEN '31-60'
                        WHEN DATEDIFF(NOW(), submitted_at) <= 90 THEN '61-90'
                        ELSE '90+'
                    END,
                    is_sla_breached = IF(sla_due_date IS NOT NULL AND CURDATE() > sla_due_date AND settled_amount IS NULL, TRUE, COALESCE(is_sla_breached, FALSE))
                WHERE submitted_at IS NOT NULL
            `);
            const [[r]] = await conn.query('SELECT ROW_COUNT() AS n');
            return { updated: r?.n || 0 };
        } finally {
            conn.release();
        }
    }
}

module.exports = new InsuranceAgingJob();

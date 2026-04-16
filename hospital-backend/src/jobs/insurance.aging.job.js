const BaseJob = require('../core/base/BaseJob');
const { prisma } = require('../config/db');

class InsuranceAgingJob extends BaseJob {
    constructor() {
        super('insurance-aging');
    }

    async execute() {
        const result = await prisma.$executeRaw`
            UPDATE insurance_claim_master SET
                aging_days = EXTRACT(DAY FROM NOW() - submitted_at)::int,
                aging_bucket = CASE
                    WHEN EXTRACT(DAY FROM NOW() - submitted_at) <= 30 THEN '0-30'
                    WHEN EXTRACT(DAY FROM NOW() - submitted_at) <= 60 THEN '31-60'
                    WHEN EXTRACT(DAY FROM NOW() - submitted_at) <= 90 THEN '61-90'
                    ELSE '90+'
                END,
                is_sla_breached = CASE
                    WHEN sla_due_date IS NOT NULL AND CURRENT_DATE > sla_due_date AND settled_amount IS NULL THEN TRUE
                    ELSE COALESCE(is_sla_breached, FALSE)
                END
            WHERE submitted_at IS NOT NULL
        `;
        return { updated: result };
    }
}

module.exports = new InsuranceAgingJob();

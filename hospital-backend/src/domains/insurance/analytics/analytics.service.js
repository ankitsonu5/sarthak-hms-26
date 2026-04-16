const { prisma } = require('../../../config/db');

exports.refreshDenialAnalytics = async () => {
    await prisma.$executeRaw`
        INSERT INTO insurance_claim_denial_analytics
        (rejection_reason_id, insurance_company_id, department_id, month_year, denial_count, total_rejected_amount)
        SELECT
            cr.rejection_reason_id,
            cm.insurance_company_id,
            a.department_id,
            TO_CHAR(cm.created_at, 'YYYY-MM') AS month_year,
            COUNT(*) AS denial_count,
            COALESCE(SUM(cr.rejection_amount), 0) AS total_rejected_amount
        FROM insurance_claim_rejection cr
        JOIN insurance_claim_master cm ON cr.claim_id = cm.claim_id
        JOIN ipd_admission_master a ON cm.ipd_admission_id = a.ipd_admission_id
        GROUP BY cr.rejection_reason_id, cm.insurance_company_id, a.department_id, TO_CHAR(cm.created_at, 'YYYY-MM')
        ON CONFLICT (rejection_reason_id, insurance_company_id, department_id, month_year)
        DO UPDATE SET
            denial_count = EXCLUDED.denial_count,
            total_rejected_amount = EXCLUDED.total_rejected_amount,
            updated_at = NOW()
    `;
    const rows = await prisma.$queryRaw`SELECT COUNT(*)::int AS cnt FROM insurance_claim_denial_analytics`;
    return { refreshed: true, record_count: rows[0]?.cnt || 0 };
};

exports.getDenialAnalytics = async (filters = {}) => {
    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (filters.month_year) {
        conditions.push(`da.month_year = $${paramIdx++}`);
        params.push(filters.month_year);
    }
    if (filters.insurance_company_id) {
        conditions.push(`da.insurance_company_id = $${paramIdx++}`);
        params.push(filters.insurance_company_id);
    }

    const whereClause = conditions.length ? `AND ${conditions.join(' AND ')}` : '';
    const sql = `
        SELECT da.*, rr.reason_name, ic.company_name
        FROM insurance_claim_denial_analytics da
        LEFT JOIN master_claim_rejection_reason rr ON da.rejection_reason_id = rr.rejection_reason_id
        LEFT JOIN master_insurance_company ic ON da.insurance_company_id = ic.insurance_company_id
        WHERE 1=1 ${whereClause}
        ORDER BY da.month_year DESC, da.total_rejected_amount DESC
    `;
    const rows = await prisma.$queryRawUnsafe(sql, ...params);
    return rows;
};

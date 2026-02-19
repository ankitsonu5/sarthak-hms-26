const db = require('../../../config/db');

exports.refreshDenialAnalytics = async () => {
    const conn = await db.getConnection();
    try {
        await conn.query(`
            INSERT INTO insurance_claim_denial_analytics
            (rejection_reason_id, insurance_company_id, department_id, month_year, denial_count, total_rejected_amount)
            SELECT
                cr.rejection_reason_id,
                cm.insurance_company_id,
                a.department_id,
                DATE_FORMAT(cm.created_at, '%Y-%m') AS month_year,
                COUNT(*) AS denial_count,
                COALESCE(SUM(cr.rejection_amount), 0) AS total_rejected_amount
            FROM insurance_claim_rejection cr
            JOIN insurance_claim_master cm ON cr.claim_id = cm.claim_id
            JOIN ipd_admission_master a ON cm.ipd_admission_id = a.ipd_admission_id
            GROUP BY cr.rejection_reason_id, cm.insurance_company_id, a.department_id, DATE_FORMAT(cm.created_at, '%Y-%m')
            ON DUPLICATE KEY UPDATE
                denial_count = VALUES(denial_count),
                total_rejected_amount = VALUES(total_rejected_amount),
                updated_at = NOW()
        `);
        const [rows] = await conn.query('SELECT COUNT(*) AS cnt FROM insurance_claim_denial_analytics');
        return { refreshed: true, record_count: rows[0]?.cnt || 0 };
    } finally {
        conn.release();
    }
};

exports.getDenialAnalytics = async (filters = {}) => {
    let sql = `
        SELECT da.*, rr.reason_name, ic.company_name
        FROM insurance_claim_denial_analytics da
        LEFT JOIN master_claim_rejection_reason rr ON da.rejection_reason_id = rr.rejection_reason_id
        LEFT JOIN master_insurance_company ic ON da.insurance_company_id = ic.insurance_company_id
        WHERE 1=1
    `;
    const params = [];
    if (filters.month_year) {
        sql += ' AND da.month_year = ?';
        params.push(filters.month_year);
    }
    if (filters.insurance_company_id) {
        sql += ' AND da.insurance_company_id = ?';
        params.push(filters.insurance_company_id);
    }
    sql += ' ORDER BY da.month_year DESC, da.total_rejected_amount DESC';
    const [rows] = await db.query(sql, params);
    return rows;
};

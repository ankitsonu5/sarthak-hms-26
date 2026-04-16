const { prisma } = require('../../../config/db');

exports.createPreAuth = async (payload, userId) => {
    return prisma.$transaction(async (tx) => {
        const result = await tx.$queryRaw`
            INSERT INTO insurance_pre_authorization
            (ipd_admission_id, insurance_company_id, tpa_id, policy_number,
             requested_amount, diagnosis_summary, proposed_treatment,
             preauth_status_id, created_by)
            VALUES (${payload.ipd_admission_id}, ${payload.insurance_company_id},
                    ${payload.tpa_id || null}, ${payload.policy_number},
                    ${payload.requested_amount}, ${payload.diagnosis_summary || null},
                    ${payload.proposed_treatment || null}, ${payload.preauth_status_id},
                    ${userId})
            RETURNING *`;
        return result[0];
    });
};

exports.updatePreauthStatus = async (preauthId, payload, userId) => {
    return prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
            UPDATE insurance_pre_authorization
            SET preauth_status_id = ${payload.preauth_status_id},
                approved_amount = ${payload.approved_amount || null},
                rejection_reason = ${payload.rejection_reason || null},
                responded_at = NOW(), updated_by = ${userId}, updated_at = NOW()
            WHERE preauth_id = ${preauthId}`;

        const preauth = await tx.$queryRaw`
            SELECT pa.*, ps.status_name AS preauth_status,
                   ic.insurance_company_id, t.tpa_id
            FROM insurance_pre_authorization pa
            LEFT JOIN master_preauth_status ps ON pa.preauth_status_id = ps.preauth_status_id
            LEFT JOIN master_insurance_company ic ON pa.insurance_company_id = ic.insurance_company_id
            LEFT JOIN master_tpa t ON pa.tpa_id = t.tpa_id
            WHERE pa.preauth_id = ${preauthId}`;
        return preauth[0];
    });
};

exports.getPreauthById = async (preauthId) => {
    const rows = await prisma.$queryRaw`
        SELECT pa.*, ps.status_name AS preauth_status,
               ic.insurance_company_id, t.tpa_id
        FROM insurance_pre_authorization pa
        LEFT JOIN master_preauth_status ps ON pa.preauth_status_id = ps.preauth_status_id
        LEFT JOIN master_insurance_company ic ON pa.insurance_company_id = ic.insurance_company_id
        LEFT JOIN master_tpa t ON pa.tpa_id = t.tpa_id
        WHERE pa.preauth_id = ${preauthId}`;
    return rows[0] || null;
};

exports.getPreauthsByAdmission = async (admissionId) => {
    return prisma.$queryRaw`
        SELECT pa.*, ps.status_name AS preauth_status
        FROM insurance_pre_authorization pa
        LEFT JOIN master_preauth_status ps ON pa.preauth_status_id = ps.preauth_status_id
        WHERE pa.ipd_admission_id = ${admissionId}
        ORDER BY pa.requested_at DESC`;
};

exports.getAllPreAuths = async () => {
    return prisma.$queryRaw`
        SELECT pa.*, ps.status_name AS preauth_status,
               a.admission_no, p.uhid, p.first_name, p.last_name
        FROM insurance_pre_authorization pa
        LEFT JOIN master_preauth_status ps ON pa.preauth_status_id = ps.preauth_status_id
        LEFT JOIN ipd_admission_master a ON pa.ipd_admission_id = a.ipd_admission_id
        LEFT JOIN patient_master p ON a.patient_id = p.patient_id
        ORDER BY pa.requested_at DESC`;
};

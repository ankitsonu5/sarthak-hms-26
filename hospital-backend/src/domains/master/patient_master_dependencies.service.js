const { prisma } = require('../../config/db');

const ALLOWED_TABLES = [
    'master_gender', 'master_nationality', 'master_religion',
    'master_id_proof_type', 'master_state', 'master_district',
    'master_city', 'master_pincode', 'master_language',
    'master_title', 'master_referral_source', 'master_death_cause',
    'master_education_level', 'master_marital_status', 'master_occupation',
    'master_patient_category', 'master_relationship', 'master_blood_group',
    'master_socio_economic_class',
    'master_ward', 'master_bed',
    'master_department', 'master_doctor', 'master_doctor_schedule',
    'master_visit_type', 'master_appointment_type', 'master_queue_type',
    'master_visit_reason', 'master_encounter_status', 'master_opd_room',
    'master_payment_mode', 'master_payment_status',
    'master_insurance_company', 'master_tpa',
    'master_admission_type', 'master_admission_status',
    'master_risk_category', 'master_ward_type',
    'master_bed_status', 'master_bed_type',
    'master_authorization_status', 'master_billing_type',
    'master_consent_type', 'master_icd10',
    'master_order_category', 'master_order_type',
    'master_order_priority', 'master_order_status',
    'master_frequency', 'master_route', 'master_dose_unit',
    'master_result_type', 'master_specimen_type',
    'master_order_cancel_reason', 'master_order_approval_role',
    'master_service',
    'master_preauth_status', 'master_claim_status',
    'master_claim_document_type', 'master_claim_rejection_reason',
    'master_escalation_role'
];

const PK_OVERRIDES = {
    'master_patient_category': 'category_id',
    'master_socio_economic_class': 'class_id',
    'master_doctor_schedule': 'schedule_id',
    'master_order_cancel_reason': 'cancel_reason_id',
    'master_order_approval_role': 'approval_role_id',
    'master_claim_document_type': 'document_type_id',
    'master_claim_rejection_reason': 'rejection_reason_id',
    'master_escalation_role': 'escalation_role_id'
};

const getPkName = (t) => PK_OVERRIDES[t] || t.replace('master_', '') + '_id';

exports.getRegistrationMasters = async () => {
    const genders = await prisma.$queryRaw`SELECT * FROM master_gender WHERE is_active = TRUE ORDER BY gender_name`;
    const titles = await prisma.$queryRaw`SELECT * FROM master_title WHERE is_active = TRUE ORDER BY title_name`;
    const nationalities = await prisma.$queryRaw`SELECT * FROM master_nationality WHERE is_active = TRUE ORDER BY nationality_name`;
    const religions = await prisma.$queryRaw`SELECT * FROM master_religion WHERE is_active = TRUE ORDER BY religion_name`;
    const idProofTypes = await prisma.$queryRaw`SELECT * FROM master_id_proof_type WHERE is_active = TRUE ORDER BY proof_type_name`;
    const referralSources = await prisma.$queryRaw`SELECT * FROM master_referral_source WHERE is_active = TRUE ORDER BY source_name`;
    const states = await prisma.$queryRaw`SELECT * FROM master_state WHERE is_active = TRUE ORDER BY state_name`;

    return { genders, titles, nationalities, religions, idProofTypes, referralSources, states };
};

exports.addCity = async (body) => {
    const result = await prisma.$queryRaw`
        INSERT INTO master_city (city_name, district_id, pincode)
        VALUES (${body.city_name}, ${body.district_id}, ${body.pincode || null})
        RETURNING *`;
    return result[0];
};

exports.addReferralSource = async (body) => {
    const result = await prisma.$queryRaw`
        INSERT INTO master_referral_source (source_name, source_type)
        VALUES (${body.source_name}, ${body.source_type || 'Other'})
        RETURNING *`;
    return result[0];
};

exports.deleteMasterData = async (tableName, id) => {
    if (!ALLOWED_TABLES.includes(tableName)) throw new Error(`Table ${tableName} is not allowed`);
    const pk = getPkName(tableName);
    await prisma.$executeRawUnsafe(`UPDATE ${tableName} SET is_active = FALSE WHERE ${pk} = $1`, id);
    return { message: 'Deleted successfully' };
};

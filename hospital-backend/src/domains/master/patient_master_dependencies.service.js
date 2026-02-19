const db = require('../../config/db');

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
    const [results] = await db.query('CALL sp_get_patient_registration_masters()');
    return {
        genders: results[0] || [],
        titles: results[1] || [],
        nationalities: results[2] || [],
        religions: results[3] || [],
        idProofTypes: results[4] || [],
        referralSources: results[5] || [],
        states: results[6] || []
    };
};

exports.addCity = async (body) => {
    await db.query('CALL sp_add_master_city(?, ?, ?, @out_id)', [body.city_name, body.district_id, body.pincode || null]);
    const [[r]] = await db.query('SELECT @out_id AS city_id');
    const cityId = r?.city_id;
    const [city] = await db.query('SELECT * FROM master_city WHERE city_id = ?', [cityId]);
    return city[0];
};

exports.addReferralSource = async (body) => {
    await db.query('CALL sp_add_referral_source(?, ?, @out_id)', [body.source_name, body.source_type || 'Other']);
    const [[r]] = await db.query('SELECT @out_id AS source_id');
    const sourceId = r?.source_id;
    const [src] = await db.query('SELECT * FROM master_referral_source WHERE referral_source_id = ?', [sourceId]);
    return src[0];
};

exports.deleteMasterData = async (tableName, id) => {
    if (!ALLOWED_TABLES.includes(tableName)) throw new Error(`Table ${tableName} is not allowed`);
    const pk = getPkName(tableName);
    await db.query(`UPDATE ${tableName} SET is_active = FALSE WHERE ${pk} = ?`, [id]);
    return { message: 'Deleted successfully' };
};

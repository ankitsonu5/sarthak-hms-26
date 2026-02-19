const db = require('../../config/db');

const ALLOWED_TABLES = [
    'master_gender', 'master_nationality', 'master_religion',
    'master_id_proof_type', 'master_state', 'master_district',
    'master_city', 'master_pincode', 'master_language',
    'master_title', 'master_death_cause',
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
    // Insurance Claim Engine Masters (009)
    'master_preauth_status', 'master_claim_status',
    'master_claim_document_type', 'master_claim_rejection_reason'
];

const PK_OVERRIDES = {
    'master_patient_category': 'category_id',
    'master_socio_economic_class': 'class_id',
    'master_doctor_schedule': 'schedule_id',
    'master_order_cancel_reason': 'cancel_reason_id',
    'master_order_approval_role': 'approval_role_id',
    'master_claim_document_type': 'document_type_id',
    'master_claim_rejection_reason': 'rejection_reason_id'
};

const getPkName = (tableName) => PK_OVERRIDES[tableName] || tableName.replace('master_', '') + '_id';

exports.getRegistrationMasters = async () => {
    const [results] = await db.query('CALL sp_get_patient_registration_masters()');

    return {
        genders: results[0] || [],
        titles: results[1] || [],
        nationalities: results[2] || [],
        religions: results[3] || [],
        id_proof_types: results[4] || [],
        referral_sources: results[5] || [],
        states: results[6] || []
    };
};

exports.addCity = async (payload) => {
    await db.query('CALL sp_add_master_city(?, ?, ?, @p_city_id)', [
        payload.city_name,
        payload.district_id,
        payload.pincode || null
    ]);
    const [outParams] = await db.query('SELECT @p_city_id as city_id');
    return { city_id: outParams[0].city_id };
};

exports.addReferralSource = async (payload) => {
    await db.query('CALL sp_add_referral_source(?, ?, @p_source_id)', [
        payload.source_name,
        payload.source_type
    ]);
    const [outParams] = await db.query('SELECT @p_source_id as source_id');
    return { source_id: outParams[0].source_id };
};

exports.addMasterData = async (tableName, data) => {
    if (!ALLOWED_TABLES.includes(tableName)) {
        throw new Error('Invalid master table');
    }

    if (Array.isArray(data)) {
        if (data.length === 0) return { affectedRows: 0 };
        const keys = Object.keys(data[0]);
        const values = data.map(item => keys.map(key => item[key]));
        const [result] = await db.query(`INSERT INTO ?? (??) VALUES ?`, [tableName, keys, values]);
        return { affectedRows: result.affectedRows, message: 'Bulk insert successful' };
    } else {
        const [result] = await db.query(`INSERT INTO ?? SET ?`, [tableName, data]);
        return { id: result.insertId, message: 'Single record inserted' };
    }
};

exports.deleteMasterData = async (tableName, id) => {
    if (!ALLOWED_TABLES.includes(tableName)) {
        throw new Error('Invalid master table');
    }

    const idColumn = getPkName(tableName);
    const [result] = await db.query(`DELETE FROM ?? WHERE ?? = ?`, [tableName, idColumn, id]);
    return { affectedRows: result.affectedRows, message: 'Record deleted successfully' };
};

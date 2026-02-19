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

const assertAllowed = (tableName) => {
    if (!ALLOWED_TABLES.includes(tableName)) {
        throw new Error(`Table ${tableName} is not allowed`);
    }
};

exports.getAll = async (tableName) => {
    assertAllowed(tableName);
    const [rows] = await db.query(`SELECT * FROM ${tableName} WHERE is_active = TRUE`);
    return rows;
};

exports.getById = async (tableName, id) => {
    assertAllowed(tableName);
    const pk = getPkName(tableName);
    const [rows] = await db.query(`SELECT * FROM ${tableName} WHERE ${pk} = ?`, [id]);
    return rows[0] || null;
};

exports.create = async (tableName, body) => {
    assertAllowed(tableName);
    const pk = getPkName(tableName);
    const keys = Object.keys(body).filter(k => k !== pk);
    const cols = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const [r] = await db.query(
        `INSERT INTO ${tableName} (${cols}) VALUES (${placeholders})`,
        keys.map(k => body[k])
    );
    const [row] = await db.query(`SELECT * FROM ${tableName} WHERE ${pk} = ?`, [r.insertId]);
    return row[0];
};

exports.update = async (tableName, id, body) => {
    assertAllowed(tableName);
    const pk = getPkName(tableName);
    const keys = Object.keys(body).filter(k => k !== pk);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    await db.query(
        `UPDATE ${tableName} SET ${setClause} WHERE ${pk} = ?`,
        [...keys.map(k => body[k]), id]
    );
    const [row] = await db.query(`SELECT * FROM ${tableName} WHERE ${pk} = ?`, [id]);
    return row[0];
};

exports.delete = async (tableName, id) => {
    assertAllowed(tableName);
    const pk = getPkName(tableName);
    await db.query(`UPDATE ${tableName} SET is_active = FALSE WHERE ${pk} = ?`, [id]);
    const [row] = await db.query(`SELECT * FROM ${tableName} WHERE ${pk} = ?`, [id]);
    return row[0];
};

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

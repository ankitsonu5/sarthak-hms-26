const db = require('../../config/db');

/**
 * Generic Master Service for all Master Tables
 * Standardizes CRUD operations across the system.
 */

// Whitelist of allowed master tables for security
const ALLOWED_TABLES = [
    // Patient Registration Masters (008)
    'master_gender', 'master_nationality', 'master_religion',
    'master_id_proof_type', 'master_state', 'master_district',
    'master_city', 'master_pincode', 'master_language',
    'master_title', 'master_referral_source', 'master_death_cause',
    // Patient Registration Schema
    'master_education_level', 'master_marital_status', 'master_occupation',
    'master_patient_category', 'master_relationship', 'master_blood_group',
    'master_socio_economic_class',
    // IPD Core Masters
    'master_ward', 'master_bed',
    // OPD Appointment Masters (003)
    'master_department', 'master_doctor', 'master_doctor_schedule',
    'master_visit_type', 'master_appointment_type', 'master_queue_type',
    'master_visit_reason', 'master_encounter_status', 'master_opd_room',
    'master_payment_mode', 'master_payment_status',
    'master_insurance_company', 'master_tpa',
    // IPD Admission Masters (004)
    'master_admission_type', 'master_admission_status',
    'master_risk_category', 'master_ward_type',
    'master_bed_status', 'master_bed_type',
    'master_authorization_status', 'master_billing_type',
    'master_consent_type', 'master_icd10',
    // Doctor Order Engine Masters (005)
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

/**
 * 1. GET ALL records from a master table
 */
exports.getAll = async (tableName) => {
    if (!ALLOWED_TABLES.includes(tableName)) throw new Error('Invalid table');
    const [rows] = await db.query(`SELECT * FROM ?? WHERE is_active = TRUE`, [tableName]);
    return rows;
};

/**
 * 2. GET SINGLE record by ID
 */
exports.getById = async (tableName, id) => {
    if (!ALLOWED_TABLES.includes(tableName)) throw new Error('Invalid table');
    const pk = getPkName(tableName);
    const [rows] = await db.query(`SELECT * FROM ?? WHERE ?? = ?`, [tableName, pk, id]);
    return rows[0];
};

/**
 * 3. CREATE record(s) - Supports single object or array for bulk
 */
exports.create = async (tableName, data) => {
    if (!ALLOWED_TABLES.includes(tableName)) throw new Error('Invalid table');

    if (Array.isArray(data)) {
        if (data.length === 0) return { affectedRows: 0 };
        const keys = Object.keys(data[0]);
        const values = data.map(item => keys.map(key => item[key]));
        const [result] = await db.query(`INSERT INTO ?? (??) VALUES ?`, [tableName, keys, values]);
        return { affectedRows: result.affectedRows, message: 'Bulk insert success' };
    } else {
        const [result] = await db.query(`INSERT INTO ?? SET ?`, [tableName, data]);
        return { id: result.insertId, message: 'Record created' };
    }
};

/**
 * 4. UPDATE record by ID
 */
exports.update = async (tableName, id, data) => {
    if (!ALLOWED_TABLES.includes(tableName)) throw new Error('Invalid table');
    const pk = getPkName(tableName);
    const [result] = await db.query(`UPDATE ?? SET ? WHERE ?? = ?`, [tableName, data, pk, id]);
    return { affectedRows: result.affectedRows };
};

/**
 * 5. DELETE record (Soft Delete)
 */
exports.delete = async (tableName, id) => {
    if (!ALLOWED_TABLES.includes(tableName)) throw new Error('Invalid table');
    const pk = getPkName(tableName);
    // Standard HMS practice: Soft delete to preserve referential integrity
    const [result] = await db.query(`UPDATE ?? SET is_active = FALSE WHERE ?? = ?`, [tableName, pk, id]);
    return { affectedRows: result.affectedRows, message: 'Record deactivated' };
};

/**
 * 6. SPECIAL: Get all Patient Registration Masters in one call (for dropdowns)
 */
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

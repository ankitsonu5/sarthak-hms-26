const Joi = require('joi');

exports.createAdmission = Joi.object({
    patient_id: Joi.number().integer().positive().required(),
    opd_visit_id: Joi.number().integer().positive().allow(null),
    admission_date: Joi.date().iso().allow(null),
    admission_type: Joi.string().valid('Emergency', 'Planned', 'Direct').required(),
    hospital_branch_id: Joi.number().integer().positive().required(),
    department_id: Joi.number().integer().positive().required(),
    admitting_doctor_id: Joi.number().integer().positive().required(),
    consultant_doctor_id: Joi.number().integer().positive().allow(null),
    patient_category: Joi.string().required(),
    primary_diagnosis: Joi.string().max(255).allow(null, ''),
    provisional_diagnosis: Joi.string().max(255).allow(null, ''),
    icd10_code: Joi.string().max(20).allow(null, ''),
    expected_discharge_date: Joi.date().iso().allow(null),
    is_mlc: Joi.boolean().default(false),
    mlc_number: Joi.string().max(50).allow(null, ''),

    clinical_details: Joi.object({
        chief_complaint: Joi.string().allow(null, ''),
        past_medical_history: Joi.string().allow(null, ''),
        allergies: Joi.string().allow(null, ''),
        current_medication: Joi.string().allow(null, ''),
        comorbidities: Joi.string().allow(null, ''),
        risk_category: Joi.string().valid('Low', 'Moderate', 'High', 'Critical').default('Low'),
        pregnancy_status: Joi.boolean().default(false),
        dnr_status: Joi.boolean().default(false)
    }).allow(null),

    bed_allocation: Joi.object({
        ward_id: Joi.number().integer().positive().required(),
        bed_id: Joi.number().integer().positive().required(),
        bed_type: Joi.string().required(),
        allocation_start: Joi.date().iso().allow(null),
        isolation_required: Joi.boolean().default(false)
    }).allow(null),

    vitals_monitoring: Joi.object().allow(null),
    insurance_details: Joi.object().allow(null),
    financials: Joi.object().allow(null)
});

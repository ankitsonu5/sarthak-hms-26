const Joi = require('joi');

exports.createIPDOrder = Joi.object({
    ipd_admission_id: Joi.number().integer().positive().required(),
    doctor_id: Joi.number().integer().positive().required(),
    priority: Joi.string().valid('Routine', 'Urgent', 'STAT', 'Emergency').default('Routine'),
    order_source: Joi.string().default('Manual'),
    verbal_order_flag: Joi.boolean().default(false),
    verbal_order_verified_by: Joi.number().integer().positive().allow(null),
    clinical_notes: Joi.string().allow(null, ''),
    is_package_case: Joi.boolean().default(false),
    items: Joi.array().items(Joi.object({
        order_type: Joi.string().valid('Medication', 'Lab', 'Radiology', 'Diet', 'Nursing').required(),
        reference_code: Joi.string().allow(null, ''),
        scheduled_datetime: Joi.date().iso().allow(null),
        is_critical: Joi.boolean().default(false),
        remarks: Joi.string().allow(null, ''),
        medication_details: Joi.object().allow(null),
        lab_details: Joi.object().allow(null),
        radiology_details: Joi.object().allow(null),
        diet_details: Joi.object().allow(null),
        nursing_details: Joi.object().allow(null),
        billing_details: Joi.object().allow(null)
    })).min(1).required()
});

exports.createCPOEOrder = Joi.object({
    patient_id: Joi.number().integer().positive().required(),
    admission_id: Joi.number().integer().positive().allow(null),
    encounter_id: Joi.number().integer().positive().allow(null),
    order_type: Joi.string().required(),
    priority: Joi.string().valid('Routine', 'Urgent', 'STAT', 'Emergency').default('Routine'),
    clinical_indication: Joi.string().allow(null, ''),
    items: Joi.array().items(Joi.object({
        category: Joi.string().required(),
        name: Joi.string().required(),
        quantity: Joi.number().integer().positive().default(1)
    }).unknown(true)).min(1).required()
});

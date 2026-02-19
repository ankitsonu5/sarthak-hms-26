const Joi = require('joi');

exports.createDischarge = Joi.object({
    admission_id: Joi.number().integer().positive().required(),
    patient_id: Joi.number().integer().positive().required(),
    discharge_type: Joi.string().valid('Normal', 'LAMA', 'Absconded', 'Expired', 'Referral').required(),
    discharge_date: Joi.date().iso().required(),
    condition_at_discharge: Joi.string().max(255).allow(null, ''),
    discharge_notes: Joi.string().allow(null, ''),

    diagnosis: Joi.array().items(Joi.object({
        type: Joi.string().required(),
        icd_code: Joi.string().max(20).allow(null, ''),
        name: Joi.string().required(),
        remarks: Joi.string().allow(null, '')
    })).allow(null),

    medications: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        dosage: Joi.string().allow(null, ''),
        frequency: Joi.string().allow(null, ''),
        duration: Joi.string().allow(null, ''),
        route: Joi.string().allow(null, ''),
        instructions: Joi.string().allow(null, '')
    })).allow(null),

    followup: Joi.object({
        date: Joi.date().iso().required(),
        instructions: Joi.string().allow(null, '')
    }).allow(null)
});

const Joi = require('joi');

exports.createObservation = Joi.object({
    admission_id: Joi.number().integer().positive().required(),
    observation_datetime: Joi.date().iso().allow(null),
    shift_type: Joi.string().valid('Morning', 'Afternoon', 'Night').required(),
    vitals: Joi.object({
        blood_pressure: Joi.string().max(20).allow(null),
        pulse_rate: Joi.number().integer().allow(null),
        temperature: Joi.number().allow(null),
        spo2: Joi.number().allow(null),
        respiratory_rate: Joi.number().integer().allow(null),
        gcs_score: Joi.number().integer().min(3).max(15).allow(null)
    }).allow(null),
    io: Joi.object({
        oral_intake: Joi.number().allow(null),
        iv_intake: Joi.number().allow(null),
        urine_output: Joi.number().allow(null),
        drain_output: Joi.number().allow(null)
    }).allow(null),
    remarks: Joi.string().allow(null, '')
});

exports.recordMAR = Joi.object({
    medication_order_id: Joi.number().integer().positive().required(),
    administration_datetime: Joi.date().iso().required(),
    dose_given: Joi.string().required(),
    site: Joi.string().allow(null, ''),
    remarks: Joi.string().allow(null, '')
});

exports.addNote = Joi.object({
    admission_id: Joi.number().integer().positive().required(),
    note_type: Joi.string().valid('Progress', 'Handover', 'Incident', 'General').default('General'),
    note_text: Joi.string().required()
});

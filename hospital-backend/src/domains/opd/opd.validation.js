const Joi = require('joi');

exports.createVisit = Joi.object({
    patient_id: Joi.number().integer().positive().required(),
    doctor_id: Joi.number().integer().positive().required(),
    department_id: Joi.number().integer().positive().required(),
    visit_type: Joi.string().valid('New', 'Follow-up', 'Review').default('New'),
    appointment_type: Joi.string().valid('Walk-In', 'Pre-Booked', 'Emergency').default('Walk-In'),
    visit_reason: Joi.string().max(255).allow(null, ''),
    chief_complaint: Joi.string().max(500).allow(null, ''),
    vitals: Joi.object({
        blood_pressure: Joi.string().max(20).allow(null),
        pulse_rate: Joi.number().integer().allow(null),
        temperature: Joi.number().allow(null),
        spo2: Joi.number().allow(null),
        weight_kg: Joi.number().allow(null),
        height_cm: Joi.number().allow(null)
    }).allow(null),
    consultation_fee: Joi.number().precision(2).allow(null),
    payment_mode: Joi.string().allow(null, '')
});

const Joi = require('joi');

exports.create = Joi.object({
    ipd_admission_id: Joi.number().integer().positive().required(),
    insurance_company_id: Joi.number().integer().positive().required(),
    tpa_id: Joi.number().integer().positive().allow(null),
    policy_number: Joi.string().max(50).required(),
    requested_amount: Joi.number().precision(2).positive().required(),
    diagnosis_summary: Joi.string().allow(null, ''),
    proposed_treatment: Joi.string().allow(null, ''),
    preauth_status_id: Joi.number().integer().positive().required()
});

exports.updateStatus = Joi.object({
    preauth_status_id: Joi.number().integer().positive().required(),
    approved_amount: Joi.number().precision(2).min(0).allow(null),
    rejection_reason: Joi.string().allow(null, '')
});

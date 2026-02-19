const Joi = require('joi');

exports.submit = Joi.object({
    ipd_admission_id: Joi.number().integer().positive().required(),
    preauth_id: Joi.number().integer().positive().allow(null),
    insurance_company_id: Joi.number().integer().positive().required(),
    tpa_id: Joi.number().integer().positive().allow(null),
    claim_number: Joi.string().max(50).allow(null, ''),
    claim_amount: Joi.number().precision(2).positive().required(),
    claim_status_id: Joi.number().integer().positive().required()
});

exports.updateStatus = Joi.object({
    claim_status_id: Joi.number().integer().positive().required(),
    approved_amount: Joi.number().precision(2).min(0).allow(null),
    settled_amount: Joi.number().precision(2).min(0).allow(null),
    settlement_date: Joi.date().allow(null),
    remarks: Joi.string().allow(null, '')
});

exports.addRejection = Joi.object({
    rejection_reason_id: Joi.number().integer().positive().required(),
    rejection_amount: Joi.number().precision(2).min(0).allow(null),
    remarks: Joi.string().allow(null, '')
});

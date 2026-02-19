const Joi = require('joi');

exports.record = Joi.object({
    claim_id: Joi.number().integer().positive().required(),
    settled_amount: Joi.number().precision(2).positive().required(),
    tds_amount: Joi.number().precision(2).min(0).allow(null),
    deduction_amount: Joi.number().precision(2).min(0).allow(null),
    payment_reference: Joi.string().max(100).allow(null, ''),
    payment_date: Joi.date().allow(null),
    posted_to_ledger: Joi.boolean().default(false)
});

const Joi = require('joi');

exports.create = Joi.object({
    claim_id: Joi.number().integer().positive().required(),
    escalation_level: Joi.number().integer().positive().required(),
    escalation_to_role_id: Joi.number().integer().positive().allow(null),
    escalation_due_date: Joi.date().required(),
    remarks: Joi.string().allow(null, '')
});

exports.acknowledge = Joi.object({
    resolution_remarks: Joi.string().allow(null, '')
});

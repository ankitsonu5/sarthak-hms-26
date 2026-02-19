const Joi = require('joi');

exports.upload = Joi.object({
    claim_id: Joi.number().integer().positive().allow(null),
    preauth_id: Joi.number().integer().positive().allow(null),
    document_type_id: Joi.number().integer().positive().required(),
    file_name: Joi.string().max(255).required(),
    file_path: Joi.string().max(500).required()
}).or('claim_id', 'preauth_id');

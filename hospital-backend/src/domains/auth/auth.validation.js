const Joi = require('joi');

exports.register = Joi.object({
    full_name: Joi.string().max(150).required(),
    email: Joi.string().email().max(150).required(),
    phone: Joi.string().max(20).allow(null, ''),
    password: Joi.string().min(6).required(),
    role_id: Joi.number().integer().positive().required(),
    hospital_id: Joi.number().integer().positive().allow(null)
});

exports.login = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

exports.refresh = Joi.object({
    refreshToken: Joi.string().required()
});

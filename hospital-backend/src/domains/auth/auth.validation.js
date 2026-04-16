const Joi = require('joi');

exports.register = Joi.object({
    employee_id: Joi.string().max(50).allow(null, ''),
    full_name: Joi.string().max(150).required(),
    email: Joi.string().email().max(150).required(),
    phone: Joi.string().max(20).allow(null, ''),
    password: Joi.string().min(6).required(),
    role_id: Joi.number().integer().positive().required(),
    hospital_id: Joi.number().integer().positive().allow(null),
    branch_id: Joi.number().integer().positive().allow(null),
});

exports.login = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    deviceId: Joi.string().allow(null, ''),
    deviceType: Joi.string().valid('WEB', 'MOBILE', 'TABLET').default('WEB'),
});

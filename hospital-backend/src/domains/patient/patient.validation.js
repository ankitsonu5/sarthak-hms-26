const Joi = require('joi');

exports.registerPatient = Joi.object({
    first_name: Joi.string().max(100).required(),
    middle_name: Joi.string().max(100).allow(null, ''),
    last_name: Joi.string().max(100).required(),
    date_of_birth: Joi.date().iso().required(),
    gender: Joi.string().valid('Male', 'Female', 'Other', 'Transgender', 'Prefer not to say').required(),
    mobile_primary: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
    mobile_alternate: Joi.string().pattern(/^[0-9]{10,15}$/).allow(null, ''),
    email: Joi.string().email().allow(null, ''),
    nationality: Joi.string().max(50).default('Indian'),
    hospital_branch_id: Joi.number().integer().positive().required(),
    patient_category_id: Joi.number().integer().positive().required(),
    is_vip: Joi.boolean().default(false),
    is_mlc: Joi.boolean().default(false),
    is_unknown_patient: Joi.boolean().default(false),

    demographics: Joi.object({
        marital_status_id: Joi.number().integer().positive().allow(null),
        blood_group_id: Joi.number().integer().positive().allow(null),
        occupation_id: Joi.number().integer().positive().allow(null),
        education_level_id: Joi.number().integer().positive().allow(null),
        socio_economic_class_id: Joi.number().integer().positive().allow(null)
    }).allow(null),

    address: Joi.object({
        address_line1: Joi.string().max(255).required(),
        address_line2: Joi.string().max(255).allow(null, ''),
        city: Joi.string().max(100).required(),
        state: Joi.string().max(100).required(),
        pincode: Joi.string().max(10).required(),
        country: Joi.string().max(100).default('India')
    }).allow(null),

    emergency_contact: Joi.object({
        contact_name: Joi.string().max(150).required(),
        relationship_id: Joi.number().integer().positive().required(),
        mobile: Joi.string().pattern(/^[0-9]{10,15}$/).required()
    }).allow(null)
});

exports.updatePatient = Joi.object({
    first_name: Joi.string().max(100),
    middle_name: Joi.string().max(100).allow(null, ''),
    last_name: Joi.string().max(100),
    mobile_primary: Joi.string().pattern(/^[0-9]{10,15}$/),
    email: Joi.string().email().allow(null, ''),
    is_vip: Joi.boolean(),
    is_mlc: Joi.boolean()
}).min(1);

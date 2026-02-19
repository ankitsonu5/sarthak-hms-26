const Joi = require('joi');

exports.createBill = Joi.object({
    admission_id: Joi.number().integer().positive().required(),
    patient_id: Joi.number().integer().positive().required(),
    billing_type: Joi.string().valid('Open', 'Package').default('Open')
});

exports.addBillItem = Joi.object({
    bill_id: Joi.number().integer().positive().required(),
    item_name: Joi.string().max(150).required(),
    item_category: Joi.string().required(),
    quantity: Joi.number().integer().positive().default(1),
    unit_price: Joi.number().precision(2).positive().required(),
    discount: Joi.number().precision(2).min(0).default(0),
    tax_percentage: Joi.number().precision(2).min(0).default(0)
});

exports.processPayment = Joi.object({
    bill_id: Joi.number().integer().positive().required(),
    amount: Joi.number().precision(2).positive().required(),
    payment_mode: Joi.string().valid('Cash', 'Card', 'UPI', 'NEFT', 'Insurance', 'Cheque').required(),
    reference_number: Joi.string().allow(null, ''),
    remarks: Joi.string().allow(null, '')
});

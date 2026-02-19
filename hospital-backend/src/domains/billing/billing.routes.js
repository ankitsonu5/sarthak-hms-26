const express = require('express');
const router = express.Router();
const controller = require('./billing.controller');
const validate = require('../../core/middleware/validate');
const schema = require('./billing.validation');

// POST /api/v1/billing/create
router.post('/create', validate(schema.createBill), controller.createBill);

// POST /api/v1/billing/add-item
router.post('/add-item', validate(schema.addBillItem), controller.addBillItem);

// POST /api/v1/billing/payment
router.post('/payment', validate(schema.processPayment), controller.processPayment);

// GET /api/v1/billing/list
router.get('/list', controller.getAllBills);

// GET /api/v1/billing/:id
router.get('/:id', controller.getBillDetails);

module.exports = router;

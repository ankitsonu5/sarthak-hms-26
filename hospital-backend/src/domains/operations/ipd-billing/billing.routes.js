const express = require('express');
const router = express.Router();
const controller = require('./billing.controller');

// POST /api/ipd-billing/bill/create
router.post('/bill/create', controller.createBill);

// POST /api/ipd-billing/bill/add-item
router.post('/bill/add-item', controller.addBillItem);

// POST /api/ipd-billing/bill/payment
router.post('/bill/payment', controller.processPayment);

// GET /api/ipd-billing/bill/:id
router.get('/bill/:id', controller.getBillDetails);

module.exports = router;

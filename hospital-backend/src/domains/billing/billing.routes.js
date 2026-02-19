const express = require('express');
const router = express.Router();
const controller = require('./billing.controller');
const validate = require('../../core/middleware/validate');
const schema = require('./billing.validation');
const { authorize } = require('../../core/middleware/auth');
const R = require('../../core/constants/roles');

const BILLING = [R.BILLING, R.INSURANCE, R.SUPER_ADMIN, R.HOSPITAL_ADMIN];

router.post('/create', authorize(...BILLING), validate(schema.createBill), controller.createBill);
router.post('/add-item', authorize(...BILLING), validate(schema.addBillItem), controller.addBillItem);
router.post('/payment', authorize(...BILLING), validate(schema.processPayment), controller.processPayment);
router.get('/list', authorize(...BILLING), controller.getAllBills);
router.get('/:id', authorize(...BILLING), controller.getBillDetails);

module.exports = router;

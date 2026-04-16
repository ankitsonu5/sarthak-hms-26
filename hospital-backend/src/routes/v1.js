const express = require('express');
const router = express.Router();

const { authenticate } = require('../core/middleware/auth');

// Public Routes
router.use('/auth', require('../domains/auth/auth.routes'));

// Protected Routes
router.use(authenticate);

// Domain Modules
router.use('/master', require('../domains/master/master.routes'));
router.use('/patients', require('../domains/patient/patient.routes'));
router.use('/opd', require('../domains/opd/opd.routes'));
router.use('/ipd', require('../domains/ipd/ipd.routes'));
router.use('/orders', require('../domains/orders/orders.routes'));
router.use('/nursing', require('../domains/nursing/nursing.routes'));
router.use('/billing', require('../domains/billing/billing.routes'));
router.use('/insurance', require('../domains/insurance/insurance.routes'));
router.use('/reference-data', require('../domains/reference-data/reference.routes'));

module.exports = router;

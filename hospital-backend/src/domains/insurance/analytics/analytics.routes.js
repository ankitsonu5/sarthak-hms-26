const express = require('express');
const router = express.Router();
const controller = require('./analytics.controller');
const { authorize } = require('../../../core/middleware/auth');
const R = require('../../../core/constants/roles');

const INS = [R.INSURANCE, R.BILLING, R.SUPER_ADMIN, R.HOSPITAL_ADMIN];

router.post('/aging/refresh', authorize(...INS), controller.refreshAging);
router.post('/denial/refresh', authorize(...INS), controller.refreshDenial);
router.get('/denial', authorize(...INS), controller.getDenialAnalytics);

module.exports = router;

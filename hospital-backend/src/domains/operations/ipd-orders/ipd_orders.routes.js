const express = require('express');
const router = express.Router();
const controller = require('./ipd_orders.controller');

// POST /api/ipd/orders/create
router.post('/create', controller.createOrder);

module.exports = router;

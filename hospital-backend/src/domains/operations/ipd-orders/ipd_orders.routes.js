const express = require('express');
const router = express.Router();
const controller = require('./ipd_orders.controller');

// POST /api/ipd-orders/create - Create a new set of orders
router.post('/create', controller.createOrder);

// GET /api/ipd-orders/admission/:admissionId - Get all orders for an admission
router.get('/admission/:admissionId', controller.getOrdersByAdmission);

// GET /api/ipd-orders/:id - Get specific order details with items
router.get('/:id', controller.getOrderById);

module.exports = router;

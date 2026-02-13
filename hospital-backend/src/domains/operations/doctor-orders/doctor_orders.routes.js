const express = require('express');
const router = express.Router();
const controller = require('./doctor_orders.controller');

// POST /api/doctor-orders/create - Create Draft (Med, Lab, Radio, Diet)
router.post('/create', controller.createOrder);

// PUT /api/doctor-orders/sign/:id - Sign & Finalize Order
router.put('/sign/:id', controller.signOrder);

// GET /api/doctor-orders/patient/:patientId - Get Patient Orders
router.get('/patient/:patientId', controller.getPatientOrders);

module.exports = router;

const express = require('express');
const router = express.Router();
const controller = require('./orders.controller');
const validate = require('../../core/middleware/validate');
const schema = require('./orders.validation');

// IPD Order System
// POST /api/v1/orders/ipd/create
router.post('/ipd/create', validate(schema.createIPDOrder), controller.createIPDOrder);

// GET /api/v1/orders/ipd/admission/:admissionId
router.get('/ipd/admission/:admissionId', controller.getOrdersByAdmission);

// GET /api/v1/orders/ipd/:id
router.get('/ipd/:id', controller.getOrderById);

// CPOE (Doctor Order Management)
// POST /api/v1/orders/cpoe/create
router.post('/cpoe/create', validate(schema.createCPOEOrder), controller.createCPOEOrder);

// PUT /api/v1/orders/cpoe/sign/:id
router.put('/cpoe/sign/:id', controller.signOrder);

// GET /api/v1/orders/patient/:patientId
router.get('/patient/:patientId', controller.getOrdersByPatient);

module.exports = router;

const express = require('express');
const router = express.Router();
const controller = require('./nursing.controller');
const validate = require('../../core/middleware/validate');
const schema = require('./nursing.validation');

// POST /api/v1/nursing/observation
router.post('/observation', validate(schema.createObservation), controller.createObservation);

// POST /api/v1/nursing/mar
router.post('/mar', validate(schema.recordMAR), controller.recordMAR);

// POST /api/v1/nursing/note
router.post('/note', validate(schema.addNote), controller.addNote);

// GET /api/v1/nursing/dashboard/:admissionId
router.get('/dashboard/:admissionId', controller.getClinicalDashboard);

module.exports = router;

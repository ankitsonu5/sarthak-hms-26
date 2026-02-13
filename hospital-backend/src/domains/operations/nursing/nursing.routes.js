const express = require('express');
const router = express.Router();
const controller = require('./nursing.controller');

// POST /api/nursing/observation - Add Vitals, IO, EWS
router.post('/observation', controller.createObservation);

// POST /api/nursing/mar - Record Medication Administration
router.post('/mar', controller.recordMAR);

// POST /api/nursing/note - Add Nursing Notes
router.post('/note', controller.addNote);

// GET /api/nursing/dashboard/:admissionId - Get Clinical Dashboard
router.get('/dashboard/:admissionId', controller.getClinicalDashboard);

module.exports = router;

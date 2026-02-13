const express = require('express');
const router = express.Router();
const controller = require('./patient.controller');

// POST /api/patient-registration/register - Register a new patient
router.post('/register', controller.registerPatient);

// GET /api/patient-registration/list - Get all patients
router.get('/list', controller.getAllPatients);

// GET /api/patient-registration/:id - Get a single patient
router.get('/:id', controller.getPatientById);

// PUT /api/patient-registration/:id - Update a patient
router.put('/:id', controller.updatePatient);

// DELETE /api/patient-registration/:id - Delete a patient
router.delete('/:id', controller.deletePatient);

module.exports = router;

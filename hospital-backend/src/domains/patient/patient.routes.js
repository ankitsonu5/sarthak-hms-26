const express = require('express');
const router = express.Router();
const controller = require('./patient.controller');
const validate = require('../../core/middleware/validate');
const schema = require('./patient.validation');

// POST /api/v1/patients/register
router.post('/register', validate(schema.registerPatient), controller.registerPatient);

// GET /api/v1/patients/list
router.get('/list', controller.getAllPatients);

// GET /api/v1/patients/:id
router.get('/:id', controller.getPatientById);

// PUT /api/v1/patients/:id
router.put('/:id', validate(schema.updatePatient), controller.updatePatient);

// DELETE /api/v1/patients/:id
router.delete('/:id', controller.deletePatient);

module.exports = router;

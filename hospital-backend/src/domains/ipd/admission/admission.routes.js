const express = require('express');
const router = express.Router();
const controller = require('./admission.controller');
const validate = require('../../../core/middleware/validate');
const schema = require('./admission.validation');

// POST /api/v1/ipd/admission/create
router.post('/create', validate(schema.createAdmission), controller.createIPDAdmission);

// GET /api/v1/ipd/admission/list
router.get('/list', controller.getAllAdmissions);

// GET /api/v1/ipd/admission/:id
router.get('/:id', controller.getAdmissionById);

module.exports = router;

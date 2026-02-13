const express = require('express');
const router = express.Router();
const controller = require('./ipd.controller');

// POST /api/ipd/admission/create
router.post('/admission/create', controller.createIPDAdmission);

// GET /api/ipd/admission/list
router.get('/admission/list', controller.getAllAdmissions);

// GET /api/ipd/admission/:id
router.get('/admission/:id', controller.getAdmissionById);

module.exports = router;

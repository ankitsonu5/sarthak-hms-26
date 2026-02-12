const express = require('express');
const router = express.Router();
const controller = require('./patient.controller');

// POST /api/patient-registration/register
router.post('/register', controller.registerPatient);

module.exports = router;

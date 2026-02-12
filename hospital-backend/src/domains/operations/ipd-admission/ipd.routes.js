const express = require('express');
const router = express.Router();
const controller = require('./ipd.controller');

// POST /api/ipd/admission/create
router.post('/admission/create', controller.createAdmission);

module.exports = router;

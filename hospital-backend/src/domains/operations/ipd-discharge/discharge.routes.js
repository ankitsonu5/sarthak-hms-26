const express = require('express');
const router = express.Router();
const controller = require('./discharge.controller');

// POST /api/ipd-discharge/create - Create Draft Discharge
router.post('/create', controller.createDischarge);

// PUT /api/ipd-discharge/finalize/:id - Finalize Discharge & Release Bed
router.put('/finalize/:id', controller.finalizeDischarge);

// GET /api/ipd-discharge/:id - Get Discharge Summary
router.get('/:id', controller.getDischargeSummary);

module.exports = router;

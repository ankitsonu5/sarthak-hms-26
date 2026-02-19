const express = require('express');
const router = express.Router();
const controller = require('./discharge.controller');
const validate = require('../../../core/middleware/validate');
const schema = require('./discharge.validation');

// POST /api/v1/ipd/discharge/create
router.post('/create', validate(schema.createDischarge), controller.createDischarge);

// PUT /api/v1/ipd/discharge/finalize/:id
router.put('/finalize/:id', controller.finalizeDischarge);

// GET /api/v1/ipd/discharge/:id
router.get('/:id', controller.getDischargeSummary);

module.exports = router;

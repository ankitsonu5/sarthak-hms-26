const express = require('express');
const router = express.Router();
const controller = require('./settlement.controller');
const validate = require('../../../core/middleware/validate');
const schema = require('./settlement.validation');

// POST /api/v1/insurance/settlement
router.post('/', validate(schema.record), controller.record);

// GET /api/v1/insurance/settlement/receivables
router.get('/receivables', controller.receivables);

// GET /api/v1/insurance/settlement/claim/:claimId
router.get('/claim/:claimId', controller.getByClaim);

// GET /api/v1/insurance/settlement/:id
router.get('/:id', controller.getById);

// PATCH /api/v1/insurance/settlement/:id/post-ledger
router.patch('/:id/post-ledger', controller.postToLedger);

module.exports = router;

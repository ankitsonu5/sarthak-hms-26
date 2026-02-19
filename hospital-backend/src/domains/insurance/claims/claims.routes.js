const express = require('express');
const router = express.Router();
const controller = require('./claims.controller');
const validate = require('../../../core/middleware/validate');
const schema = require('./claims.validation');

// POST /api/v1/insurance/claims
router.post('/', validate(schema.submit), controller.submit);

// PATCH /api/v1/insurance/claims/:id/status
router.patch('/:id/status', validate(schema.updateStatus), controller.updateStatus);

// POST /api/v1/insurance/claims/:id/rejection
router.post('/:id/rejection', validate(schema.addRejection), controller.addRejection);

// GET /api/v1/insurance/claims
router.get('/', controller.getAll);

// GET /api/v1/insurance/claims/:id
router.get('/:id', controller.getById);

// GET /api/v1/insurance/claims/:id/timeline
router.get('/:id/timeline', controller.getTimeline);

// GET /api/v1/insurance/claims/admission/:admissionId
router.get('/admission/:admissionId', controller.getByAdmission);

module.exports = router;

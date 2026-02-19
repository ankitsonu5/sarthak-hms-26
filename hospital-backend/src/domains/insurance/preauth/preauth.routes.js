const express = require('express');
const router = express.Router();
const controller = require('./preauth.controller');
const validate = require('../../../core/middleware/validate');
const schema = require('./preauth.validation');

// POST /api/v1/insurance/preauth
router.post('/', validate(schema.create), controller.create);

// PATCH /api/v1/insurance/preauth/:id/status
router.patch('/:id/status', validate(schema.updateStatus), controller.updateStatus);

// GET /api/v1/insurance/preauth
router.get('/', controller.getAll);

// GET /api/v1/insurance/preauth/:id
router.get('/:id', controller.getById);

// GET /api/v1/insurance/preauth/admission/:admissionId
router.get('/admission/:admissionId', controller.getByAdmission);

module.exports = router;

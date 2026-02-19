const express = require('express');
const router = express.Router();
const controller = require('./documents.controller');
const validate = require('../../../core/middleware/validate');
const schema = require('./documents.validation');

// POST /api/v1/insurance/documents
router.post('/', validate(schema.upload), controller.upload);

// GET /api/v1/insurance/documents/claim/:claimId
router.get('/claim/:claimId', controller.getByClaim);

// GET /api/v1/insurance/documents/claim/:claimId/checklist
router.get('/claim/:claimId/checklist', controller.checklist);

// GET /api/v1/insurance/documents/preauth/:preauthId
router.get('/preauth/:preauthId', controller.getByPreauth);

// DELETE /api/v1/insurance/documents/:id
router.delete('/:id', controller.remove);

module.exports = router;

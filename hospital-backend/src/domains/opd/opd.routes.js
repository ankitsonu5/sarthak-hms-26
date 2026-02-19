const express = require('express');
const router = express.Router();
const controller = require('./opd.controller');
const validate = require('../../core/middleware/validate');
const schema = require('./opd.validation');

// POST /api/v1/opd/visit/create
router.post('/visit/create', validate(schema.createVisit), controller.createVisit);

// GET /api/v1/opd/visit/list
router.get('/visit/list', controller.getAllVisits);

// GET /api/v1/opd/visit/:id
router.get('/visit/:id', controller.getVisitById);

module.exports = router;

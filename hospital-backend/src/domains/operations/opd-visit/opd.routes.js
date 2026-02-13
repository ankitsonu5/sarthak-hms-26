const express = require('express');
const router = express.Router();
const controller = require('./opd.controller');

// POST /api/opd/visit/create
router.post('/visit/create', controller.createVisit);

// GET /api/opd/visit/list
router.get('/visit/list', controller.getAllVisits);

// GET /api/opd/visit/:id
router.get('/visit/:id', controller.getVisitById);

module.exports = router;

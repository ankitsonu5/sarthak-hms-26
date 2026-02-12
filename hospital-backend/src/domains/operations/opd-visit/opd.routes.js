const express = require('express');
const router = express.Router();
const controller = require('./opd.controller');

// POST /api/opd/visit/create
router.post('/visit/create', controller.createVisit);

module.exports = router;

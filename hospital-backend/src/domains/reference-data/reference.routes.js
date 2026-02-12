const express = require('express');
const router = express.Router();
const controller = require('./reference.controller');

// GET /api/reference-data/all
router.get('/all', controller.getAllReferenceData);

module.exports = router;

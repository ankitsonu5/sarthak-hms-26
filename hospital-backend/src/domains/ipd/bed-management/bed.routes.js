const express = require('express');
const router = express.Router();
const controller = require('./bed.controller');

// POST /api/v1/ipd/bed/allocate
router.post('/allocate', controller.allocateBed);

// PUT /api/v1/ipd/bed/transfer
router.put('/transfer', controller.transferBed);

// GET /api/v1/ipd/bed/available
router.get('/available', controller.getAvailableBeds);

// GET /api/v1/ipd/bed/occupancy
router.get('/occupancy', controller.getBedOccupancy);

module.exports = router;

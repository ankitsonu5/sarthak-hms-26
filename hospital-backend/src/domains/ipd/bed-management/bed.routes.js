const express = require('express');
const router = express.Router();
const controller = require('./bed.controller');
const { authorize } = require('../../../core/middleware/auth');
const R = require('../../../core/constants/roles');

const CLINICAL_ADMIN = [R.DOCTOR, R.NURSE, R.SUPER_ADMIN, R.HOSPITAL_ADMIN];

router.post('/allocate', authorize(...CLINICAL_ADMIN), controller.allocateBed);
router.put('/transfer', authorize(...CLINICAL_ADMIN), controller.transferBed);
router.get('/available', authorize(...CLINICAL_ADMIN), controller.getAvailableBeds);
router.get('/occupancy', authorize(...CLINICAL_ADMIN), controller.getBedOccupancy);

module.exports = router;

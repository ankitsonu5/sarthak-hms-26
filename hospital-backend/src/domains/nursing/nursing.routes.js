const express = require('express');
const router = express.Router();
const controller = require('./nursing.controller');
const validate = require('../../core/middleware/validate');
const schema = require('./nursing.validation');
const { authorize } = require('../../core/middleware/auth');
const R = require('../../core/constants/roles');

const CLINICAL = [R.DOCTOR, R.NURSE, R.SUPER_ADMIN, R.HOSPITAL_ADMIN];

router.post('/observation', authorize(...CLINICAL), validate(schema.createObservation), controller.createObservation);
router.post('/mar', authorize(...CLINICAL), validate(schema.recordMAR), controller.recordMAR);
router.post('/note', authorize(...CLINICAL), validate(schema.addNote), controller.addNote);
router.get('/dashboard/:admissionId', authorize(...CLINICAL), controller.getClinicalDashboard);

module.exports = router;

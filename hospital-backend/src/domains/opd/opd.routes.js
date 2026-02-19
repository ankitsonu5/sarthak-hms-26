const express = require('express');
const router = express.Router();
const controller = require('./opd.controller');
const validate = require('../../core/middleware/validate');
const schema = require('./opd.validation');
const { authorize } = require('../../core/middleware/auth');
const R = require('../../core/constants/roles');

const CLINICAL_ADMIN = [R.DOCTOR, R.NURSE, R.SUPER_ADMIN, R.HOSPITAL_ADMIN];

router.post('/visit/create', authorize(...CLINICAL_ADMIN), validate(schema.createVisit), controller.createVisit);
router.get('/visit/list', authorize(...CLINICAL_ADMIN), controller.getAllVisits);
router.get('/visit/:id', authorize(...CLINICAL_ADMIN), controller.getVisitById);

module.exports = router;

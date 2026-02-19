const express = require('express');
const router = express.Router();
const controller = require('./admission.controller');
const validate = require('../../../core/middleware/validate');
const schema = require('./admission.validation');
const { authorize } = require('../../../core/middleware/auth');
const R = require('../../../core/constants/roles');

const CLINICAL_ADMIN = [R.DOCTOR, R.NURSE, R.SUPER_ADMIN, R.HOSPITAL_ADMIN];

router.post('/create', authorize(...CLINICAL_ADMIN), validate(schema.createAdmission), controller.createIPDAdmission);
router.get('/list', authorize(...CLINICAL_ADMIN), controller.getAllAdmissions);
router.get('/:id', authorize(...CLINICAL_ADMIN), controller.getAdmissionById);

module.exports = router;

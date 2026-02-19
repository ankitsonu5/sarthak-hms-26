const express = require('express');
const router = express.Router();
const controller = require('./patient.controller');
const validate = require('../../core/middleware/validate');
const schema = require('./patient.validation');
const { authorize } = require('../../core/middleware/auth');
const R = require('../../core/constants/roles');

const CLINICAL_AND_ADMIN = [R.DOCTOR, R.NURSE, R.BILLING, R.SUPER_ADMIN, R.HOSPITAL_ADMIN];

router.post('/register', authorize(...CLINICAL_AND_ADMIN), validate(schema.registerPatient), controller.registerPatient);

router.get('/list', authorize(...CLINICAL_AND_ADMIN), controller.getAllPatients);
router.get('/:id', authorize(...CLINICAL_AND_ADMIN), controller.getPatientById);
router.put('/:id', authorize(...CLINICAL_AND_ADMIN), validate(schema.updatePatient), controller.updatePatient);
router.delete('/:id', authorize(R.SUPER_ADMIN, R.HOSPITAL_ADMIN), controller.deletePatient);

module.exports = router;

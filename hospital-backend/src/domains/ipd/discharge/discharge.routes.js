const express = require('express');
const router = express.Router();
const controller = require('./discharge.controller');
const validate = require('../../../core/middleware/validate');
const schema = require('./discharge.validation');
const { authorize } = require('../../../core/middleware/auth');
const R = require('../../../core/constants/roles');

const CLINICAL_ADMIN = [R.DOCTOR, R.NURSE, R.SUPER_ADMIN, R.HOSPITAL_ADMIN];

router.post('/create', authorize(...CLINICAL_ADMIN), validate(schema.createDischarge), controller.createDischarge);
router.put('/finalize/:id', authorize(...CLINICAL_ADMIN), controller.finalizeDischarge);
router.get('/:id', authorize(...CLINICAL_ADMIN), controller.getDischargeSummary);

module.exports = router;

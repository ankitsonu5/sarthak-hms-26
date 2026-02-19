const express = require('express');
const router = express.Router();
const masterController = require('./patient_master_dependencies.controller');
const { authorize } = require('../../core/middleware/auth');
const R = require('../../core/constants/roles');

const ADMIN = [R.SUPER_ADMIN, R.HOSPITAL_ADMIN];

router.get('/patient-registration-dependencies', masterController.getRegistrationMasters);
router.post('/city', authorize(...ADMIN), masterController.addCity);
router.post('/referral-source', authorize(...ADMIN), masterController.addReferralSource);
router.delete('/:tableName/:id', authorize(...ADMIN), masterController.deleteGenericMaster);

module.exports = router;

const express = require('express');
const router = express.Router();
const masterController = require('./patient_master_dependencies.controller');

// GET all dropdown data
router.get('/patient-registration-dependencies', masterController.getRegistrationMasters);

// Specific POSTs
router.post('/city', masterController.addCity);
router.post('/referral-source', masterController.addReferralSource);

// Generic DELETE for other masters: /api/master/:tableName/:id
router.delete('/:tableName/:id', masterController.deleteGenericMaster);

module.exports = router;

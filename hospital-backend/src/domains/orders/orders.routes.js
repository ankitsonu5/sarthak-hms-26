const express = require('express');
const router = express.Router();
const controller = require('./orders.controller');
const validate = require('../../core/middleware/validate');
const schema = require('./orders.validation');
const { authorize } = require('../../core/middleware/auth');
const R = require('../../core/constants/roles');

const CLINICAL = [R.DOCTOR, R.NURSE, R.SUPER_ADMIN, R.HOSPITAL_ADMIN];

router.post('/ipd/create', authorize(...CLINICAL), validate(schema.createIPDOrder), controller.createIPDOrder);
router.get('/ipd/admission/:admissionId', authorize(...CLINICAL), controller.getOrdersByAdmission);
router.get('/ipd/:id', authorize(...CLINICAL), controller.getOrderById);
router.post('/cpoe/create', authorize(...CLINICAL), validate(schema.createCPOEOrder), controller.createCPOEOrder);
router.put('/cpoe/sign/:id', authorize(...CLINICAL), controller.signOrder);
router.get('/patient/:patientId', authorize(...CLINICAL), controller.getOrdersByPatient);

module.exports = router;

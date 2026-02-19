const express = require('express');
const router = express.Router();
const controller = require('./preauth.controller');
const validate = require('../../../core/middleware/validate');
const schema = require('./preauth.validation');
const { authorize } = require('../../../core/middleware/auth');
const R = require('../../../core/constants/roles');

const INS = [R.INSURANCE, R.BILLING, R.SUPER_ADMIN, R.HOSPITAL_ADMIN];

router.post('/', authorize(...INS), validate(schema.create), controller.create);
router.patch('/:id/status', authorize(...INS), validate(schema.updateStatus), controller.updateStatus);
router.get('/', authorize(...INS), controller.getAll);
router.get('/admission/:admissionId', authorize(...INS), controller.getByAdmission);
router.get('/:id', authorize(...INS), controller.getById);

module.exports = router;

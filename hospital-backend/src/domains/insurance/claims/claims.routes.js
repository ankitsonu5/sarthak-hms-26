const express = require('express');
const router = express.Router();
const controller = require('./claims.controller');
const validate = require('../../../core/middleware/validate');
const schema = require('./claims.validation');
const { authorize } = require('../../../core/middleware/auth');
const R = require('../../../core/constants/roles');

const INS = [R.INSURANCE, R.BILLING, R.SUPER_ADMIN, R.HOSPITAL_ADMIN];

router.post('/', authorize(...INS), validate(schema.submit), controller.submit);
router.patch('/:id/status', authorize(...INS), validate(schema.updateStatus), controller.updateStatus);
router.post('/:id/rejection', authorize(...INS), validate(schema.addRejection), controller.addRejection);
router.get('/', authorize(...INS), controller.getAll);
router.get('/aging-summary', authorize(...INS), controller.getAgingSummary);
router.get('/admission/:admissionId', authorize(...INS), controller.getByAdmission);
router.get('/:id/timeline', authorize(...INS), controller.getTimeline);
router.get('/:id', authorize(...INS), controller.getById);

module.exports = router;

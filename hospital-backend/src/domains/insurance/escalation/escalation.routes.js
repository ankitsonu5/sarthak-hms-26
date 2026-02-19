const express = require('express');
const router = express.Router();
const controller = require('./escalation.controller');
const validate = require('../../../core/middleware/validate');
const schema = require('./escalation.validation');
const { authorize } = require('../../../core/middleware/auth');
const R = require('../../../core/constants/roles');

const INS = [R.INSURANCE, R.BILLING, R.SUPER_ADMIN, R.HOSPITAL_ADMIN];

router.post('/', authorize(...INS), validate(schema.create), controller.create);
router.patch('/:id/acknowledge', authorize(...INS), validate(schema.acknowledge), controller.acknowledge);
router.get('/pending', authorize(...INS), controller.getPending);
router.get('/claim/:claimId', authorize(...INS), controller.getByClaim);

module.exports = router;

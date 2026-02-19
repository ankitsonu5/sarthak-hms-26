const express = require('express');
const router = express.Router();
const controller = require('./settlement.controller');
const validate = require('../../../core/middleware/validate');
const schema = require('./settlement.validation');
const { authorize } = require('../../../core/middleware/auth');
const R = require('../../../core/constants/roles');

const INS = [R.INSURANCE, R.BILLING, R.SUPER_ADMIN, R.HOSPITAL_ADMIN];

router.post('/', authorize(...INS), validate(schema.record), controller.record);
router.get('/receivables', authorize(...INS), controller.receivables);
router.get('/claim/:claimId', authorize(...INS), controller.getByClaim);
router.get('/:id', authorize(...INS), controller.getById);
router.patch('/:id/post-ledger', authorize(...INS), controller.postToLedger);

module.exports = router;

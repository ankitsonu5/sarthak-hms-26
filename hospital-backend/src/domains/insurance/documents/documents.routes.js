const express = require('express');
const router = express.Router();
const controller = require('./documents.controller');
const validate = require('../../../core/middleware/validate');
const schema = require('./documents.validation');
const { authorize } = require('../../../core/middleware/auth');
const R = require('../../../core/constants/roles');

const INS = [R.INSURANCE, R.BILLING, R.SUPER_ADMIN, R.HOSPITAL_ADMIN];

router.post('/', authorize(...INS), validate(schema.upload), controller.upload);
router.get('/claim/:claimId', authorize(...INS), controller.getByClaim);
router.get('/claim/:claimId/checklist', authorize(...INS), controller.checklist);
router.get('/preauth/:preauthId', authorize(...INS), controller.getByPreauth);
router.delete('/:id', authorize(...INS), controller.remove);

module.exports = router;

const express = require('express');
const router = express.Router();

router.use('/admission', require('./admission/admission.routes'));
router.use('/bed', require('./bed-management/bed.routes'));
router.use('/discharge', require('./discharge/discharge.routes'));

module.exports = router;

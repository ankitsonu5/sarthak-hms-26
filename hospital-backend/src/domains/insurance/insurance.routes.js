const express = require('express');
const router = express.Router();

router.use('/preauth', require('./preauth/preauth.routes'));
router.use('/claims', require('./claims/claims.routes'));
router.use('/documents', require('./documents/documents.routes'));
router.use('/settlement', require('./settlement/settlement.routes'));

module.exports = router;

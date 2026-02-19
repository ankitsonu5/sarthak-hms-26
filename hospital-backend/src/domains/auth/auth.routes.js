const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const validate = require('../../core/middleware/validate');
const schema = require('./auth.validation');

router.post('/register', validate(schema.register), controller.register);
router.post('/login', validate(schema.login), controller.login);
router.post('/refresh', controller.refresh);
router.get('/roles', controller.getRoles);

module.exports = router;

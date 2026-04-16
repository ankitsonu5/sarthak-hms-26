const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const validate = require('../../core/middleware/validate');
const { authenticate } = require('../../core/middleware/auth');
const schema = require('./auth.validation');

// Public
router.post('/register', validate(schema.register), controller.register);
router.post('/login', validate(schema.login), controller.login);
router.post('/refresh', controller.refresh);
router.get('/roles', controller.getRoles);

// Protected
router.post('/logout', authenticate, controller.logout);
router.post('/logout-all', authenticate, controller.logoutAll);
router.get('/sessions', authenticate, controller.getSessions);
router.delete('/sessions/:sessionId', authenticate, controller.revokeSession);

module.exports = router;

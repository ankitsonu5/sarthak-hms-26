const BaseController = require('../../core/base/BaseController');
const authService = require('./auth.service');

const ctrl = new BaseController();

exports.register = ctrl.handle(async (req, res) => {
    const result = await authService.register(req.body);
    ctrl.created(res, result, 'User registered');
});

exports.login = ctrl.handle(async (req, res) => {
    const meta = {
        ip: req.ip || req.headers?.['x-forwarded-for']?.split(',')[0],
        userAgent: req.headers?.['user-agent']
    };
    const result = await authService.login(req.body.email, req.body.password, meta);
    ctrl.ok(res, result, 'Login successful');
});

exports.refresh = ctrl.handle(async (req, res) => {
    const token = req.body.refreshToken || req.headers['x-refresh-token'];
    const result = await authService.refresh(token);
    ctrl.ok(res, result, 'Token refreshed');
});

exports.getRoles = ctrl.handle(async (req, res) => {
    const result = await authService.getRoles();
    ctrl.ok(res, result);
});

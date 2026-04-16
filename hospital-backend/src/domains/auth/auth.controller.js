const authService = require('./auth.service');
const asyncHandler = require('../../core/middleware/asyncHandler');
const response = require('../../core/helpers/response');

class AuthController {

    register = asyncHandler(async (req, res) => {
        const createdBy = req.user?.id || null;
        const result = await authService.register(req.body, createdBy);
        return response.created(res, result, 'User registered successfully');
    });

    login = asyncHandler(async (req, res) => {
        const meta = {
            ip: req.ip || req.headers?.['x-forwarded-for']?.split(',')[0],
            userAgent: req.headers?.['user-agent'],
            deviceId: req.body.deviceId,
            deviceType: req.body.deviceType || 'WEB',
        };
        const result = await authService.login(req.body.email, req.body.password, meta);
        return response.success(res, result, 'Login successful');
    });

    refresh = asyncHandler(async (req, res) => {
        const token = req.body.refreshToken || req.headers['x-refresh-token'];
        const result = await authService.refresh(token);
        return response.success(res, result, 'Token refreshed');
    });

    logout = asyncHandler(async (req, res) => {
        const token = req.body.refreshToken || req.headers['x-refresh-token'];
        await authService.logout(req.user.id, token);
        return response.success(res, null, 'Logged out successfully');
    });

    logoutAll = asyncHandler(async (req, res) => {
        await authService.logoutAll(req.user.id);
        return response.success(res, null, 'All sessions revoked');
    });

    getSessions = asyncHandler(async (req, res) => {
        const sessions = await authService.getActiveSessions(req.user.id);
        return response.success(res, sessions);
    });

    revokeSession = asyncHandler(async (req, res) => {
        await authService.revokeSession(req.user.id, req.params.sessionId);
        return response.success(res, null, 'Session revoked');
    });

    getRoles = asyncHandler(async (req, res) => {
        const result = await authService.getRoles();
        return response.success(res, result);
    });
}

module.exports = new AuthController();

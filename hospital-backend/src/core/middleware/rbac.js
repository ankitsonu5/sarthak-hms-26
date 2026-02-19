const { AppError } = require('../errors');

const requireRole = (...allowedRoles) => (req, _res, next) => {
    if (!req.user || !req.user.role) {
        throw new AppError('Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
        throw new AppError(
            `Access denied — requires role: ${allowedRoles.join(' or ')}`,
            403
        );
    }

    next();
};

const requirePermission = (...permissions) => (req, _res, next) => {
    if (!req.user) {
        throw new AppError('Authentication required', 401);
    }

    const userPermissions = req.user.permissions || [];
    const hasAll = permissions.every(p => userPermissions.includes(p));

    if (!hasAll) {
        throw new AppError(
            `Access denied — requires permission: ${permissions.join(', ')}`,
            403
        );
    }

    next();
};

module.exports = { requireRole, requirePermission };

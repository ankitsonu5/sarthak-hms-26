const { AppError } = require('../errors');

/**
 * Use auth.authorize() for role-based access.
 * This module kept for requirePermission (future permission-based RBAC).
 */
function requireRole(...allowedRoles) {
    return (req, _res, next) => {
        if (!req.user) throw new AppError('Authentication required', 401);
        const userRole = String(req.user.role_id);
        const userRoleName = String(req.user.role_name || '');
        const allowed = new Set(allowedRoles.map(r => String(r)));
        if (allowed.has(userRole) || allowed.has(userRoleName)) return next();
        throw new AppError(`Access denied — requires: ${allowedRoles.join(' or ')}`, 403);
    };
}

function requirePermission(...permissions) {
    return (req, _res, next) => {
        if (!req.user) throw new AppError('Authentication required', 401);
        const userPermissions = req.user.permissions || [];
        const hasAll = permissions.every(p => userPermissions.includes(p));
        if (!hasAll) throw new AppError(`Access denied — requires: ${permissions.join(', ')}`, 403);
        next();
    };
}

module.exports = { requireRole, requirePermission };

const { prisma } = require('../../config/db');
const { AppError } = require('../errors');

function requireRole(...allowedRoles) {
    return (req, _res, next) => {
        if (!req.user) throw new AppError('Authentication required', 401);
        const userRole = String(req.user.role_id);
        const userRoleName = String(req.user.role_name || '');
        const allowed = new Set(allowedRoles.map((r) => String(r)));
        if (allowed.has(userRole) || allowed.has(userRoleName)) return next();
        throw new AppError(`Access denied — requires: ${allowedRoles.join(' or ')}`, 403);
    };
}

function requirePermission(...permissions) {
    return async (req, _res, next) => {
        if (!req.user) throw new AppError('Authentication required', 401);

        const roleId = BigInt(req.user.role_id);
        const rolePerms = await prisma.rolePermission.findMany({
            where: { role_id: roleId },
            include: { permission: true },
        });

        const userPerms = new Set(rolePerms.map((rp) => `${rp.permission.module}:${rp.permission.action}`));

        const hasAll = permissions.every((p) => userPerms.has(p));
        if (!hasAll) {
            throw new AppError(`Access denied — requires: ${permissions.join(', ')}`, 403);
        }

        req.user.permissions = [...userPerms];
        next();
    };
}

module.exports = { requireRole, requirePermission };

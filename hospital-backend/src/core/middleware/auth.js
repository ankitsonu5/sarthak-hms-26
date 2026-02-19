const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret';

/**
 * JWT authenticate - sets req.user from token
 * Use on protected routes only
 */
function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = {
            id: decoded.user_id,
            user_id: decoded.user_id,
            role_id: decoded.role_id,
            role_name: decoded.role_name,
            hospital_id: decoded.hospital_id
        };
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
}

/**
 * Role-based access - allow only specified roles
 * Usage: authorize(1, 2, 3) or authorize('DOCTOR', 'ADMIN')
 * Pass role_id (number) or role_name (string)
 */
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const allowed = new Set(allowedRoles.map(r => String(r)));
        const userRole = String(req.user.role_id);
        const userRoleName = String(req.user.role_name || '');
        if (allowed.has(userRole) || allowed.has(userRoleName)) {
            return next();
        }
        return res.status(403).json({ success: false, message: 'Forbidden' });
    };
}

module.exports = { authenticate, authorize };

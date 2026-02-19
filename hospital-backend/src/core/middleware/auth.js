const { AppError } = require('../errors');

const authenticate = (req, _res, next) => {
    // TODO: Replace with real JWT verification when auth module is built
    // For now, allow all requests with a default user context
    req.user = {
        id: req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : 1,
        role: req.headers['x-user-role'] || 'admin'
    };
    next();
};

const requireAuth = (req, _res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        throw new AppError('Authentication required', 401);
    }
    // TODO: jwt.verify(token, secret) and attach decoded user
    next();
};

module.exports = { authenticate, requireAuth };

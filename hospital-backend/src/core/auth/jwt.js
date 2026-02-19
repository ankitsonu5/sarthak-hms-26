const jwt = require('jsonwebtoken');

function generateAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '15m' });
}

function generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret', { expiresIn: '7d' });
}

function verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
}

function verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret');
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
};

const db = require('../../config/db');
const { AppError } = require('../../core/errors');
const { hashPassword, comparePassword } = require('../../core/auth/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../core/auth/jwt');

exports.register = async (data) => {
    const hashed = await hashPassword(data.password);
    const [r] = await db.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role_id, hospital_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.full_name, data.email, data.phone || null, hashed, data.role_id, data.hospital_id || null]
    );
    const [user] = await db.query(
        `SELECT user_id, full_name, email, role_id, hospital_id FROM users WHERE user_id = ?`,
        [r.insertId]
    );
    return user[0];
};

exports.login = async (email, password, meta = {}) => {
    const [rows] = await db.query(
        `SELECT u.*, r.role_name FROM users u
         JOIN master_roles r ON u.role_id = r.role_id
         WHERE u.email = ? AND u.is_active = TRUE`,
        [email]
    );
    const user = rows[0];
    if (!user) throw new AppError('Invalid credentials', 401);

    const ok = await comparePassword(password, user.password_hash);
    if (!ok) throw new AppError('Invalid credentials', 401);

    await db.query(
        'UPDATE users SET last_login_at = NOW() WHERE user_id = ?',
        [user.user_id]
    );

    const accessToken = generateAccessToken({
        user_id: user.user_id,
        role_id: user.role_id,
        role_name: user.role_name,
        hospital_id: user.hospital_id
    });
    const refreshToken = generateRefreshToken({ user_id: user.user_id });

    await db.query(
        `INSERT INTO user_sessions (user_id, refresh_token, ip_address, user_agent, expires_at)
         VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
        [user.user_id, refreshToken, meta.ip || null, meta.userAgent || null]
    );

    return {
        accessToken,
        refreshToken,
        expiresIn: 900,
        user: {
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            role_id: user.role_id,
            role_name: user.role_name,
            hospital_id: user.hospital_id
        }
    };
};

exports.refresh = async (refreshToken) => {
    if (!refreshToken) throw new AppError('Refresh token required', 401);
    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch {
        throw new AppError('Invalid refresh token', 401);
    }
    const [rows] = await db.query(
        `SELECT u.*, r.role_name FROM users u
         JOIN master_roles r ON u.role_id = r.role_id
         WHERE u.user_id = ? AND u.is_active = TRUE`,
        [decoded.user_id]
    );
    const user = rows[0];
    if (!user) throw new AppError('User not found', 401);

    const accessToken = generateAccessToken({
        user_id: user.user_id,
        role_id: user.role_id,
        role_name: user.role_name,
        hospital_id: user.hospital_id
    });

    return {
        accessToken,
        expiresIn: 900,
        user: {
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            role_id: user.role_id,
            role_name: user.role_name
        }
    };
};

exports.getRoles = async () => {
    const [rows] = await db.query('SELECT role_id, role_name, description FROM master_roles ORDER BY role_id');
    return rows;
};

const { prisma } = require('../../config/db');
const { hashPassword, comparePassword } = require('../../core/auth/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../core/auth/jwt');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;

class AuthService {

    async register(data, createdBy = null) {
        const hashed = await hashPassword(data.password);
        const user = await prisma.user.create({
            data: {
                employee_id: data.employee_id || null,
                full_name: data.full_name,
                email: data.email,
                phone: data.phone || null,
                password_hash: hashed,
                role_id: BigInt(data.role_id),
                hospital_id: data.hospital_id ? BigInt(data.hospital_id) : null,
                status: 'ACTIVE',
                created_by: createdBy ? BigInt(createdBy) : null,
                password_changed_at: new Date(),
            },
            select: {
                user_id: true, employee_id: true, full_name: true,
                email: true, role_id: true, hospital_id: true, status: true,
            },
        });

        if (data.branch_id) {
            await prisma.userRoleMapping.create({
                data: {
                    user_id: user.user_id,
                    role_id: BigInt(data.role_id),
                    branch_id: BigInt(data.branch_id),
                },
            });
        }

        return user;
    }

    async login(email, password, meta = {}) {
        const user = await prisma.user.findFirst({
            where: { email },
            include: {
                role: true,
                user_roles: { where: { is_active: true }, include: { branch: true, role: true } },
            },
        });

        if (!user) {
            await this._recordAttempt(null, email, false, 'USER_NOT_FOUND', meta);
            throw new Error('Invalid credentials');
        }

        if (user.status !== 'ACTIVE') {
            await this._recordAttempt(user.user_id, email, false, `ACCOUNT_${user.status}`, meta);
            throw new Error(`Account is ${user.status.toLowerCase()}`);
        }

        if (user.locked_until && new Date() < user.locked_until) {
            const mins = Math.ceil((user.locked_until - new Date()) / 60000);
            await this._recordAttempt(user.user_id, email, false, 'ACCOUNT_LOCKED', meta);
            throw new Error(`Account locked. Try again in ${mins} minutes`);
        }

        const ok = await comparePassword(password, user.password_hash);
        if (!ok) {
            await this._handleFailedLogin(user, email, meta);
            throw new Error('Invalid credentials');
        }

        await this._recordAttempt(user.user_id, email, true, null, meta);

        await prisma.user.update({
            where: { user_id: user.user_id },
            data: {
                failed_login_count: 0,
                locked_until: null,
                last_login_at: new Date(),
                last_login_ip: meta.ip || null,
            },
        });

        const tokenPayload = {
            user_id: user.user_id.toString(),
            role_id: user.role_id.toString(),
            role_name: user.role.role_name,
            hospital_id: user.hospital_id?.toString(),
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken({ user_id: user.user_id.toString() });

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await prisma.userSession.create({
            data: {
                user_id: user.user_id,
                refresh_token: refreshToken,
                device_id: meta.deviceId || null,
                device_type: meta.deviceType || 'WEB',
                ip_address: meta.ip || null,
                user_agent: meta.userAgent || null,
                expires_at: expiresAt,
            },
        });

        const permissions = await this._getUserPermissions(user.role_id);

        return {
            accessToken,
            refreshToken,
            expiresIn: 900,
            user: {
                user_id: user.user_id,
                employee_id: user.employee_id,
                full_name: user.full_name,
                email: user.email,
                role_id: user.role_id,
                role_name: user.role.role_name,
                hospital_id: user.hospital_id,
                status: user.status,
                branches: user.user_roles.map((ur) => ({
                    branch_id: ur.branch?.branch_id,
                    branch_name: ur.branch?.branch_name,
                    branch_code: ur.branch?.branch_code,
                    role_name: ur.role.role_name,
                })),
                permissions,
            },
        };
    }

    async refresh(token) {
        if (!token) throw new Error('Refresh token required');

        let decoded;
        try {
            decoded = verifyRefreshToken(token);
        } catch {
            throw new Error('Invalid refresh token');
        }

        const session = await prisma.userSession.findFirst({
            where: { refresh_token: token, is_revoked: false },
        });

        if (!session || (session.expires_at && new Date() > session.expires_at)) {
            if (session) await prisma.userSession.update({ where: { session_id: session.session_id }, data: { is_revoked: true } });
            throw new Error('Session expired');
        }

        const user = await prisma.user.findUnique({
            where: { user_id: BigInt(decoded.user_id), status: 'ACTIVE' },
            include: { role: true },
        });
        if (!user) throw new Error('User not found');

        const accessToken = generateAccessToken({
            user_id: user.user_id.toString(),
            role_id: user.role_id.toString(),
            role_name: user.role.role_name,
            hospital_id: user.hospital_id?.toString(),
        });

        await prisma.userSession.update({
            where: { session_id: session.session_id },
            data: { last_active_at: new Date() },
        });

        return { accessToken, expiresIn: 900 };
    }

    async logout(userId, refreshToken) {
        if (refreshToken) {
            await prisma.userSession.updateMany({
                where: { user_id: BigInt(userId), refresh_token: refreshToken },
                data: { is_revoked: true },
            });
        }
    }

    async logoutAll(userId) {
        await prisma.userSession.updateMany({
            where: { user_id: BigInt(userId), is_revoked: false },
            data: { is_revoked: true },
        });
    }

    async getActiveSessions(userId) {
        return prisma.userSession.findMany({
            where: { user_id: BigInt(userId), is_revoked: false },
            select: {
                session_id: true, device_type: true, ip_address: true,
                user_agent: true, last_active_at: true, created_at: true,
            },
            orderBy: { last_active_at: 'desc' },
        });
    }

    async revokeSession(userId, sessionId) {
        await prisma.userSession.updateMany({
            where: { session_id: BigInt(sessionId), user_id: BigInt(userId) },
            data: { is_revoked: true },
        });
    }

    async getRoles() {
        return prisma.masterRole.findMany({ orderBy: { role_id: 'asc' } });
    }

    async _handleFailedLogin(user, email, meta) {
        const newCount = user.failed_login_count + 1;
        const updateData = { failed_login_count: newCount };

        if (newCount >= MAX_LOGIN_ATTEMPTS) {
            const lockUntil = new Date();
            lockUntil.setMinutes(lockUntil.getMinutes() + LOCKOUT_MINUTES);
            updateData.locked_until = lockUntil;
        }

        await prisma.user.update({ where: { user_id: user.user_id }, data: updateData });
        await this._recordAttempt(user.user_id, email, false, 'WRONG_PASSWORD', meta);

        if (newCount >= MAX_LOGIN_ATTEMPTS) {
            throw new Error(`Account locked after ${MAX_LOGIN_ATTEMPTS} failed attempts. Try again in ${LOCKOUT_MINUTES} minutes`);
        }

        const remaining = MAX_LOGIN_ATTEMPTS - newCount;
        throw new Error(`Invalid credentials. ${remaining} attempt(s) remaining`);
    }

    async _recordAttempt(userId, email, success, reason, meta) {
        await prisma.loginAttempt.create({
            data: {
                user_id: userId ? BigInt(userId) : null,
                email,
                ip_address: meta.ip || null,
                user_agent: meta.userAgent || null,
                success,
                failure_reason: reason,
            },
        }).catch(() => {});
    }

    async _getUserPermissions(roleId) {
        const rp = await prisma.rolePermission.findMany({
            where: { role_id: BigInt(roleId) },
            include: { permission: true },
        });
        return rp.map((r) => `${r.permission.module}:${r.permission.action}`);
    }
}

module.exports = new AuthService();

const { prisma } = require('../../config/db');

const auditLog = (entityType, action) => async (req, _res, next) => {
    const originalJson = _res.json.bind(_res);

    _res.json = function (body) {
        if (_res.statusCode < 400 && body?.data) {
            const entityId = body.data?.id || req.params?.id || null;

            prisma.auditLog.create({
                data: {
                    entity_type: entityType,
                    entity_id: entityId ? BigInt(entityId) : 0n,
                    action,
                    details: JSON.stringify({ body: req.body, params: req.params }),
                    performed_by: req.user?.id ? BigInt(req.user.id) : null,
                    ip_address: req.ip
                }
            }).catch(err => console.error('[AuditLog] Failed:', err.message));
        }

        return originalJson(body);
    };

    next();
};

module.exports = auditLog;

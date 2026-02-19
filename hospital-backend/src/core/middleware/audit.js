const db = require('../../config/db');

const auditLog = (entityType, action) => async (req, _res, next) => {
    const originalJson = _res.json.bind(_res);

    _res.json = function (body) {
        if (_res.statusCode < 400 && body?.data) {
            const entityId = body.data?.id || body.data?.insertId || req.params?.id || null;

            db.query(
                `INSERT INTO audit_log (entity_type, entity_id, action, details, performed_by, ip_address)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    entityType,
                    entityId,
                    action,
                    JSON.stringify({ body: req.body, params: req.params }),
                    req.user?.id || null,
                    req.ip
                ]
            ).catch(err => console.error('[AuditLog] Failed:', err.message));
        }

        return originalJson(body);
    };

    next();
};

module.exports = auditLog;

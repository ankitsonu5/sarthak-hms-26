const opdService = require('./opd.service');

exports.createVisit = async (req, res) => {
    try {
        const userId = req.user?.id || 1; // Default to ID 1 (Admin)

        const result = await opdService.createOPDVisit(req.body, userId);

        res.status(201).json({
            success: true,
            message: 'OPD Visit created successfully',
            data: result
        });

    } catch (error) {
        console.error('OPD Creation Error:', error);

        const msg = error?.message || '';
        if (
            error?.code === 'ECONNREFUSED' ||
            error?.fatal === true ||
            /(ECONNREFUSED|PROTOCOL_CONNECTION_LOST|ER_ACCESS_DENIED|getaddrinfo ENOTFOUND|pool)/i.test(msg)
        ) {
            return res.status(503).json({
                success: false,
                message: 'Service temporarily unavailable: database is unreachable.'
            });
        }

        res.status(400).json({
            success: false,
            message: error.message || 'OPD Creation failed'
        });
    }
};

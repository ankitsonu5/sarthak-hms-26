const ipdOrdersService = require('./ipd_orders.service');

exports.createOrder = async (req, res) => {
    try {
        const userId = req.user?.id || 1; // Default to ID 1 (Admin/Doctor)

        const result = await ipdOrdersService.createDoctorOrder(req.body, userId);

        res.status(201).json({
            success: true,
            message: 'IPD Doctor Order created successfully',
            data: result
        });

    } catch (error) {
        console.error('IPD Order Creation Error:', error);

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
            message: error.message || 'IPD Order Creation failed'
        });
    }
};

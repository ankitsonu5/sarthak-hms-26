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

exports.getOrdersByAdmission = async (req, res) => {
    try {
        const result = await ipdOrdersService.getOrdersByAdmission(req.params.admissionId);
        res.status(200).json({ success: true, count: result.length, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const result = await ipdOrdersService.getOrderById(req.params.id);
        if (!result) return res.status(404).json({ success: false, message: 'Order not found' });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

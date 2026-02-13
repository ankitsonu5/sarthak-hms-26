const service = require('./doctor_orders.service');

exports.createOrder = async (req, res) => {
    try {
        const userId = req.user?.id || 1;
        const result = await service.createOrder(req.body, userId);
        res.status(201).json({ success: true, message: 'Order Created (Draft)', data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.signOrder = async (req, res) => {
    try {
        const userId = req.user?.id || 1;
        const result = await service.signOrder(req.params.id, userId);
        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getPatientOrders = async (req, res) => {
    try {
        const result = await service.getOrdersByPatient(req.params.patientId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

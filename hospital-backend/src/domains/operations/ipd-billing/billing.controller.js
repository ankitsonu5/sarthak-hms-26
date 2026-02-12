const billingService = require('./billing.service');

exports.createBill = async (req, res) => {
    try {
        const userId = req.user?.id || 1;
        const result = await billingService.createBill(req.body, userId);
        res.status(201).json({ success: true, message: 'Bill created successfully', data: result });
    } catch (error) {
        console.error('Bill Creation Error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.addBillItem = async (req, res) => {
    try {
        const userId = req.user?.id || 1;
        const result = await billingService.addBillItem(req.body, userId);
        res.status(200).json({ success: true, message: 'Item added to bill', data: result });
    } catch (error) {
        console.error('Add Item Error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.processPayment = async (req, res) => {
    try {
        const userId = req.user?.id || 1;
        const result = await billingService.processPayment(req.body, userId);
        res.status(200).json({ success: true, message: 'Payment processed', data: result });
    } catch (error) {
        console.error('Payment Error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getBillDetails = async (req, res) => {
    try {
        const result = await billingService.getBillDetails(req.params.id);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Get Bill Error:', error);
        res.status(404).json({ success: false, message: error.message });
    }
};

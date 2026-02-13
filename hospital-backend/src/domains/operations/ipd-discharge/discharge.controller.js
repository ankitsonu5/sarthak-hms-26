const dischargeService = require('./discharge.service');

exports.createDischarge = async (req, res) => {
    try {
        const userId = req.user?.id || 1;
        const result = await dischargeService.createDraftDischarge(req.body, userId);
        res.status(201).json({ success: true, message: 'Discharge Created (Draft)', data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.finalizeDischarge = async (req, res) => {
    try {
        const userId = req.user?.id || 1;
        const result = await dischargeService.finalizeDischarge(req.params.id, userId);
        res.status(200).json({ success: true, message: 'Discharge Finalized', data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getDischargeSummary = async (req, res) => {
    try {
        const result = await dischargeService.getDischargeSummary(req.params.id);
        if (!result) return res.status(404).json({ success: false, message: 'Discharge not found' });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

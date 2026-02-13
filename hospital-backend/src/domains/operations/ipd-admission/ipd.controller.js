const ipdService = require('./ipd.service');

exports.createIPDAdmission = async (req, res) => {
    try {
        const userId = req.user?.id || 1; // Default to ID 1 (Admin)

        const result = await ipdService.createIPDAdmission(req.body, userId);

        res.status(201).json({
            success: true,
            message: 'IPD Admission created successfully',
            data: result
        });

    } catch (error) {
        console.error('IPD Admission Error:', error);

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
            message: error.message || 'IPD Admission failed'
        });
    }
};
exports.getAllAdmissions = async (req, res) => {
    try {
        const result = await ipdService.getAllAdmissions();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAdmissionById = async (req, res) => {
    try {
        const result = await ipdService.getAdmissionById(req.params.id);
        if (!result) return res.status(404).json({ success: false, message: 'Admission not found' });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

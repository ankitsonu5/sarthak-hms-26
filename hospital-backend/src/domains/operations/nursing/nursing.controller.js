const nursingService = require('./nursing.service');

exports.createObservation = async (req, res) => {
    try {
        const userId = req.user?.id || 1;
        // payload expects: { admission_id, observation_datetime, shift_type, vitals: {...}, io: {...}, remarks }
        const result = await nursingService.createObservationHeader(req.body, userId);
        res.status(201).json({ success: true, message: 'Nursing Observation Recorded', data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.recordMAR = async (req, res) => {
    try {
        const userId = req.user?.id || 1;
        const result = await nursingService.recordMAR(req.body, userId);
        res.status(201).json({ success: true, message: 'Medication Administered', data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.addNote = async (req, res) => {
    try {
        const userId = req.user?.id || 1;
        const result = await nursingService.addNursingNote(req.body, userId);
        res.status(201).json({ success: true, message: 'Nursing Note Added', data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getClinicalDashboard = async (req, res) => {
    try {
        const result = await nursingService.getClinicalDashboard(req.params.admissionId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

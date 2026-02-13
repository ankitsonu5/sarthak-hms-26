const patientService = require('./patient.service');

exports.registerPatient = async (req, res) => {
    try {
        // Basic User Context (In real app, from Auth Middleware)
        const userId = req.user?.id || 1; // Default to ID 1 if no auth yet

        const result = await patientService.register(req.body, userId);

        res.status(201).json({
            success: true,
            message: 'Patient registered successfully',
            data: result
        });

    } catch (error) {
        console.error('Registration Error:', error);

        // Database unavailable → 503
        const msg = error?.message || '';
        if (
            error?.code === 'ECONNREFUSED' ||
            error?.fatal === true ||
            /(ECONNREFUSED|PROTOCOL_CONNECTION_LOST|ER_ACCESS_DENIED|getaddrinfo ENOTFOUND|pool)/i.test(msg)
        ) {
            return res.status(503).json({
                success: false,
                message: 'Service temporarily unavailable: database is unreachable. Please try again later.'
            });
        }

        // Handle known business rule errors
        if (error.message.includes('Patient already registered')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        res.status(400).json({
            success: false,
            message: error.message || 'Registration failed'
        });
    }
};
// List all patients
exports.getAllPatients = async (req, res) => {
    try {
        const result = await patientService.getAll();
        res.status(200).json({ success: true, count: result.length, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single patient
exports.getPatientById = async (req, res) => {
    try {
        const result = await patientService.getById(req.params.id);
        if (!result) return res.status(404).json({ success: false, message: 'Patient not found' });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update patient
exports.updatePatient = async (req, res) => {
    try {
        const result = await patientService.update(req.params.id, req.body);
        res.status(200).json({ success: true, message: 'Updated successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Delete patient
exports.deletePatient = async (req, res) => {
    try {
        await patientService.delete(req.params.id);
        res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

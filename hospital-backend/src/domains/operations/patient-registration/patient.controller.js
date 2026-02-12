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

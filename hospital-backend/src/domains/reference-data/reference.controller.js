const service = require('./reference.service');

exports.getAllReferenceData = async (req, res) => {
    try {
        const data = await service.getAll();
        res.json({
            success: true,
            message: 'Reference data fetched successfully',
            data: data
        });
    } catch (error) {
        console.error('Reference Data Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reference data',
            error: error.message
        });
    }
};

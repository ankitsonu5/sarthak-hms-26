const service = require('./reference.service');
const asyncHandler = require('../../core/middleware/asyncHandler');
const response = require('../../core/helpers/response');

exports.getAllReferenceData = asyncHandler(async (req, res) => {
    const data = await service.getAll();
    response.success(res, data, 'Reference data fetched successfully');
});

const bedService = require('./bed.service');
const asyncHandler = require('../../../core/middleware/asyncHandler');
const response = require('../../../core/helpers/response');

exports.allocateBed = asyncHandler(async (req, res) => {
    const result = await bedService.allocateBed(req.body, req.user.id);
    response.created(res, result, 'Bed allocated successfully');
});

exports.transferBed = asyncHandler(async (req, res) => {
    const result = await bedService.transferBed(req.body, req.user.id);
    response.success(res, result, 'Bed transferred successfully');
});

exports.getAvailableBeds = asyncHandler(async (req, res) => {
    const result = await bedService.getAvailableBeds(req.query.ward_id);
    response.success(res, result);
});

exports.getBedOccupancy = asyncHandler(async (req, res) => {
    const result = await bedService.getBedOccupancy();
    response.success(res, result);
});

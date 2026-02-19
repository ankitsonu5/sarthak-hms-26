const opdService = require('./opd.service');
const asyncHandler = require('../../core/middleware/asyncHandler');
const response = require('../../core/helpers/response');
const { NotFoundError } = require('../../core/errors');

exports.createVisit = asyncHandler(async (req, res) => {
    const result = await opdService.createOPDVisit(req.body, req.user.id);
    response.created(res, result, 'OPD Visit created successfully');
});

exports.getAllVisits = asyncHandler(async (req, res) => {
    const result = await opdService.getAllVisits();
    response.success(res, result);
});

exports.getVisitById = asyncHandler(async (req, res) => {
    const result = await opdService.getVisitById(req.params.id);
    if (!result) throw new NotFoundError('OPD Visit', req.params.id);
    response.success(res, result);
});

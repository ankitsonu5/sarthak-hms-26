const claimsService = require('./claims.service');
const asyncHandler = require('../../../core/middleware/asyncHandler');
const response = require('../../../core/helpers/response');
const { NotFoundError } = require('../../../core/errors');

exports.submit = asyncHandler(async (req, res) => {
    const result = await claimsService.submitClaim(req.body, req.user.id);
    response.created(res, result, 'Claim submitted successfully');
});

exports.updateStatus = asyncHandler(async (req, res) => {
    const result = await claimsService.updateClaimStatus(req.params.id, req.body, req.user.id);
    if (!result) throw new NotFoundError('Claim', req.params.id);
    response.success(res, result, 'Claim status updated');
});

exports.addRejection = asyncHandler(async (req, res) => {
    const result = await claimsService.addRejection(req.params.id, req.body);
    response.success(res, result, 'Rejection reason recorded');
});

exports.getById = asyncHandler(async (req, res) => {
    const result = await claimsService.getClaimById(req.params.id);
    if (!result) throw new NotFoundError('Claim', req.params.id);
    response.success(res, result);
});

exports.getByAdmission = asyncHandler(async (req, res) => {
    const result = await claimsService.getClaimsByAdmission(req.params.admissionId);
    response.success(res, result);
});

exports.getAll = asyncHandler(async (req, res) => {
    const result = await claimsService.getAllClaims();
    response.success(res, result);
});

exports.getTimeline = asyncHandler(async (req, res) => {
    const result = await claimsService.getClaimTimeline(req.params.id);
    response.success(res, result);
});

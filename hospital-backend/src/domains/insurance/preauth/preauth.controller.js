const preauthService = require('./preauth.service');
const asyncHandler = require('../../../core/middleware/asyncHandler');
const response = require('../../../core/helpers/response');
const { NotFoundError } = require('../../../core/errors');

exports.create = asyncHandler(async (req, res) => {
    const result = await preauthService.createPreAuth(req.body, req.user.id);
    response.created(res, result, 'Pre-authorization request created');
});

exports.updateStatus = asyncHandler(async (req, res) => {
    const result = await preauthService.updatePreauthStatus(req.params.id, req.body, req.user.id);
    if (!result) throw new NotFoundError('Pre-authorization', req.params.id);
    response.success(res, result, 'Pre-authorization status updated');
});

exports.getById = asyncHandler(async (req, res) => {
    const result = await preauthService.getPreauthById(req.params.id);
    if (!result) throw new NotFoundError('Pre-authorization', req.params.id);
    response.success(res, result);
});

exports.getByAdmission = asyncHandler(async (req, res) => {
    const result = await preauthService.getPreauthsByAdmission(req.params.admissionId);
    response.success(res, result);
});

exports.getAll = asyncHandler(async (req, res) => {
    const result = await preauthService.getAllPreAuths();
    response.success(res, result);
});

const escalationService = require('./escalation.service');
const asyncHandler = require('../../../core/middleware/asyncHandler');
const response = require('../../../core/helpers/response');
const { NotFoundError } = require('../../../core/errors');

exports.create = asyncHandler(async (req, res) => {
    const result = await escalationService.createEscalation(req.body, req.user.id);
    response.created(res, result, 'Escalation created');
});

exports.acknowledge = asyncHandler(async (req, res) => {
    const result = await escalationService.acknowledge(req.params.id, req.body, req.user.id);
    if (!result) throw new NotFoundError('Escalation', req.params.id);
    response.success(res, result, 'Escalation acknowledged');
});

exports.getByClaim = asyncHandler(async (req, res) => {
    const result = await escalationService.getByClaim(req.params.claimId);
    response.success(res, result);
});

exports.getPending = asyncHandler(async (req, res) => {
    const result = await escalationService.getPendingEscalations();
    response.success(res, result);
});

const dischargeService = require('./discharge.service');
const asyncHandler = require('../../../core/middleware/asyncHandler');
const response = require('../../../core/helpers/response');
const { NotFoundError } = require('../../../core/errors');

exports.createDischarge = asyncHandler(async (req, res) => {
    const result = await dischargeService.createDraftDischarge(req.body, req.user.id);
    response.created(res, result, 'Discharge created (draft)');
});

exports.finalizeDischarge = asyncHandler(async (req, res) => {
    const result = await dischargeService.finalizeDischarge(req.params.id, req.user.id);
    response.success(res, result, 'Discharge finalized');
});

exports.getDischargeSummary = asyncHandler(async (req, res) => {
    const result = await dischargeService.getDischargeSummary(req.params.id);
    if (!result) throw new NotFoundError('Discharge', req.params.id);
    response.success(res, result);
});

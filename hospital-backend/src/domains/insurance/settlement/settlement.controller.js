const settlementService = require('./settlement.service');
const asyncHandler = require('../../../core/middleware/asyncHandler');
const response = require('../../../core/helpers/response');
const { NotFoundError } = require('../../../core/errors');

exports.record = asyncHandler(async (req, res) => {
    const result = await settlementService.recordSettlement(req.body);
    response.created(res, result, 'Settlement recorded');
});

exports.getByClaim = asyncHandler(async (req, res) => {
    const result = await settlementService.getSettlementsByClaim(req.params.claimId);
    response.success(res, result);
});

exports.getById = asyncHandler(async (req, res) => {
    const result = await settlementService.getSettlementById(req.params.id);
    if (!result) throw new NotFoundError('Settlement', req.params.id);
    response.success(res, result);
});

exports.postToLedger = asyncHandler(async (req, res) => {
    const result = await settlementService.markPostedToLedger(req.params.id);
    if (!result) throw new NotFoundError('Settlement', req.params.id);
    response.success(res, result, 'Posted to ledger');
});

exports.receivables = asyncHandler(async (req, res) => {
    const result = await settlementService.getReceivableSummary();
    response.success(res, result);
});

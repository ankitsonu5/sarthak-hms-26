const billingService = require('./billing.service');
const asyncHandler = require('../../core/middleware/asyncHandler');
const response = require('../../core/helpers/response');
const { NotFoundError } = require('../../core/errors');

exports.createBill = asyncHandler(async (req, res) => {
    const result = await billingService.createBill(req.body, req.user.id);
    response.created(res, result, 'Bill created successfully');
});

exports.addBillItem = asyncHandler(async (req, res) => {
    const result = await billingService.addBillItem(req.body, req.user.id);
    response.success(res, result, 'Item added to bill');
});

exports.processPayment = asyncHandler(async (req, res) => {
    const result = await billingService.processPayment(req.body, req.user.id);
    response.success(res, result, 'Payment processed');
});

exports.getBillDetails = asyncHandler(async (req, res) => {
    const result = await billingService.getBillDetails(req.params.id);
    if (!result) throw new NotFoundError('Bill', req.params.id);
    response.success(res, result);
});

exports.getAllBills = asyncHandler(async (req, res) => {
    const result = await billingService.getAllBills();
    response.success(res, result);
});

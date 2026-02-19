const ordersService = require('./orders.service');
const asyncHandler = require('../../core/middleware/asyncHandler');
const response = require('../../core/helpers/response');
const { NotFoundError } = require('../../core/errors');

exports.createIPDOrder = asyncHandler(async (req, res) => {
    const result = await ordersService.createIPDOrder(req.body, req.user.id);
    response.created(res, result, 'IPD order created successfully');
});

exports.createCPOEOrder = asyncHandler(async (req, res) => {
    const result = await ordersService.createCPOEOrder(req.body, req.user.id);
    response.created(res, result, 'Order created (draft)');
});

exports.signOrder = asyncHandler(async (req, res) => {
    const result = await ordersService.signOrder(req.params.id, req.user.id);
    response.success(res, result, result.message);
});

exports.getOrdersByAdmission = asyncHandler(async (req, res) => {
    const result = await ordersService.getOrdersByAdmission(req.params.admissionId);
    response.success(res, result);
});

exports.getOrderById = asyncHandler(async (req, res) => {
    const result = await ordersService.getOrderById(req.params.id);
    if (!result) throw new NotFoundError('Order', req.params.id);
    response.success(res, result);
});

exports.getOrdersByPatient = asyncHandler(async (req, res) => {
    const result = await ordersService.getOrdersByPatient(req.params.patientId);
    response.success(res, result);
});

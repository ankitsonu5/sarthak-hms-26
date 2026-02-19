const masterService = require('./master.service');
const asyncHandler = require('../../core/middleware/asyncHandler');
const response = require('../../core/helpers/response');

exports.getAll = asyncHandler(async (req, res) => {
    const data = await masterService.getAll(req.params.tableName);
    response.success(res, data);
});

exports.getById = asyncHandler(async (req, res) => {
    const data = await masterService.getById(req.params.tableName, req.params.id);
    response.success(res, data);
});

exports.create = asyncHandler(async (req, res) => {
    const data = await masterService.create(req.params.tableName, req.body);
    response.created(res, data, 'Created successfully');
});

exports.update = asyncHandler(async (req, res) => {
    const data = await masterService.update(req.params.tableName, req.params.id, req.body);
    response.success(res, data, 'Updated successfully');
});

exports.delete = asyncHandler(async (req, res) => {
    const data = await masterService.delete(req.params.tableName, req.params.id);
    response.success(res, data, 'Deactivated successfully');
});

exports.getRegistrationMasters = asyncHandler(async (req, res) => {
    const data = await masterService.getRegistrationMasters();
    response.success(res, data);
});

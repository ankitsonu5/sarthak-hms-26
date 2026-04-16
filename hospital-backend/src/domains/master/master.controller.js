const MasterService = require('./master.service');
const asyncHandler = require('../../core/middleware/asyncHandler');
const response = require('../../core/helpers/response');

class MasterController {

    getAll = asyncHandler(async (req, res) => {
        const data = await MasterService.getAll(req.params.tableName);
        return response.success(res, data);
    });

    getById = asyncHandler(async (req, res) => {
        const data = await MasterService.getById(req.params.tableName, req.params.id);
        if (!data) return response.error(res, 'Record not found', 404);
        return response.success(res, data);
    });

    create = asyncHandler(async (req, res) => {
        const data = await MasterService.create(req.params.tableName, req.body);
        return response.created(res, data, 'Created successfully');
    });

    update = asyncHandler(async (req, res) => {
        const data = await MasterService.update(req.params.tableName, req.params.id, req.body);
        return response.success(res, data, 'Updated successfully');
    });

    delete = asyncHandler(async (req, res) => {
        const data = await MasterService.delete(req.params.tableName, req.params.id);
        return response.success(res, data, 'Record deactivated');
    });

    getRegistrationMasters = asyncHandler(async (req, res) => {
        const data = await MasterService.getRegistrationMasters();
        return response.success(res, data);
    });
}

module.exports = new MasterController();

const masterService = require('./patient_master_dependencies.service');
const asyncHandler = require('../../core/middleware/asyncHandler');
const response = require('../../core/helpers/response');

exports.getRegistrationMasters = asyncHandler(async (req, res) => {
    const data = await masterService.getRegistrationMasters();
    response.success(res, data);
});

exports.addCity = asyncHandler(async (req, res) => {
    const result = await masterService.addCity(req.body);
    response.created(res, result, 'City added');
});

exports.addReferralSource = asyncHandler(async (req, res) => {
    const result = await masterService.addReferralSource(req.body);
    response.created(res, result, 'Referral source added');
});

exports.addGenericMaster = asyncHandler(async (req, res) => {
    const { tableName } = req.params;
    const result = await masterService.addMasterData(tableName, req.body);
    response.created(res, result, `Data added to ${tableName}`);
});

exports.deleteGenericMaster = asyncHandler(async (req, res) => {
    const { tableName, id } = req.params;
    const result = await masterService.deleteMasterData(tableName, id);
    response.success(res, result, `Record deleted from ${tableName}`);
});

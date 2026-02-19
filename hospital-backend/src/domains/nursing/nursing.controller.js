const nursingService = require('./nursing.service');
const asyncHandler = require('../../core/middleware/asyncHandler');
const response = require('../../core/helpers/response');

exports.createObservation = asyncHandler(async (req, res) => {
    const result = await nursingService.createObservationHeader(req.body, req.user.id);
    response.created(res, result, 'Nursing observation recorded');
});

exports.recordMAR = asyncHandler(async (req, res) => {
    const result = await nursingService.recordMAR(req.body, req.user.id);
    response.created(res, result, 'Medication administered');
});

exports.addNote = asyncHandler(async (req, res) => {
    const result = await nursingService.addNursingNote(req.body, req.user.id);
    response.created(res, result, 'Nursing note added');
});

exports.getClinicalDashboard = asyncHandler(async (req, res) => {
    const result = await nursingService.getClinicalDashboard(req.params.admissionId);
    response.success(res, result);
});

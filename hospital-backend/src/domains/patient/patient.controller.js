const patientService = require('./patient.service');
const asyncHandler = require('../../core/middleware/asyncHandler');
const response = require('../../core/helpers/response');
const { NotFoundError } = require('../../core/errors');

exports.registerPatient = asyncHandler(async (req, res) => {
    const result = await patientService.register(req.body, req.user.id);
    response.created(res, result, 'Patient registered successfully');
});

exports.getAllPatients = asyncHandler(async (req, res) => {
    const result = await patientService.getAll();
    response.success(res, result);
});

exports.getPatientById = asyncHandler(async (req, res) => {
    const result = await patientService.getById(req.params.id);
    if (!result) throw new NotFoundError('Patient', req.params.id);
    response.success(res, result);
});

exports.updatePatient = asyncHandler(async (req, res) => {
    const result = await patientService.update(req.params.id, req.body);
    response.success(res, result, 'Patient updated successfully');
});

exports.deletePatient = asyncHandler(async (req, res) => {
    await patientService.delete(req.params.id);
    response.noContent(res, 'Patient deleted successfully');
});

const admissionService = require('./admission.service');
const asyncHandler = require('../../../core/middleware/asyncHandler');
const response = require('../../../core/helpers/response');
const { NotFoundError } = require('../../../core/errors');

exports.createIPDAdmission = asyncHandler(async (req, res) => {
    const result = await admissionService.createIPDAdmission(req.body, req.user.id);
    response.created(res, result, 'IPD Admission created successfully');
});

exports.getAllAdmissions = asyncHandler(async (req, res) => {
    const result = await admissionService.getAllAdmissions();
    response.success(res, result);
});

exports.getAdmissionById = asyncHandler(async (req, res) => {
    const result = await admissionService.getAdmissionById(req.params.id);
    if (!result) throw new NotFoundError('Admission', req.params.id);
    response.success(res, result);
});

const documentsService = require('./documents.service');
const asyncHandler = require('../../../core/middleware/asyncHandler');
const response = require('../../../core/helpers/response');
const { NotFoundError } = require('../../../core/errors');

exports.upload = asyncHandler(async (req, res) => {
    const result = await documentsService.uploadDocument(req.body, req.user.id);
    response.created(res, result, 'Document uploaded successfully');
});

exports.getByClaim = asyncHandler(async (req, res) => {
    const result = await documentsService.getDocumentsByClaim(req.params.claimId);
    response.success(res, result);
});

exports.getByPreauth = asyncHandler(async (req, res) => {
    const result = await documentsService.getDocumentsByPreauth(req.params.preauthId);
    response.success(res, result);
});

exports.remove = asyncHandler(async (req, res) => {
    const result = await documentsService.deleteDocument(req.params.id);
    if (!result) throw new NotFoundError('Document', req.params.id);
    response.noContent(res, 'Document removed');
});

exports.checklist = asyncHandler(async (req, res) => {
    const result = await documentsService.getDocumentChecklist(req.params.claimId);
    response.success(res, result);
});

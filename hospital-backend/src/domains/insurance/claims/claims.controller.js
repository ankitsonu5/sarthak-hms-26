const BaseController = require('../../../core/base/BaseController');
const claimsService = require('./claims.service');

const ctrl = new BaseController();

exports.submit = ctrl.handle(async (req, res) => {
    const result = await claimsService.submitClaim(req.body, req.user.id);
    ctrl.created(res, result, 'Claim submitted');
});

exports.updateStatus = ctrl.handle(async (req, res) => {
    const ip = req.ip || req.connection?.remoteAddress || req.headers?.['x-forwarded-for']?.split(',')[0];
    const result = await claimsService.updateClaimStatus(req.params.id, req.body, req.user.id, ip);
    if (!result) ctrl.notFound('Claim', req.params.id);
    ctrl.ok(res, result, 'Status updated');
});

exports.addRejection = ctrl.handle(async (req, res) => {
    const result = await claimsService.addRejection(req.params.id, req.body);
    ctrl.ok(res, result, 'Rejection recorded');
});

exports.getById = ctrl.handle(async (req, res) => {
    const result = await claimsService.getClaimById(req.params.id);
    if (!result) ctrl.notFound('Claim', req.params.id);
    ctrl.ok(res, result);
});

exports.getByAdmission = ctrl.handle(async (req, res) => {
    const result = await claimsService.getClaimsByAdmission(req.params.admissionId);
    ctrl.ok(res, result);
});

exports.getAll = ctrl.handle(async (req, res) => {
    const result = await claimsService.getAllClaims();
    ctrl.ok(res, result);
});

exports.getTimeline = ctrl.handle(async (req, res) => {
    const result = await claimsService.getClaimTimeline(req.params.id);
    ctrl.ok(res, result);
});

exports.getAgingSummary = ctrl.handle(async (req, res) => {
    const result = await claimsService.getAgingSummary();
    ctrl.ok(res, result);
});

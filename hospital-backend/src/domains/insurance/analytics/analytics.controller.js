const analyticsService = require('./analytics.service');
const asyncHandler = require('../../../core/middleware/asyncHandler');
const response = require('../../../core/helpers/response');
const { runInsuranceAging } = require('../../../jobs/scheduler');

exports.refreshAging = asyncHandler(async (req, res) => {
    const result = await runInsuranceAging();
    response.success(res, result, 'Aging updated');
});

exports.refreshDenial = asyncHandler(async (req, res) => {
    const result = await analyticsService.refreshDenialAnalytics();
    response.success(res, result, 'Denial analytics refreshed');
});

exports.getDenialAnalytics = asyncHandler(async (req, res) => {
    const filters = {
        month_year: req.query.month_year,
        insurance_company_id: req.query.insurance_company_id
    };
    const result = await analyticsService.getDenialAnalytics(filters);
    response.success(res, result);
});

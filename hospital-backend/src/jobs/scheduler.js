/**
 * Centralized job registration.
 * Jobs can be run via cron or manually.
 */
const insuranceAgingJob = require('./insurance.aging.job');

async function runInsuranceAging() {
    return insuranceAgingJob.run();
}

module.exports = {
    runInsuranceAging
};

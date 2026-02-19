const JOBS = [
    { name: 'audit-archive', interval: '0 2 * * *', handler: require('./audit.archive.job') },
    { name: 'backup', interval: '0 3 * * *', handler: require('./backup.job') },
    { name: 'expiry-alert', interval: '0 8 * * *', handler: require('./expiry.alert.job') }
];

exports.startAll = () => {
    // TODO: Replace with node-cron or bull queue when ready
    console.log(`[Scheduler] ${JOBS.length} jobs registered (cron not active in dev)`);
    JOBS.forEach(job => {
        console.log(`  - ${job.name} (${job.interval})`);
    });
};

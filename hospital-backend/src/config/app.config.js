module.exports = {
    hospital: {
        name: process.env.HOSPITAL_NAME || 'HMS Enterprise Hospital',
        branchCode: process.env.BRANCH_CODE || 'MAIN',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        dateFormat: 'DD-MM-YYYY',
        financialYearStart: '04-01'
    },

    uhid: {
        prefix: process.env.UHID_PREFIX || 'HMS',
        padLength: 6
    },

    pagination: {
        defaultLimit: 20,
        maxLimit: 100
    },

    upload: {
        maxFileSizeMB: 10,
        allowedMimeTypes: [
            'image/jpeg', 'image/png', 'image/webp',
            'application/pdf'
        ]
    },

    session: {
        maxIdleMinutes: 30,
        maxSessionHours: 12
    }
};

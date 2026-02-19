require('dotenv').config();

const required = (key) => {
    if (!process.env[key]) {
        console.warn(`[ENV] Missing required variable: ${key} — using default`);
    }
    return process.env[key];
};

module.exports = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT, 10) || 3000,

    DB_HOST: required('DB_HOST') || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT, 10) || 3306,
    DB_USER: required('DB_USER') || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: required('DB_NAME') || 'hospital_db',
    DB_POOL_LIMIT: parseInt(process.env.DB_POOL_LIMIT, 10) || 10,

    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',

    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

    LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

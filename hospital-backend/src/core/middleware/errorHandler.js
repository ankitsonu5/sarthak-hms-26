const AppError = require('../errors/AppError');

const DB_ERROR_MAP = {
    'ER_DUP_ENTRY': { statusCode: 409, message: 'Duplicate entry — record already exists' },
    'ER_NO_REFERENCED_ROW_2': { statusCode: 400, message: 'Referenced record does not exist' },
    'ER_ROW_IS_REFERENCED_2': { statusCode: 409, message: 'Cannot delete — record is referenced by other data' },
    'ER_DATA_TOO_LONG': { statusCode: 400, message: 'Input data exceeds allowed length' },
    'ER_TRUNCATED_WRONG_VALUE': { statusCode: 400, message: 'Invalid data format' }
};

const isDbConnectionError = (err) => {
    const msg = err?.message || '';
    return (
        err?.code === 'ECONNREFUSED' ||
        err?.fatal === true ||
        /(ECONNREFUSED|PROTOCOL_CONNECTION_LOST|ER_ACCESS_DENIED|getaddrinfo ENOTFOUND|pool)/i.test(msg)
    );
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
            ...(err.errors && { errors: err.errors })
        });
    }

    if (isDbConnectionError(err)) {
        return res.status(503).json({
            success: false,
            status: 'error',
            message: 'Service temporarily unavailable — database is unreachable'
        });
    }

    const dbErr = DB_ERROR_MAP[err?.code];
    if (dbErr) {
        return res.status(dbErr.statusCode).json({
            success: false,
            status: 'fail',
            message: dbErr.message
        });
    }

    console.error('[UnhandledError]', err);

    return res.status(500).json({
        success: false,
        status: 'error',
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message || 'Internal server error'
    });
};

module.exports = errorHandler;

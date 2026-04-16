const AppError = require('../errors/AppError');

const PRISMA_ERROR_MAP = {
    'P2002': { statusCode: 409, message: 'Duplicate entry — record already exists' },
    'P2003': { statusCode: 400, message: 'Referenced record does not exist' },
    'P2014': { statusCode: 409, message: 'Cannot delete — record is referenced by other data' },
    'P2025': { statusCode: 404, message: 'Record not found' },
    'P2006': { statusCode: 400, message: 'Invalid data format' },
    'P2011': { statusCode: 400, message: 'Null constraint violation' }
};

const isDbConnectionError = (err) => {
    const msg = err?.message || '';
    return (
        err?.code === 'ECONNREFUSED' ||
        /(ECONNREFUSED|PROTOCOL_CONNECTION_LOST|getaddrinfo ENOTFOUND|Can't reach database)/i.test(msg)
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

    const prismaErr = PRISMA_ERROR_MAP[err?.code];
    if (prismaErr) {
        return res.status(prismaErr.statusCode).json({
            success: false,
            status: 'fail',
            message: prismaErr.message
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

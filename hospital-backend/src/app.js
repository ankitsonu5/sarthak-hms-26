const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

require('./core/helpers/bigint')();
const { prisma } = require('./config/db');
const requestLogger = require('./core/middleware/requestLogger');
const errorHandler = require('./core/middleware/errorHandler');
const response = require('./core/helpers/response');
const v1Router = require('./routes/v1');

const app = express();

// --- Middleware Pipeline ---
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// --- Health Probe ---
app.get('/health', async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return response.success(res, { status: 'OK' });
    } catch (e) {
        return response.error(res, 'Database Unreachable', 503);
    }
});

// --- API Routes ---
app.use('/api/v1', v1Router);

// --- 404 & Error Handling ---
app.use((_req, res) => response.error(res, 'Route not found', 404));
app.use(errorHandler);

module.exports = app;

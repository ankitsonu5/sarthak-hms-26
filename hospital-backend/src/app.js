const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pool = require('./config/db');
const requestLogger = require('./core/middleware/requestLogger');
const errorHandler = require('./core/middleware/errorHandler');
const { authenticate } = require('./core/middleware/auth');

const app = express();

// ------------------------------------
// Global Middleware Pipeline
// ------------------------------------
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// ------------------------------------
// Health Probes (public)
// ------------------------------------
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/db/health', async (_req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 AS ok');
        return res.json({ status: 'ok', database: 'connected', result: rows[0]?.ok === 1 });
    } catch (error) {
        return res.status(503).json({ status: 'error', database: 'disconnected', error: error?.message });
    }
});

// ------------------------------------
// Auth (public - no JWT required)
// ------------------------------------
const v1 = '/api/v1';
app.use(`${v1}/auth`, require('./domains/auth/auth.routes'));

// ------------------------------------
// Protected Routes (JWT required)
// ------------------------------------
app.use(authenticate);

// Master Data
app.use(`${v1}/master`, require('./domains/master/master.routes'));
app.use(`${v1}/master-deps`, require('./domains/master/patient_master_dependencies.routes'));
app.use(`${v1}/reference-data`, require('./domains/reference-data/reference.routes'));

// Clinical Domains
app.use(`${v1}/patients`, require('./domains/patient/patient.routes'));
app.use(`${v1}/opd`, require('./domains/opd/opd.routes'));
app.use(`${v1}/ipd`, require('./domains/ipd/ipd.routes'));
app.use(`${v1}/orders`, require('./domains/orders/orders.routes'));
app.use(`${v1}/nursing`, require('./domains/nursing/nursing.routes'));
app.use(`${v1}/billing`, require('./domains/billing/billing.routes'));
app.use(`${v1}/insurance`, require('./domains/insurance/insurance.routes'));

// ------------------------------------
// 404 Handler
// ------------------------------------
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ------------------------------------
// Global Error Handler (must be last)
// ------------------------------------
app.use(errorHandler);

module.exports = app;

// app.js
// Role: Express Application, Middlewares, Routes configuration
// This file initializes the express app and exports it.

const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Basic health endpoint for readiness/liveness probes
app.get('/api', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Explicit health alias
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Database health
app.get('/api/db/health', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    return res.json({ status: 'ok', database: 'connected', result: rows[0]?.ok === 1 });
  } catch (error) {
    return res.status(503).json({ status: 'error', database: 'disconnected', error: error?.message || 'DB unreachable' });
  }
});

// ==========================================
// 🏥 HMS Domain Routes
// ==========================================

// 1. Reference Data (Dropdowns)
app.use('/api/reference-data', require('./domains/reference-data/reference.routes'));

// 2. Patient Registration
app.use('/api/patients', require('./domains/operations/patient-registration/patient.routes'));

// 3. OPD Operations
app.use('/api/opd', require('./domains/operations/opd-visit/opd.routes'));

// 4. IPD Operations
app.use('/api/ipd', require('./domains/operations/ipd-admission/ipd.routes'));

// 5. IPD Orders
app.use('/api/ipd-orders', require('./domains/operations/ipd-orders/ipd_orders.routes'));

// 6. IPD Billing
app.use('/api/ipd-billing', require('./domains/operations/ipd-billing/billing.routes'));

// Fallback error handler (in case a route calls next(err))
// Note: many controllers self-handle errors. This is a safety net.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const msg = err?.message || '';
  if (
    err?.code === 'ECONNREFUSED' ||
    err?.fatal === true ||
    /(ECONNREFUSED|PROTOCOL_CONNECTION_LOST|ER_ACCESS_DENIED|getaddrinfo ENOTFOUND|pool)/i.test(msg)
  ) {
    return res.status(503).json({ status: 'error', message: 'Database unavailable' });
  }
  return res.status(500).json({ status: 'error', message: msg || 'Internal Server Error' });
});

module.exports = app;

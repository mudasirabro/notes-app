require('dotenv').config();
const express = require('express');
const pinoHttp = require('pino-http');
const logger = require('./logger');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(pinoHttp({ logger }));
app.use(express.json());

app.get('/health', (req, res) => {
  req.log.info('Health check hit');
  res.json({ status: 'OK' });
});

app.get('/db-test', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    req.log.info({ result: rows[0].result }, 'Database connection OK');
    res.json({ db: 'connected', result: rows[0].result });
  } catch (err) {
    next(err);
  }
});

// Deliberately throws — proves the error handler catches it
app.get('/test-error', (req, res) => {
  throw new Error('This is a test error');
});

// Global error handler — MUST have 4 args, MUST be last
app.use((err, req, res, next) => {
  req.log.error({ err }, 'Unhandled error');
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong',
  });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
/**
 * HOJAI Finance Accountant AI
 * Invoice → Ledger → Tally
 * Production-ready Express server
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { config, validateConfig } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/index.js';

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Request logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID middleware
app.use((req, res, next) => {
  req.headers['x-request-id'] = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  res.setHeader('X-Request-ID', req.headers['x-request-id']);
  next();
});

// Health check endpoints (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'finance-accountant',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

app.get('/health/ready', async (req, res) => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ status: 'not ready', reason: 'MongoDB disconnected' });
      return;
    }
    res.json({ status: 'ready', mongodb: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', reason: 'Health check failed' });
  }
});

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
async function start() {
  try {
    // Validate configuration
    validateConfig();

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log('MongoDB connected successfully');

    // Start HTTP server
    app.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║  HOJAI Finance Accountant AI                              ║
║  Invoice → Ledger → Tally                                ║
║  Port: ${config.port.toString().padEnd(47)}║
║  Environment: ${config.nodeEnv.padEnd(43)}║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;

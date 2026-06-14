/**
 * HOJAI Finance AI Service
 * Transaction Analysis, Predictions & Insights
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { config, validateConfig } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/index.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Request ID
app.use((req, res, next) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
});

// Health endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'finance-ai',
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
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ status: 'not ready', reason: 'MongoDB disconnected' });
    return;
  }
  res.json({ status: 'ready', mongodb: 'connected' });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  await mongoose.connection.close();
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
async function start() {
  try {
    validateConfig();

    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongodb.uri);
    console.log('MongoDB connected');

    app.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║  HOJAI Finance AI                                          ║
║  Transaction Analysis & Predictions                        ║
║  Port: ${config.port.toString().padEnd(47)}║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;

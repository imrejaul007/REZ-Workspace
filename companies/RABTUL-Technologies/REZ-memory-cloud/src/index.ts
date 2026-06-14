/**
 * REZ Memory Cloud - Main Entry Point
 * Port: 4210
 */

import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';

import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { eitherAuth } from './middleware/auth.js';
import { defaultRateLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app: Express = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', true);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
}));
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(defaultRateLimiter);

// Health check endpoints (no auth required)
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'REZ Memory Cloud',
    version: '1.0.0',
    port: config.port,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'alive' });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    const mongoState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const isReady = mongoState === 'connected';

    if (!isReady) {
      res.status(503).json({
        status: 'not ready',
        mongodb: mongoState,
      });
      return;
    }

    res.json({
      status: 'ready',
      mongodb: mongoState,
    });
  } catch {
    res.status(503).json({ status: 'not ready' });
  }
});

// API routes with authentication
app.use('/api', eitherAuth);
app.use('/api', routes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    mongoose.connection.close().then(() => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    }).catch(() => {
      process.exit(0);
    });
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const server = app.listen(config.port, async () => {
  logger.info(`REZ Memory Cloud started on port ${config.port}`);

  // Connect to MongoDB
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error({ msg: 'MongoDB connection failed', error });
    // Don't exit in development
    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
  }
});

export default app;

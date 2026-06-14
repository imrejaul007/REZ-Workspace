import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import apiRoutes from './routes';
import { config } from './config';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/common';

dotenv.config();

const app: Express = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      service: 'NexTabizz Service',
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

app.get('/ready', async (_req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  if (mongoStatus === 'connected') {
    res.json({ success: true, data: { status: 'ready', mongodb: mongoStatus } });
  } else {
    res.status(503).json({ success: false, error: { code: 'SERVICE_NOT_READY' } });
  }
});

app.use('/api', apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection failed', { error: (error as Error).message });
    throw error;
  }
}

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down...`);
  await mongoose.connection.close();
  process.exit(0);
}

async function startServer(): Promise<void> {
  try {
    await connectToDatabase();

    app.listen(config.port, '0.0.0.0', () => {
      logger.info(`NexTabizz Service started on port ${config.port}`);
      logger.info(`Health: http://localhost:${config.port}/health`);
      logger.info(`API: http://localhost:${config.port}/api`);
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

startServer();

export default app;

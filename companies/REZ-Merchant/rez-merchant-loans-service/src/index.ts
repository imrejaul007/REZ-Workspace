import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import loanRoutes from './routes/loans';
import { config } from './config';
import { logger } from './config/logger';

dotenv.config();

const app: Express = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      service: 'REZ Merchant Loans',
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

// API routes
app.use('/api/loans', loanRoutes);

// Error handler
app.use((err: Error, req: Request, res: Response, _next: any) => {
  logger.error('Unhandled error', { error: err.message, path: req.path });
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
});

async function startServer(): Promise<void> {
  try {
    logger.info('Connecting to MongoDB...');

    await mongoose.connect(config.mongodbUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('Successfully connected to MongoDB');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    app.listen(config.port, '0.0.0.0', () => {
      logger.info(`Merchant Loans Service started on port ${config.port}`);
      logger.info(`Health: http://localhost:${config.port}/health`);
      logger.info(`API: http://localhost:${config.port}/api/loans`);
    });

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      await mongoose.connection.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      await mongoose.connection.close();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

startServer();

export default app;

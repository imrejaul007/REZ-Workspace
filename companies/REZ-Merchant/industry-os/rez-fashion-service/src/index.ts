import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import config from './config';
import logger from './utils/logger';
import { authenticateInternal } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rabtul } from './integrations/rabtul';

import productsRoutes from './routes/products.routes';
import collectionsRoutes from './routes/collections.routes';
import styleRoutes from './routes/style.routes';
import inventoryRoutes from './routes/inventory.routes';

const app: Application = express();

app.use(helmet());
app.use(cors({ origin: config.isProduction ? process.env.CORS_ORIGIN?.split(',') : '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.debug('Incoming request', { method: req.method, path: req.path });
  next();
});

const readLimiter = rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.maxRead, message: { success: false, error: 'Rate limit exceeded' } });
const writeLimiter = rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.maxWrite, message: { success: false, error: 'Rate limit exceeded' } });

app.use(authenticateInternal);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'rez-fashion-service', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const rabtulHealth = await rabtul.healthCheck();
  res.status(mongoStatus === 'connected' ? 200 : 503).json({
    status: mongoStatus === 'connected' ? 'ready' : 'not_ready',
    dependencies: { mongodb: mongoStatus, rabtul: rabtulHealth.connected ? 'connected' : 'not_configured' },
  });
});

app.use('/api/v1/products', readLimiter, writeLimiter, productsRoutes);
app.use('/api/v1/collections', readLimiter, writeLimiter, collectionsRoutes);
app.use('/api/v1/style', readLimiter, writeLimiter, styleRoutes);
app.use('/api/v1/inventory', readLimiter, writeLimiter, inventoryRoutes);

app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'ReZ Fashion Service', version: '1.0.0',
    endpoints: {
      health: ['GET /health', 'GET /health/ready'],
      products: ['GET/POST /api/v1/products', 'GET /api/v1/products/:productId', 'PUT/DELETE /api/v1/products/:productId'],
      collections: ['GET/POST /api/v1/collections', 'GET /api/v1/collections/:collectionId'],
      style: ['GET/POST /api/v1/style/profiles', 'GET /api/v1/style/recommendations/:customerId'],
      inventory: ['GET /api/v1/inventory', 'GET /api/v1/inventory/low-stock'],
    },
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

let server: ReturnType<Application['listen']>;
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down...`);
  server.close(async () => {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
};

const startServer = async () => {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(config.mongodb.uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000 });
    logger.info('MongoDB connected');

    server = app.listen(config.port, () => {
      logger.info(`ReZ Fashion Service started on port ${config.port}`);
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', { error: error instanceof Error ? error.message : 'Unknown' });
    process.exit(1);
  }
};

startServer();
export default app;
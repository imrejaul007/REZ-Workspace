/**
 * REZ Activity Service
 * Unified B2B Activity Tracking Service
 * Port: 4132
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { config } from './config/index.js';
import logger from './utils/logger.js';
import activityRoutes from './routes/activities.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.NODE_ENV === 'production' ? ['https://rez.commerce', 'https://*.rez.commerce'] : '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(rateLimit({ windowMs: config.RATE_LIMIT_WINDOW_MS, max: config.RATE_LIMIT_MAX_REQUESTS, standardHeaders: true, legacyHeaders: false, message: { success: false, error: 'Too many requests' } }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();
  _res.on('finish', () => logger.info('Request', { method: req.method, path: req.path, statusCode: _res.statusCode, duration: Date.now() - start }));
  next();
});

app.get('/health', async (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ success: true, service: 'rez-activity-service', version: '1.0.0', port: config.PORT, database: dbState });
});

app.use('/api/v1', (req: Request, res: Response, next: NextFunction) => {
  if (['/health', '/ready'].includes(req.path)) return next();
  const token = req.headers['x-internal-token'] as string;
  if (!token || !Object.values(config.SERVICE_TOKENS).includes(token)) {
    return res.status(401).json({ success: false, error: 'Invalid or missing internal token' });
  }
  next();
});

app.use('/api/v1/activities', activityRoutes);

app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({ success: true, service: 'REZ Activity Service', version: '1.0.0', description: 'Unified B2B Activity Tracking', endpoints: { activities: '/api/v1/activities' } });
});

app.use((_req: Request, res: Response) => res.status(404).json({ success: false, error: 'Endpoint not found' }));
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: config.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: (error as Error).message });
    throw error;
  }
}

async function start(): Promise<void> {
  try {
    await connectDatabase();
    app.listen(config.PORT, () => logger.info('REZ Activity Service started', { port: config.PORT, env: config.NODE_ENV }));
    process.on('SIGTERM', async () => { logger.info('SIGTERM received'); await mongoose.disconnect(); process.exit(0); });
    process.on('SIGINT', async () => { logger.info('SIGINT received'); await mongoose.disconnect(); process.exit(0); });
  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

start();
export { app };

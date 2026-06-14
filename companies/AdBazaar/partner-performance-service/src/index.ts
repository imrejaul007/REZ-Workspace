/**
 * Partner Performance Service
 * AdBazaar - Partner performance analytics and reporting
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import logger from 'utils/logger.js';
import { metricsMiddleware, metricsHandler } from './utils/metrics';
import performanceRoutes from './routes/performanceRoutes';
import reportRoutes from './routes/reportRoutes';
import metricRoutes from './routes/metricRoutes';

const app = express();
const PORT = parseInt(process.env.PORT || '5064', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/partner-performance';

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, error: 'Too many requests' },
});
app.use('/api/', limiter);
app.use(metricsMiddleware);

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'partner-performance-service',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.get('/metrics', metricsHandler);

app.use('/api/performance', performanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/metrics', metricRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });

    app.listen(PORT, () => {
      logger.info(`[${new Date().toISOString()}] Partner Performance Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

export default app;
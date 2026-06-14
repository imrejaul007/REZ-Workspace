import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import logger from 'utils/logger.js';
import { metricsMiddleware, register } from './utils/metrics.js';
import { authMiddleware } from './middleware/auth.js';

import { reportRoutes } from './routes/reportRoutes.js';
import { sourceRoutes } from './routes/sourceRoutes.js';
import { metricRoutes } from './routes/metricRoutes.js';
import { scheduleRoutes } from './routes/scheduleRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5088;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(metricsMiddleware);

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'cross-platform-reporting-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/sources', authMiddleware, sourceRoutes);
app.use('/api/metrics', authMiddleware, metricRoutes);
app.use('/api/schedules', authMiddleware, scheduleRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', { error: err instanceof Error ? err.message : String(err) });
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adbazaar-reporting';

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`Cross-platform Reporting Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

startServer();

export default app;
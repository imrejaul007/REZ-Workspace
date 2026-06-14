import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import logger from './utils/logger.js';
import { metricsMiddleware, register } from './utils/metrics.js';
import { authMiddleware } from './middleware/auth.js';

import { dashboardRoutes } from './routes/dashboardRoutes.js';
import { widgetRoutes } from './routes/widgetRoutes.js';
import { chartRoutes } from './routes/chartRoutes.js';
import { dataSourceRoutes } from './routes/dataSourceRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5091;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(metricsMiddleware);

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'bi-dashboard-service',
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

app.use('/api/dashboards', authMiddleware, dashboardRoutes);
app.use('/api/widgets', authMiddleware, widgetRoutes);
app.use('/api/charts', authMiddleware, chartRoutes);
app.use('/api/datasources', authMiddleware, dataSourceRoutes);

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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adbazaar-bi';

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`BI Dashboard Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

startServer();

export default app;
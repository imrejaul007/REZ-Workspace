import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { logger } from './utils/logger';
import { metricsMiddleware, metricsRoute } from './utils/metrics';
import { assetRoutes } from './routes/assetRoutes';
import { folderRoutes } from './routes/folderRoutes';
import { versionRoutes } from './routes/versionRoutes';

const app = express();
const PORT = process.env.PORT || 5071;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/digital-asset-management';

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(metricsMiddleware);

// Routes
app.use('/api/assets', assetRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/assets', versionRoutes);

// Metrics endpoint
app.get('/metrics', metricsRoute);

// Health check
app.get('/health', async (req, res) => {
  const healthcheck = {
    status: 'healthy',
    service: 'digital-asset-management-service',
    port: PORT,
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.json(healthcheck);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Digital Asset Management Service',
    version: '1.0.0',
    description: 'Centralized DAM for all creative assets',
    endpoints: {
      assets: '/api/assets',
      folders: '/api/folders',
      health: '/health',
      metrics: '/metrics'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', { error: err.message, stack: err.stack });
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    service: 'digital-asset-management-service'
  });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });

    app.listen(PORT, () => {
      logger.info(`Digital Asset Management Service started on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error });
    process.exit(1);
  }
};

startServer();

export default app;
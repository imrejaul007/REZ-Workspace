import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { logger } from 'utils/logger.js';
import { metricsMiddleware, metricsRoute } from './utils/metrics';
import { heatmapRoutes } from './routes/heatmapRoutes';

const app = express();
const PORT = process.env.PORT || 5075;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/content-heatmap';

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(metricsMiddleware);

// Routes
app.use('/api/heatmap', heatmapRoutes);

// Metrics endpoint
app.get('/metrics', metricsRoute);

// Health check
app.get('/health', async (req, res) => {
  const healthcheck = {
    status: 'healthy',
    service: 'content-heatmap-service',
    port: PORT,
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.json(healthcheck);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Content Heatmap Service',
    version: '1.0.0',
    description: 'Track content engagement metrics',
    endpoints: {
      heatmap: '/api/heatmap',
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
    service: 'content-heatmap-service'
  });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });

    app.listen(PORT, () => {
      logger.info(`Content Heatmap Service started on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error });
    process.exit(1);
  }
};

startServer();

export default app;
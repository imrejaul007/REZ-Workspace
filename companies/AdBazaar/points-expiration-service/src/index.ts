import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { expirationRoutes } from './routes';
import { metricsMiddleware, getMetrics } from './utils/metrics';
import { createServiceLogger } from './utils/logger';
import { expirationService } from './services';

const logger = createServiceLogger('PointsExpirationService');

const app = express();
const PORT = process.env.PORT || 5104;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

// Routes
app.use('/api/expiration', expirationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'points-expiration-service',
    port: PORT,
    uptime: process.uptime()
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.json(getMetrics());
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/points-expiration';

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });

    // Start cron job for processing expirations
    expirationService.startCronJob();

    app.listen(PORT, () => {
      logger.info(`Points Expiration Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  expirationService.stopCronJob();
  await mongoose.disconnect();
  process.exit(0);
});

startServer();

export default app;
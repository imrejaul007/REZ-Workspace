import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { tierRoutes } from './routes';
import { metricsMiddleware, getMetrics } from './utils/metrics';
import { createServiceLogger } from 'utils/logger.js';

const logger = createServiceLogger('TierManagementService');

const app = express();
const PORT = process.env.PORT || 5103;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

// Routes
app.use('/api/tiers', tierRoutes);

// Also mount tier routes at /api/members path
app.use('/api/members', tierRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'tier-management-service',
    port: PORT,
    uptime: process.uptime()
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.json(getMetrics());
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tier-management';

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });

    app.listen(PORT, () => {
      logger.info(`Tier Management Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await mongoose.disconnect();
  process.exit(0);
});

startServer();

export default app;
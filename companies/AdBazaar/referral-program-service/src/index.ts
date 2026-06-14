import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { referralRoutes } from './routes';
import { metricsMiddleware, getMetrics } from './utils/metrics';
import { createServiceLogger } from './utils/logger';

const logger = createServiceLogger('ReferralProgramService');

const app = express();
const PORT = process.env.PORT || 5105;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

app.use('/api/referrals', referralRoutes);
app.use('/api/rewards', referralRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'referral-program-service', port: PORT, uptime: process.uptime() });
});

app.get('/metrics', (req, res) => res.json(getMetrics()));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/referral-program';

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });
    app.listen(PORT, () => logger.info(`Referral Program Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully');
  await mongoose.disconnect();
  process.exit(0);
});

startServer();

export default app;
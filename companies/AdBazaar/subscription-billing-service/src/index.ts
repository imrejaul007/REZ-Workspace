import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { billingRoutes } from './routes';
import { metricsMiddleware, getMetrics } from './utils/metrics';
import { createServiceLogger } from './utils/logger';

const logger = createServiceLogger('SubscriptionBillingService');
const app = express();
const PORT = process.env.PORT || 5110;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

app.use('/api/billing', billingRoutes);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'subscription-billing-service', port: PORT, uptime: process.uptime() }));
app.get('/metrics', (req, res) => res.json(getMetrics()));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/subscription-billing';

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => logger.info(`Subscription Billing Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', async () => { await mongoose.disconnect(); process.exit(0); });
startServer();
export default app;
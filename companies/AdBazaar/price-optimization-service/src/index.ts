import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { pricingRoutes } from './routes';
import { metricsMiddleware, getMetrics } from './utils/metrics';
import { createServiceLogger } from './utils/logger';

const logger = createServiceLogger('PriceOptimizationService');
const app = express();
const PORT = process.env.PORT || 5109;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

app.use('/api/pricing', pricingRoutes);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'price-optimization-service', port: PORT, uptime: process.uptime() }));
app.get('/metrics', (req, res) => res.json(getMetrics()));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/price-optimization';

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => logger.info(`Price Optimization Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', async () => { await mongoose.disconnect(); process.exit(0); });
startServer();
export default app;
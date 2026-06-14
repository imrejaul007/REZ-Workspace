import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger } from 'utils/logger.js';
import { metricsMiddleware, metricsEndpoint } from './utils/metrics';
import { campaignRoutes } from './routes/campaignRoutes';
import { Campaign } from './models/Campaign';

const app: Express = express();
const PORT = process.env.PORT || 5066;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/influencer_campaign';

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: (message: string) => logger.info(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(metricsMiddleware);

// Routes
app.use('/api/campaigns', campaignRoutes);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'ok', service: 'influencer-campaign-service', port: PORT, mongodb: mongoStatus });
});

// Metrics endpoint
app.get('/metrics', metricsEndpoint);

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    await Campaign.createIndexes();
    logger.info('MongoDB indexes created');

    app.listen(PORT, () => {
      logger.info(`Influencer Campaign Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();

export default app;

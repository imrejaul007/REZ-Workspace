import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger } from 'utils/logger.js';
import { metricsMiddleware, metricsEndpoint } from './utils/metrics';
import { performanceRoutes } from './routes/performanceRoutes';
import { Performance } from './models/Performance';

const app: Express = express();
const PORT = process.env.PORT || 5069;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/influencer_performance';

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: (message: string) => logger.info(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(metricsMiddleware);

// Routes
app.use('/api/performance', performanceRoutes);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'ok', service: 'influencer-performance-service', port: PORT, mongodb: mongoStatus });
});

// Metrics endpoint
app.get('/metrics', metricsEndpoint);

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    await Performance.createIndexes();
    logger.info('MongoDB indexes created');

    app.listen(PORT, () => {
      logger.info(`Influencer Performance Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();

export default app;

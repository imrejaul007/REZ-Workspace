import { logger } from ;
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

import { config } from './config';
import routes from './routes';
import { errorHandler } from './middleware';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    timestamp: new Date().toISOString(),
  },
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'risa-corpperks-bridge',
    port: config.port,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', routes);
app.use(errorHandler);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString(),
  });
});

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodbUri);
    logger.info('[MongoDB] Connected to database');
  } catch (error) {
    logger.error('[MongoDB] Connection error:', error);
    process.exit(1);
  }
};

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(config.port, () => {
    logger.info(`[RisaCare-CorpPerks Bridge] Running on port ${config.port}`);
    logger.info(`[Health] http://localhost:${config.port}/health`);
    logger.info(`[API] http://localhost:${config.port}/api`);
  });
};

process.on('SIGTERM', async () => {
  logger.info('[Server] SIGTERM received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('[Server] SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

startServer().catch(console.error);

export default app;

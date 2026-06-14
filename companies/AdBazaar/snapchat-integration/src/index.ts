import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { logger } from 'utils/logger.js';
import { AppError } from './utils/errors.js';
import { metricsMiddleware } from './middleware/metrics.js';
import authRoutes from './routes/auth.routes.js';
import adAccountsRoutes from './routes/adAccounts.routes.js';
import campaignsRoutes from './routes/campaigns.routes.js';
import adsRoutes from './routes/ads.routes.js';
import audiencesRoutes from './routes/audiences.routes.js';
import pixelRoutes from './routes/pixel.routes.js';

dotenv.config();

const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(metricsMiddleware);

app.get('/health', async (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'snapchat-integration',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/ad-accounts', adAccountsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/audiences', audiencesRoutes);
app.use('/api/pixel', pixelRoutes);

app.get('/metrics', async (_req: Request, res: Response) => {
  const { register } = await import('prom-client');
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    logger.error('Application error', {
      statusCode: err.statusCode,
      message: err.message,
    });
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  } else {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    app.listen(config.port, () => {
      logger.info(`Snapchat Integration service running on port ${config.port}`, {
        environment: config.nodeEnv,
        port: config.port,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection', { reason: reason.message, stack: reason.stack });
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

startServer();

export default app;
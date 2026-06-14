import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { config } from './config';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/common';

dotenv.config();

const app: Express = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, data: { service: 'Merchant Referral Portal', version: '1.0.0', status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() } });
});

app.get('/ready', async (_req: Request, res: Response) => {
  const status = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  if (status === 'connected') res.json({ success: true, data: { status: 'ready' } });
  else res.status(503).json({ success: false, error: { code: 'SERVICE_NOT_READY' } });
});

app.use('/api', apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer(): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUri, { maxPoolSize: 10 });
    logger.info('Connected to MongoDB');

    app.listen(config.port, '0.0.0.0', () => {
      logger.info(`Merchant Referral Portal started on port ${config.port}`);
    });

    process.on('SIGTERM', async () => { await mongoose.connection.close(); process.exit(0); });
    process.on('SIGINT', async () => { await mongoose.connection.close(); process.exit(0); });
  } catch (error) {
    logger.error('Failed to start', { error: (error as Error).message });
    process.exit(1);
  }
}

startServer();
export default app;

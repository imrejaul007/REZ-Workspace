import 'dotenv/config';
import 'express-async-errors';
process.env.SERVICE_NAME = process.env.SERVICE_NAME || 'risna-broker-service';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import { connectMongoDB, disconnectMongoDB } from './config/mongodb';
import { redis } from './config/redis';
import { startHealthServer } from './health';
import brokerRoutes from './routes/broker.routes';
import { logger } from './config/logger';
import { errorResponse, errors } from './utils/response';

function validateEnv(): void {
  const required = ['MONGODB_URI', 'REDIS_URL', 'INTERNAL_SERVICE_TOKEN'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    logger.error(`[FATAL] Missing env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  validateEnv();
  logger.info('Starting risna-broker-service...');

  await connectMongoDB();

  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(compression());

  const rawOrigins = process.env.CORS_ORIGIN || 'https://risnaestate.com';
  const allowedOrigins = rawOrigins.split(',').map(s => s.trim()).filter(Boolean);
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(mongoSanitize());

  app.get('/health', (_req, res) => {
    const mongoOk = require('mongoose').connection.readyState === 1;
    res.status(mongoOk ? 200 : 503).json({ status: mongoOk ? 'ok' : 'unhealthy' });
  });

  app.use('/api/v1/brokers', brokerRoutes);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Error', { error: err.message });
    return errorResponse(res, errors.internalError());
  });

  const port = parseInt(process.env.PORT || '4104', 10);
  const healthPort = parseInt(process.env.HEALTH_PORT || '4204', 10);

  const server = app.listen(port, () => logger.info(`HTTP on :${port}`));
  const healthServer = startHealthServer(healthPort);

  const shutdown = async (signal: string) => {
    logger.info(`[SHUTDOWN] ${signal}`);
    server.close();
    healthServer.close();
    await redis.quit().catch(() => {});
    await disconnectMongoDB();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.info('risna-broker-service ready');
}

main().catch((err) => { logger.error('[FATAL]', err); process.exit(1); });

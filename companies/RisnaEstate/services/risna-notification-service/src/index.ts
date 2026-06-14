import 'dotenv/config';
import 'express-async-errors';
process.env.SERVICE_NAME = process.env.SERVICE_NAME || 'risna-notification-service';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import { connectMongoDB, disconnectMongoDB } from './config/mongodb';
import { redis } from './config/redis';
import notificationRoutes from './routes/notification.routes';
import { logger } from './config/logger';

async function main() {
  const required = ['MONGODB_URI', 'REDIS_URL', 'INTERNAL_SERVICE_TOKEN'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) { logger.error('[FATAL] Missing: ' + missing.join(', ')); process.exit(1); }

  logger.info('Starting notification service...');
  await connectMongoDB();

  const app = express();
  app.use(helmet());
  app.use(compression());
  const origins = (process.env.CORS_ORIGIN || '').split(',').filter(Boolean);
  app.use(cors({ origin: (origin, cb) => { if (!origin || origins.includes(origin)) return cb(null, true); cb(new Error('CORS')); }, credentials: true }));
  app.use(express.json());
  app.use(mongoSanitize());

  app.get('/health', (_req, res) => {
    const mongoOk = require('mongoose').connection.readyState === 1;
    res.status(mongoOk ? 200 : 503).json({ status: mongoOk ? 'ok' : 'unhealthy' });
  });

  app.use('/api/v1/notifications', notificationRoutes);

  const port = parseInt(process.env.PORT || '4108', 10);
  app.listen(port, () => logger.info('Notification service on :' + port));

  process.on('SIGTERM', async () => { await redis.quit(); await disconnectMongoDB(); process.exit(0); });
  process.on('SIGINT', async () => { await redis.quit(); await disconnectMongoDB(); process.exit(0); });
}

main().catch((err) => { logger.error('[FATAL]', err); process.exit(1); });

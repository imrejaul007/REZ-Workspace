import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import config from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler, asyncHandler } from './utils/errors';
import { authenticate } from './middleware/auth';
import routes from './routes';

const app: Express = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: config.cors.credentials }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  const start = Date.now();
  logger.info('Incoming request', { requestId: req.requestId, method: req.method, path: req.path });
  res.on('finish', () => {
    logger.info('Request completed', { requestId: req.requestId, duration: Date.now() - start, status: res.statusCode });
  });
  next();
});

app.use(rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
  standardHeaders: true, legacyHeaders: false
}));

// Apply auth middleware to all lounge routes
app.use('/api/v1/lounges', authenticate, routes);

app.get('/', (req: Request, res: Response) => {
  res.json({ service: 'Airzy Lounge Service', version: config.version, status: 'running', timestamp: Date.now() });
});

// Health checks
app.get('/health/live', (req: Request, res: Response) => {
  res.json({ status: 'alive', service: 'airzy-lounge-service', timestamp: new Date() });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
    }
    res.json({ status: 'ready', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
  } catch {
    res.status(503).json({ status: 'not_ready', mongodb: 'disconnected' });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
let server: ReturnType<typeof app.listen>;

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
      } catch (err) {
        logger.error('Error closing MongoDB', { error: err });
      }
      process.exit(0);
    });
  }
  setTimeout(() => { logger.error('Forced shutdown after timeout'); process.exit(1); }, 30000);
}

async function startServer() {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('MongoDB connected');

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    server = app.listen(config.server.port, config.server.host, () => {
      logger.info(`Airzy Lounge Service started on port ${config.server.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

process.on('uncaughtException', (err) => { logger.error('Uncaught exception', { error: err.message }); process.exit(1); });
process.on('unhandledRejection', (reason) => { logger.error('Unhandled rejection', { reason }); });

startServer();
export default app;

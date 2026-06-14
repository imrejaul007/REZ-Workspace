import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/index.js';
import { initDatabase, closeDatabase } from './models/index.js';
import { redisService } from './services/index.js';
import routes from './routes/index.js';
import { metricsMiddleware, errorHandler, notFoundHandler } from './middleware/index.js';

const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

app.use(metricsMiddleware);

app.use((req, _res, next) => {
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = `ssai-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
  next();
});

app.use('/api', routes);

app.get('/', (_req, res) => {
  res.json({
    service: 'SSAI Service',
    version: '1.0.0',
    description: 'Server-Side Ad Insertion for CTV Streaming',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer(): Promise<void> {
  try {
    logger.info('Starting SSAI Service...');

    await initDatabase(config.mongodb.uri);
    logger.info('MongoDB connected');

    await redisService.connect();
    logger.info('Redis connected');

    

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ssai-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
app.listen(config.port, () => {
      logger.info(`SSAI Service running on port ${config.port}`);
      logger.info(`Health check: http://localhost:${config.port}/api/health`);
      logger.info(`Metrics: http://localhost:${config.port}/api/health/metrics`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`\nReceived ${signal}. Shutting down gracefully...`);

  try {
    await closeDatabase();
    await redisService.disconnect();
    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});

if (config.nodeEnv !== 'test') {
  startServer();
}

export { app, startServer };

export default app;
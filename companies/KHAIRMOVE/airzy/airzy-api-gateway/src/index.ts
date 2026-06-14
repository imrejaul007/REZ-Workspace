import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import Redis from 'ioredis';

import config from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './utils/errors';
import { requestId, requestLogger } from './middleware/requestId';
import { authenticate } from './middleware/auth';
import routes from './routes';

const app: Express = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders
}));
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID and logging
app.use(requestId);
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// Authentication middleware - optional for gateway (upstream services validate)
app.use('/api', authenticate);

// Routes
app.use('/', routes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Airzy API Gateway',
    version: config.version,
    status: 'running',
    timestamp: Date.now(),
    endpoints: {
      health: '/health',
      routes: '/routes',
      metrics: '/metrics',
      circuitBreaker: '/circuit-breaker',
      cache: '/cache/stats'
    }
  });
});

// API documentation endpoint
app.get('/api/docs', (req: Request, res: Response) => {
  res.json({
    title: 'Airzy API Gateway',
    version: '1.0.0',
    description: 'Unified entry point for all Airzy travel services',
    services: [
      { name: 'flight', description: 'Flight search and booking', prefix: '/api/v1/flights' },
      { name: 'lounge', description: 'Airport lounge access', prefix: '/api/v1/lounges' },
      { name: 'itinerary', description: 'Trip planning and itinerary', prefix: '/api/v1/itineraries' },
      { name: 'wallet', description: 'Wallet and payments', prefix: '/api/v1/wallet' },
      { name: 'aiBrain', description: 'AI travel assistant', prefix: '/api/v1/ai' },
      { name: 'corp', description: 'Corporate travel management', prefix: '/api/v1/corporate' },
      { name: 'hotel', description: 'Hotel booking', prefix: '/api/v1/hotels' },
      { name: 'transfer', description: 'Airport transfers', prefix: '/api/v1/transfers' },
      { name: 'dooh', description: 'DOOH advertising', prefix: '/api/v1/dooh' }
    ]
  });
});

// Health checks
app.get('/health/live', (req: Request, res: Response) => {
  res.json({ status: 'alive', service: 'airzy-api-gateway', timestamp: new Date() });
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

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('MongoDB connected', { uri: config.mongodb.uri });
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
  }
}

// Redis connection
let redis: Redis;
function connectRedis(): void {
  redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    db: config.redis.db,
    keyPrefix: config.redis.keyPrefix,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('Redis connection failed, continuing without cache');
        return null;
      }
      return Math.min(times * 100, 3000);
    }
  });

  redis.on('connect', () => {
    logger.info('Redis connected');
  });

  redis.on('error', (err) => {
    logger.error('Redis error', { error: err.message });
  });
}

// Graceful shutdown
let server: ReturnType<typeof app.listen>;

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');

      // Close Redis
      try {
        if (redis) {
          await redis.quit();
          logger.info('Redis connection closed');
        }
      } catch (err) {
        logger.error('Error closing Redis', { error: err });
      }

      // Close database
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
      } catch (err) {
        logger.error('Error closing MongoDB', { error: err });
      }

      process.exit(0);
    });
  }

  // Force exit after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to databases
    await connectDatabase();
    connectRedis();

    // Setup graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Start listening
    server = app.listen(config.server.port, config.server.host, () => {
      logger.info(`Airzy API Gateway started`, {
        host: config.server.host,
        port: config.server.port,
        env: config.server.env,
        version: config.version
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
});

// Start the server
startServer();

export default app;

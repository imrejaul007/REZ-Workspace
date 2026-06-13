import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import Redis from 'ioredis';

import routes from './routes';
import { logger, logPerformanceMetric } from './utils/logger';
import { messageBroker } from './utils/message-broker';
import { corsMiddleware } from './middleware/cors';
import { rateLimiter, telemetryRateLimiter } from './middleware/rate-limiter';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

// ==================== CONFIGURATION ====================

const PORT = parseInt(process.env.SERVICE_PORT || '9041', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vehicle_twin';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// ==================== EXPRESS APP ====================

const app: Express = express();

// ==================== SECURITY ====================

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(corsMiddleware);

// ==================== BODY PARSING ====================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== RATE LIMITING ====================

app.use('/api/', rateLimiter);
app.use('/api/telemetry', telemetryRateLimiter);

// ==================== REQUEST LOGGING ====================

app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log incoming request
  logger.http(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    };

    if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.path} - ${res.statusCode}`, logData);
    } else {
      logger.http(`${req.method} ${req.path} - ${res.statusCode}`, logData);
    }

    // Track slow requests
    if (duration > 2000) {
      logPerformanceMetric(`${req.method} ${req.path}`, duration, {
        statusCode: res.statusCode
      });
    }
  });

  next();
});

// ==================== HEALTH CHECKS ====================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'vehicle-twin',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    let redisStatus = 'disconnected';

    try {
      if (redisClient && redisClient.status === 'ready') {
        redisStatus = 'connected';
      }
    } catch {
      redisStatus = 'error';
    }

    const rabbitStatus = messageBroker.isConnected() ? 'connected' : 'disconnected';

    const isReady = mongoStatus === 'connected';

    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ready' : 'not_ready',
      checks: {
        mongodb: mongoStatus,
        redis: redisStatus,
        rabbitmq: rabbitStatus
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/health/live', (req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

// ==================== API ROUTES ====================

app.use('/api', routes);

// ==================== ERROR HANDLING ====================

app.use(notFoundHandler);
app.use(errorHandler);

// ==================== REDIS CLIENT ====================

let redisClient: Redis | null = null;

try {
  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError(err: Error) {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    }
  });

  redisClient.on('connect', () => {
    logger.info('Connected to Redis');
  });

  redisClient.on('error', (err: Error) => {
    logger.error('Redis connection error:', { error: err.message });
  });

  redisClient.on('ready', () => {
    logger.info('Redis client ready');
  });
} catch (error) {
  logger.warn('Redis initialization failed, continuing without cache:', {
    error: error instanceof Error ? error.message : 'Unknown error'
  });
}

// ==================== DATABASE CONNECTION ====================

const connectDB = async (): Promise<void> => {
  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };

    await mongoose.connect(MONGODB_URI, options);

    logger.info('Connected to MongoDB', {
      host: mongoose.connection.host,
      database: mongoose.connection.name
    });

    mongoose.connection.on('error', (err: Error) => {
      logger.error('MongoDB connection error:', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    setTimeout(connectDB, 5000);
  }
};

// ==================== MESSAGE BROKER CONNECTION ====================

const connectMessageBroker = async (): Promise<void> => {
  try {
    await messageBroker.connect();
  } catch (error) {
    logger.warn('Failed to connect to RabbitMQ, will retry in background', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ==================== GRACEFUL SHUTDOWN ====================

let server: ReturnType<Express['listen']>;

const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    if (redisClient && redisClient.quit) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Error closing Redis:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  try {
    await messageBroker.close();
    logger.info('RabbitMQ connection closed');
  } catch (error) {
    logger.error('Error closing RabbitMQ:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ==================== UNHANDLED REJECTIONS ====================

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection:', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined
  });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// ==================== SERVER START ====================

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    await connectMessageBroker();

    server = app.listen(PORT, () => {
      logger.info(`Vehicle Twin Service started`, {
        port: PORT,
        nodeEnv: process.env.NODE_ENV || 'development',
        pid: process.pid
      });

      console.log(`
╔═══════════════════════════════════════════════════════════╗
║              VEHICLE TWIN SERVICE                         ║
║              Transport OS - RTMN                         ║
╠═══════════════════════════════════════════════════════════╣
║  Port:     ${String(PORT).padEnd(47)}║
║  Status:   RUNNING                                     ║
║  Health:   http://localhost:${PORT}/health                ║
║  API:      http://localhost:${PORT}/api                   ║
║  Ready:    http://localhost:${PORT}/health/ready          ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    process.exit(1);
  }
};

startServer();

export { app, redisClient };

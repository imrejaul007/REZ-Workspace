import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import posRoutes from './routes/pos.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Initialize Express application
const app: Application = express();

// Define port
const PORT = parseInt(process.env.PORT || '4081', 10);

// ================================================
// REDIS CLIENT SETUP
// ================================================
export const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true,
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', { error: err.message });
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

// ================================================
// MONGODB CONNECTION
// ================================================
const connectMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-pos-service';
    await mongoose.connect(mongoUri);
    logger.info('MongoDB Connected Successfully', { uri: mongoUri.replace(/\/\/.*@/, '//***@') });
  } catch (error) {
    logger.error('MongoDB Connection Failed:', { error: (error as Error).message });
  }
};

// ================================================
// HELMET SECURITY
// ================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
}));

// ================================================
// CORS CONFIGURATION (No Wildcard)
// ================================================
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4081',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl requests)
    if (!origin) return callback(null, true);

    // In production, strict origin check
    if (process.env.NODE_ENV === 'production') {
      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }

    // In development, allow localhost
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-Rate-Limit-Remaining', 'X-Rate-Limit-Reset'],
  credentials: true,
  maxAge: 86400,
}));

// ================================================
// RATE LIMITING
// ================================================
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: 60,
  },
  skip: (req) => req.path === '/health' || req.path === '/health/live' || req.path === '/healthz',
});

app.use(globalLimiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 900,
  },
});

// ================================================
// SANITIZATION
// ================================================
app.use(mongoSanitize({
  onSanitize: ({ key }) => {
    logger.warn('Attempted MongoDB sanitization on key:', { key });
  },
}));

// ================================================
// BODY PARSING
// ================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ================================================
// REQUEST ID MIDDLEWARE
// ================================================
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  res.setHeader('X-Request-ID', requestId);
  (req as any).requestId = requestId;
  next();
});

// ================================================
// REQUEST LOGGING
// ================================================
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId: (req as any).requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });
  next();
});

// ================================================
// SECURITY HEADERS
// ================================================
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// ================================================
// API Routes
// ================================================
app.use('/api/pos', posRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'ReZ POS Service',
    version: '1.0.0',
    description: 'Restaurant Point of Sale Service',
    endpoints: {
      health: '/api/pos/health',
      orders: '/api/pos/orders',
      menu: '/api/pos/menu',
      stats: '/api/pos/stats',
      revenue: '/api/pos/revenue'
    }
  });
});

// ================================================
// HEALTH CHECK ENDPOINTS
// ================================================

// Basic health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-pos-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// Kubernetes liveness probe
app.get('/health/live', (req: Request, res: Response) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

// Kubernetes readiness probe with dependency checks
app.get('/health/ready', async (req: Request, res: Response) => {
  const checks: Record<string, any> = {
    mongodb: { status: 'unknown' },
    redis: { status: 'unknown' },
  };

  let allHealthy = true;

  // Check MongoDB
  try {
    const mongoStatus = mongoose.connection.readyState;
    if (mongoStatus === 1) {
      checks.mongodb = { status: 'connected' };
    } else {
      checks.mongodb = { status: 'disconnected' };
      allHealthy = false;
    }
  } catch (error) {
    checks.mongodb = { status: 'error', error: (error as Error).message };
    allHealthy = false;
  }

  // Check Redis
  try {
    const redisStatus = redisClient.status;
    if (redisStatus === 'ready') {
      await redisClient.ping();
      checks.redis = { status: 'connected' };
    } else {
      checks.redis = { status: 'not ready', state: redisStatus };
      allHealthy = false;
    }
  } catch (error) {
    checks.redis = { status: 'error', error: (error as Error).message };
    allHealthy = false;
  }

  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
  });
});

// Kubernetes healthz
app.get('/healthz', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Detailed health check
app.get('/health/detailed', async (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();

  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    service: 'rez-pos-service',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    metrics: {
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      },
    },
    checks: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redisClient.status === 'ready' ? 'connected' : redisClient.status,
    },
  };

  res.json(healthData);
});

// ================================================
// ERROR HANDLING
// ================================================
app.use(notFoundHandler);
app.use(errorHandler);

// ================================================
// START SERVER
// ================================================
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Connect to Redis
    await redisClient.connect().catch((err) => {
      logger.warn('Redis connection failed, continuing without cache:', { error: err.message });
    });

    app.listen(PORT, () => {
      logger.info('='.repeat(50));
      logger.info('POS Service started successfully');
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API base URL: http://localhost:${PORT}/api/pos`);
      logger.info('='.repeat(50));
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: (error as Error).message });
    process.exit(1);
  }
};

// ================================================
// GRACEFUL SHUTDOWN
// ================================================
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  // Close Redis connection
  redisClient.quit().then(() => {
    logger.info('Redis connection closed');
  }).catch((err) => {
    logger.error('Error closing Redis connection:', { error: err.message });
  });

  // Close MongoDB connection
  mongoose.connection.close().then(() => {
    logger.info('MongoDB connection closed');
    process.exit(0);
  }).catch((err) => {
    logger.error('Error closing MongoDB connection:', { error: err.message });
    process.exit(1);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
});

startServer();

export default app;
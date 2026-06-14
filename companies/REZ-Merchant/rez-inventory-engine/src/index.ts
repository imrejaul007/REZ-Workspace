import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import winston from 'winston';
import Redis from 'ioredis';
import { skuRoutes, stockRoutes, barcodeRoutes, alertRoutes, transferRoutes, expiryRoutes } from './routes';

// Load environment variables
dotenv.config();

// ================================================
// Winston Logger Configuration
// ================================================
const createLogger = () => {
  const logLevel = process.env.LOG_LEVEL || 'info';
  const isProduction = process.env.NODE_ENV === 'production';

  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );

  const simpleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} [${level}]: ${message} ${metaStr}`;
    })
  );

  return winston.createLogger({
    level: logLevel,
    defaultMeta: {
      service: 'rez-inventory-engine',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
    transports: [
      new winston.transports.Console({
        level: logLevel,
        format: isProduction ? logFormat : simpleFormat,
        handleExceptions: true,
      }),
    ],
    exitOnError: false,
  });
};

const logger = createLogger();

// ================================================
// Redis Client Setup
// ================================================
let redisClient: Redis | null = null;

const initRedis = () => {
  if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    redisClient.connect().catch((err) => {
      logger.warn('Redis connection failed, caching disabled', { error: err.message });
    });
  }
  return redisClient;
};

// Cache helper functions
export const cacheGet = async (key: string): Promise<string | null> => {
  if (!redisClient) return null;
  try {
    return await redisClient.get(`rez:inventory:${key}`);
  } catch (error) {
    logger.warn('Redis get failed', { key, error: (error as Error).message });
    return null;
  }
};

export const cacheSet = async (key: string, value: string, ttlSeconds: number = 300): Promise<void> => {
  if (!redisClient) return;
  try {
    await redisClient.setex(`rez:inventory:${key}`, ttlSeconds, value);
  } catch (error) {
    logger.warn('Redis set failed', { key, error: (error as Error).message });
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  if (!redisClient) return;
  try {
    await redisClient.del(`rez:inventory:${key}`);
  } catch (error) {
    logger.warn('Redis del failed', { key, error: (error as Error).message });
  }
};

const app = express();
const PORT = process.env.PORT || 4010;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_inventory';

// ================================================
// Security Middleware
// ================================================

// Helmet security headers
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

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV === 'production') {
      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }
    if (origin.includes('localhost')) {
      return callback(null, true);
    }
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  credentials: true,
  maxAge: 86400,
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: 60,
  },
  skip: (req) => req.path === '/health' || req.path === '/health/live',
});

app.use(limiter);

// MongoDB sanitization
app.use(mongoSanitize({
  onSanitize: ({ key }) => {
    logger.warn('Attempted sanitization of key', { key });
  },
}));

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  res.setHeader('X-Request-ID', requestId);
  (req as any).requestId = requestId;
  next();
});

// Trust proxy for rate limiting behind load balancer
app.set('trust proxy', 1);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = (req as any).requestId;

  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
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
// Health Check Endpoints
// ================================================

// Basic health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'rez-inventory-engine',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Liveness probe
app.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe with database check
app.get('/health/ready', async (_req: Request, res: Response) => {
  const checks: any = {
    mongodb: { status: 'unknown' },
    redis: { status: 'unknown' },
  };

  let allHealthy = true;

  // Check MongoDB
  try {
    const start = Date.now();
    const mongoStatus = mongoose.connection.readyState;
    const latency = Date.now() - start;

    if (mongoStatus === 1) {
      checks.mongodb = { status: 'connected', latency };
    } else {
      checks.mongodb = { status: 'disconnected', error: 'MongoDB not connected' };
      allHealthy = false;
    }
  } catch (error) {
    checks.mongodb = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    allHealthy = false;
  }

  // Check Redis
  try {
    if (redisClient) {
      const start = Date.now();
      await redisClient.ping();
      const latency = Date.now() - start;
      checks.redis = { status: 'connected', latency };
    } else {
      checks.redis = { status: 'not_configured' };
    }
  } catch (error) {
    checks.redis = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Redis not available',
    };
  }

  const status = allHealthy ? 'healthy' : 'unhealthy';
  const statusCode = allHealthy ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    checks,
  });
});

// Kubernetes compatibility
app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

// API info endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'ReZ Inventory Engine API',
    version: '1.0.0',
    description: 'Retail inventory management system with SKU, stock, barcode, and alert management',
    endpoints: {
      sku: {
        'POST /api/sku': 'Create a new SKU',
        'GET /api/sku': 'Search and filter SKUs',
        'GET /api/sku/:id': 'Get SKU by ID',
        'GET /api/sku/code/:code': 'Get SKU by SKU code',
        'PUT /api/sku/:id': 'Update a SKU',
        'DELETE /api/sku/:id': 'Delete a SKU (soft delete)',
        'GET /api/sku/:id/with-stock': 'Get SKU with stock info',
        'GET /api/sku/store/:storeId': 'Get all SKUs in a store',
        'GET /api/sku/stats/:merchantId': 'Get SKU statistics',
        'POST /api/sku/bulk': 'Bulk create SKUs',
        'POST /api/sku/generate-barcode': 'Generate a unique barcode',
      },
      stock: {
        'POST /api/stock/add': 'Add stock to a SKU',
        'POST /api/stock/deduct': 'Deduct stock from a SKU',
        'POST /api/stock/reserve': 'Reserve stock for an order',
        'POST /api/stock/release': 'Release reserved stock',
        'GET /api/stock/:skuId': 'Get stock level for a SKU',
        'GET /api/stock/:skuId/batches': 'Get stock with batch info',
        'GET /api/stock/store/:storeId/levels': 'Get all stock levels in a store',
        'POST /api/stock/transfer': 'Transfer stock between stores',
        'GET /api/stock/alerts/low-stock': 'Get low stock items',
        'POST /api/stock/adjust': 'Adjust stock (inventory correction)',
      },
      barcode: {
        'GET /api/barcode/:barcode': 'Lookup a barcode',
        'POST /api/barcode/generate': 'Generate a unique barcode',
        'POST /api/barcode/validate': 'Validate barcode format',
        'POST /api/barcode/exists': 'Check if barcode exists',
        'POST /api/barcode/bulk-lookup': 'Bulk lookup barcodes',
        'GET /api/barcode/stats': 'Get barcode statistics',
        'GET /api/barcode/search/:partialCode': 'Find SKU by partial barcode',
      },
      alerts: {
        'GET /api/alerts': 'Get complete alert summary',
        'GET /api/alerts/low-stock': 'Get low stock alerts',
        'GET /api/alerts/expiry': 'Get expiry alerts',
        'GET /api/alerts/by-category': 'Get alerts by category',
        'POST /api/alerts/check/:skuId': 'Check if SKU is low on stock',
        'POST /api/alerts/refresh': 'Refresh alert statuses',
        'GET /api/alerts/forecast/:skuId': 'Get stock forecast',
        'POST /api/alerts/schedule-expiry': 'Schedule expiry alerts',
      },
      transfers: {
        'POST /api/transfers': 'Create a new transfer request',
        'GET /api/transfers': 'Get transfers with filters',
        'GET /api/transfers/pending': 'Get pending transfers for a store',
        'GET /api/transfers/:id': 'Get transfer by ID',
        'PUT /api/transfers/:id/approve': 'Approve a transfer',
        'PUT /api/transfers/:id/dispatch': 'Dispatch a transfer',
        'PUT /api/transfers/:id/receive': 'Receive a transfer',
        'PUT /api/transfers/:id/cancel': 'Cancel a transfer',
        'PUT /api/transfers/:id/items': 'Update transfer items',
      },
      expiry: {
        'GET /api/expiry/expiring': 'Get items expiring soon',
        'GET /api/expiry/expired': 'Get expired items',
        'POST /api/expiry/cleanup': 'Mark expired items as unavailable',
        'POST /api/expiry/alerts': 'Send expiry alerts',
        'GET /api/expiry/summary': 'Get expiry summary for a store',
        'POST /api/expiry/update-statuses': 'Update expiry statuses',
      },
    },
  });
});

// Routes
app.use('/api/sku', skuRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/barcode', barcodeRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/expiry', expiryRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const isProduction = process.env.NODE_ENV === 'production';

  logger.error('Request error', {
    name: err.name,
    message: err.message,
    stack: isProduction ? undefined : err.stack,
    path: req.path,
    method: req.method,
    requestId: (req as any).requestId,
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: isProduction ? undefined : err.message,
  });
});

// Database connection
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });
  } catch (error) {
    logger.error('MongoDB connection error', { error: (error as Error).message });
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }
    await mongoose.connection.close(false);
    logger.info('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: (error as Error).message });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async (): Promise<void> => {
  await connectDB();
  initRedis();

  app.listen(PORT, () => {
    logger.info(`ReZ Inventory Engine API Server started`, {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    });
  });
};

startServer().catch((error) => {
  logger.error('Failed to start server', { error: error.message });
  process.exit(1);
});

export { app, logger, redisClient };

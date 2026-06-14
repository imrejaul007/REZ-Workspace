/**
 * REZ Merchant CorpPerks Bridge Service
 *
 * Connects CorpPerks HR platform with REZ Merchant
 * Enables corporate discounts, expense tracking, and employee benefits
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import employeeRoutes from './routes/employeeRoutes';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3005;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// CORS configuration - CRITICAL FIX: Never allow '*' in production
const corsOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [];

if (IS_PRODUCTION && corsOrigins.length === 0) {
  logger.error('[FATAL] CORS_ORIGIN must be set in production');
  process.exit(1);
}

// Rate limiting configuration
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: { success: false, error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: IS_PRODUCTION ? corsOrigins : (corsOrigins.length > 0 ? corsOrigins : ['http://localhost:3000', 'http://localhost:8080']),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(generalLimiter);

// Request logging middleware (use structured logger in production)
const logRequest = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Structured log format for log aggregation
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };
    // Use JSON logging in production
    if (IS_PRODUCTION) {
      console.log(JSON.stringify(logEntry));
    } else {
      logger.info(`[${logEntry.timestamp}] ${logEntry.method} ${logEntry.path} - ${logEntry.status} (${logEntry.duration})`);
    }
  });
  next();
};
app.use(logRequest);

// Health check (no auth required)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'REZ Merchant CorpPerks Bridge',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Apply auth limiter to API routes
app.use('/api/v1', authLimiter, employeeRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'REZ Merchant CorpPerks Bridge',
    version: '1.0.0',
    description: 'Corporate employee integration service',
    endpoints: {
      health: '/health',
      api: '/api/v1'
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler - CRITICAL FIX: Don't expose internal errors
// FIX (security): Replaced Math.random() with crypto.randomUUID()
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const errorId = (() => {
    try {
      const { randomUUID } = require('crypto');
      return `err-${Date.now()}-${randomUUID().replace(/-/g, '').substring(0, 9)}`;
    } catch {
      return `err-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
  })();

  // Log full error internally
  console.error(JSON.stringify({
    errorId,
    message: err.message,
    stack: IS_PRODUCTION ? undefined : err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  }));

  // Return sanitized error to client
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    errorId, // Client can reference this for support
    ...(IS_PRODUCTION ? {} : { message: err.message }) // Only show message in dev
  });
});

// Start server
async function start() {
  try {
    logger.info(`[Startup] Starting CorpPerks Bridge Service on port ${PORT}`);
    logger.info(`[Startup] Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`[Startup] CORS origins: ${corsOrigins.length > 0 ? corsOrigins.join(', ') : 'development defaults'}`);

    app.listen(PORT, () => {
      logger.info(`[Startup] CorpPerks Bridge running on port ${PORT}`);
      logger.info(`[Startup] Health: http://localhost:${PORT}/health`);
      logger.info(`[Startup] API: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('[Startup] Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

start();

export default app;

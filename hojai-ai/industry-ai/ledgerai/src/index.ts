/**
 * LEDGERAI - Accounting AI Operating System
 * Production-Ready Server with MongoDB, JWT, Security & Graceful Shutdown
 *
 * ExpertOS Integration: Individual CA Features
 * - Expert Profile (CA credentials, specializations)
 * - Client Management (Business client relationships)
 * - Reviews & Ratings
 * - AI Suggestions
 * - Appointment Scheduling
 * - Marketplace Listing
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import config from './config';
import logger from './middleware/logger';
import {
  helmetMiddleware,
  corsMiddleware,
  noSniffMiddleware,
  cacheControlMiddleware,
  removePoweredByMiddleware,
  requestSizeLimitMiddleware
} from './middleware/security';
import { apiLimiter } from './middleware/rateLimiter';
import { registerExpertOS } from '../../../hojai-expert-os/src/expertOS-integration';

// Routes
import authRoutes from './routes/auth';
import accountRoutes from './routes/accounts';
import transactionRoutes from './routes/transactions';
import invoiceRoutes from './routes/invoices';
import budgetRoutes from './routes/budgets';
import analyticsRoutes from './routes/analytics';
import aiRoutes from './routes/ai';
import healthRoutes from './routes/health';

// ============================================
// CREATE EXPRESS APP
// ============================================

const app: Express = express();

// ============================================
// TRUST PROXY (for rate limiting behind reverse proxy)
// ============================================
app.set('trust proxy', 1);

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(noSniffMiddleware);
app.use(cacheControlMiddleware);
app.use(removePoweredByMiddleware);
app.use(requestSizeLimitMiddleware);

// Rate limiting
app.use(apiLimiter);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    logger.log(logLevel, `${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });

  next();
});

// ============================================
// API ROUTES
// ============================================

// Health routes (no auth required)
app.use('/', healthRoutes);

// Auth routes
app.use('/api/auth', authRoutes);

// Account routes
app.use('/api/accounts', accountRoutes);

// Transaction routes
app.use('/api/transactions', transactionRoutes);

// Invoice routes
app.use('/api/invoices', invoiceRoutes);

// Budget routes
app.use('/api/budgets', budgetRoutes);

// Analytics routes
app.use('/api/analytics', analyticsRoutes);

// AI routes
app.use('/api/ai', aiRoutes);

// ============================================
// EXPERTOS INTEGRATION - Individual CA Features
// ============================================

/**
 * ExpertOS Routes for LedgerAI:
 * - /api/ledgerai/expert/profile - CA profile
 * - /api/ledgerai/expert/clients - Business client relationships
 * - /api/ledgerai/expert/appointments - Booking
 * - /api/ledgerai/expert/reviews - Ratings
 * - /api/ledgerai/expert/suggestions - AI recommendations
 * - /api/ledgerai/marketplace - Client discovery
 */
const expertOSRouter = registerExpertOS('ledgerai');
app.use(expertOSRouter);

// ============================================
// ROOT ENDPOINT
// ============================================
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    name: 'LEDGERAI - Accounting AI Operating System',
    version: '1.0.0',
    description: 'AI-powered accounting and financial management',
    endpoints: {
      health: '/health',
      api: '/api',
      ai: '/api/ai',
      docs: '/api/health'
    },
    features: {
      aiEmployees: ['AI Accountant', 'CFO Agent', 'Invoice Agent'],
      capabilities: [
        'Transaction categorization & reconciliation',
        'Financial analysis & forecasting',
        'Invoice management & reminders',
        'Budget tracking & analysis',
        'Dashboard analytics'
      ]
    }
  });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.path,
    method: req.method
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Don't expose internal errors in production
  const message = config.nodeEnv === 'production'
    ? 'An internal server error occurred'
    : err.message;

  res.status(500).json({
    success: false,
    error: message,
    code: 'INTERNAL_ERROR'
  });
});

// ============================================
// DATABASE CONNECTION
// ============================================

async function connectToDatabase(): Promise<void> {
  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(config.mongodb.uri, options);

    logger.info('Connected to MongoDB', {
      host: config.mongodb.uri.split('@')[1] || 'localhost'
    });

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

let server: ReturnType<typeof app.listen> | null = null;
let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress');
    return;
  }

  isShuttingDown = true;
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Set a timeout to force exit if graceful shutdown takes too long
  const forceExitTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 30000);

  try {
    // Stop accepting new connections
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed');
      });
    }

    // Close database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    }

    // Clear timeout and exit
    clearTimeout(forceExitTimeout);

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', { reason, promise });
});

// ============================================
// START SERVER
// ============================================

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectToDatabase();

    // Start HTTP server
    server = app.listen(config.port, () => {
      logger.info('LEDGERAI Server started', {
        port: config.port,
        environment: config.nodeEnv,
        nodeVersion: process.version,
        pid: process.pid
      });
      logger.info('ExpertOS enabled - Individual CA features available');

      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ██████╗ ███████╗███╗   ███╗                                 ║
║     ██╔══██╗██╔════╝████╗ ████║  LEDGERAI v1.0.0               ║
║     ██████╔╝███████╗██╔████╔██║  Accounting AI Operating      ║
║     ██╔═══╝ ╚════██║██║╚██╔╝██║  System                       ║
║     ██║     ███████║██║ ╚═╝ ██║                               ║
║     ╚═╝     ╚══════╝╚═╝     ╚═╝                               ║
║                                                               ║
║     Port: ${config.port}                                               ║
║     Env:  ${config.nodeEnv.padEnd(48)}║
║     PID:  ${process.pid.toString().padEnd(48)}║
║                                                               ║
║     AI Agents:                                                 ║
║     ├─ AI Accountant (categorization, reconciliation)          ║
║     ├─ CFO Agent (analysis, forecasting)                      ║
║     └─ Invoice Agent (management, reminders)                  ║
║                                                               ║
║     Features:                                                  ║
║     ├─ MongoDB Database                                        ║
║     ├─ JWT Authentication                                      ║
║     ├─ Rate Limiting                                           ║
║     ├─ Helmet Security                                         ║
║     ├─ Winston Logging                                         ║
║     ├─ Zod Validation                                         ║
║     └─ Graceful Shutdown                                       ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
        process.exit(1);
      }
      throw error;
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
import { logger } from '../../shared/logger';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import types and errors
import { AppError, ErrorResponse } from './types';

// Import routes
import profileRoutes from './routes/profileRoutes';
import syncRoutes from './routes/syncRoutes';

// Import services (for initialization)
import './services/profileSyncService';

// ============================================
// Configuration
// ============================================

const PORT = parseInt(process.env.PORT || '4723', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/corpid-profile-bridge';

// ============================================
// Express App
// ============================================

const app = express();

// ============================================
// Security Middleware
// ============================================

// Helmet for security headers
app.use(helmet());

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ============================================
// Body Parsing
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// Request Logging
// ============================================

app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  logger.info(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// Health Check
// ============================================

app.get('/health', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';

  res.json({
    status: 'ok',
    service: 'corpid-profile-bridge',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// ============================================
// API Routes
// ============================================

// Profile routes
app.use('/api/profile', profileRoutes);

// Sync routes
app.use('/api/sync', syncRoutes);

// ============================================
// Root Route
// ============================================

app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'CorpID-RABTUL Profile Bridge',
    version: '1.0.0',
    description: 'Connects CorpID (CI Score, verification, trust) with RABTUL Profile service',
    endpoints: {
      health: 'GET /health',
      profile: {
        getCorpId: 'GET /api/profile/:id/corpid',
        getCIScore: 'GET /api/profile/:id/ci-score',
        getCIScoreBreakdown: 'GET /api/profile/:id/ci-score/breakdown',
        getVerification: 'GET /api/profile/:id/verification',
        getTrustReport: 'GET /api/profile/:id/trust-report',
        getSummary: 'GET /api/profile/:id/summary',
      },
      sync: {
        syncProfileToCorpId: 'POST /api/sync/profile-to-corpid',
        updateCorpId: 'PUT /api/sync/profile-to-corpid/:profileId',
        fullSync: 'POST /api/sync/full-sync/:profileId',
        verifyProfile: 'POST /api/sync/profile/:id/verify',
        addDocument: 'POST /api/sync/profile/:id/verify/document',
        getCorporateEmployees: 'GET /api/sync/corporate/:corporateId/employees',
        getEmployeeCorpIds: 'GET /api/sync/employee/:employeeId/corpids',
        getLeaderboard: 'GET /api/sync/corporate/:corporateId/leaderboard',
        getDistribution: 'GET /api/sync/corporate/:corporateId/distribution',
      },
    },
    documentation: {
      authentication: 'JWT Bearer token or X-Internal-Token header',
      roles: ['employee', 'manager', 'hr', 'admin'],
    },
  });
});

// ============================================
// 404 Handler
// ============================================

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  } as ErrorResponse);
});

// ============================================
// Global Error Handler
// ============================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('[ERROR]', err);

  // Handle AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    } as ErrorResponse);
    return;
  }

  // Handle mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
      },
    } as ErrorResponse);
    return;
  }

  // Handle mongoose duplicate key errors
  if (err.name === 'MongoServerError' && (err as unknown as { code: number }).code === 11000) {
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: 'A record with this key already exists',
      },
    } as ErrorResponse);
    return;
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
      },
    } as ErrorResponse);
    return;
  }

  // Handle CORS errors
  if (err.message?.includes('CORS')) {
    res.status(403).json({
      success: false,
      error: {
        code: 'CORS_FORBIDDEN',
        message: err.message,
      },
    } as ErrorResponse);
    return;
  }

  // Default error response
  const statusCode = (err as unknown as { statusCode?: number }).statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
  } as ErrorResponse);
});

// ============================================
// Database Connection
// ============================================

async function connectToDatabase(): Promise<void> {
  try {
    logger.info(`[MongoDB] Connecting to ${MONGODB_URI}...`);

    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('[MongoDB] Connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('[MongoDB] Connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('[MongoDB] Disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('[MongoDB] Reconnected');
    });
  } catch (error) {
    logger.error('[MongoDB] Failed to connect:', error);
    throw error;
  }
}

// ============================================
// Graceful Shutdown
// ============================================

async function shutdown(signal: string): Promise<void> {
  logger.info(`\n[${signal}] Shutting down gracefully...`);

  try {
    await mongoose.connection.close();
    logger.info('[MongoDB] Connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('[Shutdown] Error:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ============================================
// Start Server
// ============================================

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectToDatabase();

    // Start listening
    app.listen(PORT, () => {
      logger.info(`
╔════════════════════════════════════════════════════════════╗
║         CorpID-RABTUL Profile Bridge Started             ║
╠════════════════════════════════════════════════════════════╣
║  Port:      ${PORT.toString().padEnd(46)}║
║  MongoDB:   ${MONGODB_URI.substring(0, 46).padEnd(46)}║
║  Node Env:  ${(process.env.NODE_ENV || 'development').padEnd(46)}║
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                              ║
║  - GET  /health                                          ║
║  - GET  /api/profile/:id/corpid                          ║
║  - GET  /api/profile/:id/ci-score                        ║
║  - GET  /api/profile/:id/ci-score/breakdown              ║
║  - GET  /api/profile/:id/verification                    ║
║  - GET  /api/profile/:id/trust-report                    ║
║  - POST /api/sync/profile-to-corpid                      ║
║  - POST /api/sync/full-sync/:profileId                   ║
║  - POST /api/sync/profile/:id/verify                     ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

startServer();

export default app;

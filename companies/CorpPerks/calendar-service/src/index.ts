import { logger } from '../../shared/logger';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { calendarRoutes } from './routes';

// Load environment variables
dotenv.config();

// Types
interface ApiError extends Error {
  statusCode?: number;
  details?: unknown;
}

// Configuration
const PORT = process.env.PORT || 4736;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/calendar-service';
const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001',
];

// Initialize Express
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: CORS_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-Company-Id', 'X-Internal-Token'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'calendar-service',
      port: PORT,
      environment: NODE_ENV,
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    },
  });
});

// Readiness check
app.get('/ready', async (_req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1;

  if (!mongoStatus) {
    return res.status(503).json({
      success: false,
      error: 'Service not ready',
      details: {
        mongodb: 'disconnected',
      },
    });
  }

  res.json({
    success: true,
    data: {
      status: 'ready',
      mongodb: 'connected',
    },
  });
});

// API Routes
app.use('/api/calendar', calendarRoutes);

// Root endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      service: 'calendar-service',
      version: '1.0.0',
      description: 'Calendar Sync Service for CorpPerks PeopleOS',
      endpoints: {
        calendar: '/api/calendar',
        auth: '/api/calendar/auth',
        events: '/api/calendar/events',
        sync: '/api/calendar/sync',
        health: '/health',
        ready: '/ready',
      },
    },
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Global error handler
app.use((err: ApiError, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', err);

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.details || err.message,
    });
  }

  // MongoDB duplicate key error
  if (err.name === 'MongoServerError' && (err as unknown as { code: number }).code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
    });
  }

  // Custom API errors
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Database connection
async function connectToDatabase(): Promise<void> {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`\n${signal} received. Shutting down gracefully...`);

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
async function startServer(): Promise<void> {
  await connectToDatabase();

  app.listen(PORT, () => {
    logger.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   Calendar Service Started Successfully                    ║
║                                                            ║
║   Port: ${PORT.toString().padEnd(47)}║
║   Env:  ${NODE_ENV.padEnd(47)}║
║                                                            ║
║   Endpoints:                                               ║
║   - Health: http://localhost:${PORT}/health                   ║
║   - API:    http://localhost:${PORT}/api                     ║
║   - Calendar: http://localhost:${PORT}/api/calendar           ║
║   - Auth:   http://localhost:${PORT}/api/calendar/auth        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default app;

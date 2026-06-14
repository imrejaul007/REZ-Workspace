import express, { Express, Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import coursesRouter from './routes/courses.routes';
import batchesRouter from './routes/batches.routes';
import studentsRouter from './routes/students.routes';
import attendanceRouter from './routes/attendance.routes';
import { authenticateToken } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app: Express = express();
const isProduction = process.env.NODE_ENV === 'production';

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [];

if (isProduction && corsOrigins.length === 0) {
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
  origin: isProduction ? corsOrigins : (corsOrigins.length > 0 ? corsOrigins : ['http://localhost:3000']),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(generalLimiter);

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-education-service',
    timestamp: new Date().toISOString()
  });
});

// Readiness check (checks database connection)
app.get('/ready', async (_req: Request, res: Response) => {
  try {
    const dbState = mongoose.connection.readyState;
    if (dbState === 1) {
      res.json({
        status: 'ready',
        service: 'rez-education-service',
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        service: 'rez-education-service',
        database: dbState === 0 ? 'disconnected' : 'connecting',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      service: 'rez-education-service',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes with authentication
app.use('/api/courses', coursesRouter);
app.use('/api/batches', batchesRouter);
app.use('/api/students', studentsRouter);
app.use('/api/attendance', attendanceRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Database connection and server start
const PORT = process.env.PORT || 4054;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-education';

async function startServer() {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB successfully');

    app.listen(PORT, () => {
      logger.info(`Education Service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API endpoints:`);
      logger.info(`  - POST /api/courses - Create course`);
      logger.info(`  - GET /api/courses - Search courses`);
      logger.info(`  - POST /api/batches - Create batch`);
      logger.info(`  - POST /api/batches/:id/enroll - Enroll student`);
      logger.info(`  - POST /api/students - Create student`);
      logger.info(`  - GET /api/students/:id/attendance - Get attendance`);
      logger.info(`  - POST /api/attendance - Mark attendance`);
      logger.info(`  - GET /api/attendance/report/:batchId - Attendance report`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

startServer();

export default app;
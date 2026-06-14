/**
 * Restaurant Staff Scheduling Service
 * Manages shifts, attendance, and payroll
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import cron from 'node-cron';
import dotenv from 'dotenv';

import { logger } from './config/logger';
import { employeeRoutes } from './routes/employee.routes';
import { shiftRoutes } from './routes/shift.routes';
import { scheduleRoutes } from './routes/schedule.routes';
import { attendanceRoutes } from './routes/attendance.routes';
import { payrollRoutes } from './routes/payroll.routes';
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4019;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [];

if (IS_PRODUCTION && corsOrigins.length === 0) {
  logger.error('[FATAL] CORS_ORIGIN must be set in production');
  process.exit(1);
}

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many authentication attempts' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: IS_PRODUCTION ? corsOrigins : (corsOrigins.length > 0 ? corsOrigins : ['http://localhost:3000']),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(generalLimiter);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// Health check (no auth)
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-restaurant-scheduling-service',
    timestamp: new Date().toISOString(),
  });
});

// Routes with authentication
app.use('/api/employees', authLimiter, authenticateToken, employeeRoutes);
app.use('/api/shifts', authLimiter, authenticateToken, shiftRoutes);
app.use('/api/schedules', authLimiter, authenticateToken, scheduleRoutes);
app.use('/api/attendance', authLimiter, authenticateToken, attendanceRoutes);
app.use('/api/payroll', authLimiter, authenticateToken, payrollRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Error handler
app.use(errorHandler);

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/scheduling';

// Cron jobs for attendance processing
function setupCronJobs() {
  // Process attendance at midnight daily
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running daily attendance processing');
    // Process attendance records, calculate overtime, etc.
  });

  // Generate payroll report on 1st of each month
  cron.schedule('0 0 1 * *', async () => {
    logger.info('Generating monthly payroll report');
    // Generate payroll reports
  });

  // Send shift reminders at 6 PM daily
  cron.schedule('0 18 * * *', async () => {
    logger.info('Sending shift reminders');
    // Send notifications for next day's shifts
  });

  logger.info('Cron jobs scheduled');
}

// Start server
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    setupCronJobs();

    app.listen(PORT, () => {
      logger.info(`Scheduling service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('[FATAL] Unhandled Rejection:', reason);
  process.exit(1);
});

start();

export default app;

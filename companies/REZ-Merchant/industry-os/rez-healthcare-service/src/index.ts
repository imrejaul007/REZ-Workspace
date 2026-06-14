import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { config } from './config';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';

import patientsRouter from './routes/patients.routes';
import appointmentsRouter from './routes/appointments.routes';
import prescriptionsRouter from './routes/prescriptions.routes';
import telemedicineRouter from './routes/telemedicine.routes';

import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { TelemedicineService } from './services/TelemedicineService';

const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.nodeEnv === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',')
    : '*',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request processed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// Rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-healthcare-service',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/patients', patientsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/prescriptions', prescriptionsRouter);
app.use('/api/telemedicine', telemedicineRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Telemedicine session cleanup interval
let telemedicineCleanupInterval: NodeJS.Timeout | undefined;
const telemedicineService = new TelemedicineService();

async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Connect to Redis
    await connectRedis();

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`Healthcare service started`, {
        port: config.port,
        nodeEnv: config.nodeEnv,
      });
    });

    // Cleanup expired telemedicine sessions every hour
    telemedicineCleanupInterval = setInterval(() => {
      telemedicineService.cleanupExpiredSessions();
    }, 60 * 60 * 1000);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      clearInterval(telemedicineCleanupInterval);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await disconnectDatabase();
          await disconnectRedis();
          logger.info('All connections closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error });
          process.exit(1);
        }
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();

export default app;

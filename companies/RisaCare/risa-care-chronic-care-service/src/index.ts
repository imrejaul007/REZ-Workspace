import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import chronicRoutes from './routes/chronicRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { connectDatabase, disconnectDatabase } from './utils/database';
import schedulerService from './services/schedulerService';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4720;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later.'
    }
  }
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query
  });
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-chronic-care',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1', chronicRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'RisaCare Chronic Care Management Service',
    version: '1.0.0',
    port: PORT,
    endpoints: {
      health: 'GET /health',
      conditions: 'POST/GET /api/v1/conditions',
      conditionDetails: 'GET/PUT/DELETE /api/v1/conditions/details/:conditionId',
      readings: 'POST/GET /api/v1/conditions/:conditionId/readings',
      trends: 'GET /api/v1/conditions/:conditionId/trends',
      protocol: 'POST/GET /api/v1/conditions/:conditionId/protocol',
      recommendations: 'GET /api/v1/conditions/:conditionId/recommendations',
      alerts: 'GET /api/v1/alerts/:patientId',
      acknowledgeAlert: 'PUT /api/v1/alerts/:alertId/acknowledge',
      reports: 'GET /api/v1/reports/:patientId/:conditionId',
      overview: 'GET /api/v1/reports/:patientId/overview',
      controlScore: 'GET /api/v1/control-score/:patientId'
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received, shutting down gracefully...`);

  // Stop accepting new requests
  server.close(async () => {
    logger.info('HTTP server closed');

    // Stop scheduler
    schedulerService.stop();

    // Disconnect from database
    await disconnectDatabase();

    logger.info('Shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Start server
let server: ReturnType<typeof app.listen>;

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize scheduler
    schedulerService.init();

    // Start listening
    server = app.listen(PORT, () => {
      logger.info(`RisaCare Chronic Care Service started`, {
        port: PORT,
        nodeEnv: process.env.NODE_ENV || 'development'
      });
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

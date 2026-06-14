import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';

import config from './config';
import complianceRoutes from './routes/compliance';
import { errorHandler, notFoundHandler, requestLogger, logger } from './middleware/errorHandler';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create Express app
const app: Application = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Request-ID'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: {
      type: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check endpoint (before routes)
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'bizora-compliance-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    if (mongoStatus !== 'connected') {
      return res.status(503).json({
        status: 'not_ready',
        checks: {
          mongodb: mongoStatus,
        },
      });
    }

    res.json({
      status: 'ready',
      checks: {
        mongodb: mongoStatus,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      error: 'Health check failed',
    });
  }
});

// API routes
app.use(`${config.api.prefix}/compliance`, complianceRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// MongoDB connection
const connectDB = async (): Promise<void> => {
  try {
    logger.info('Connecting to MongoDB...', { uri: config.mongodb.uri });

    await mongoose.connect(config.mongodb.uri, config.mongodb.options);

    logger.info('MongoDB connected successfully');

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
    logger.error('Failed to connect to MongoDB', { error: (error as Error).message });
    // Don't exit in development - allow retry
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received, shutting down gracefully...`);

  try {
    await mongoose.connection.close();
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
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    app.listen(config.port, () => {
      logger.info(`BIZORA Compliance Service started`, {
        port: config.port,
        env: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
      });

      logger.info(
╔═══════════════════════════════════════════════════════════════╗
║           BIZORA COMPLIANCE SERVICE ║
║           Business Compliance Checking Service              ║
╠═══════════════════════════════════════════════════════════════╣
║  Status:     RUNNING                                        ║
║  Port:       ${String(config.port).padEnd(46)}║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(44)}║
╠═══════════════════════════════════════════════════════════════╣
║  Endpoints: ║
║  GET  /health - Health check                     ║
║  GET  /health/ready     - Readiness check                   ║
║  GET  /api/compliance/status  - Compliance status           ║
║  POST /api/compliance/check - Run compliance check        ║
║  GET  /api/compliance/reports - List reports                ║
║  POST /api/compliance/gst    - GST compliance check         ║
║  POST /api/compliance/tds    - TDS compliance check ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
};

// Export app for testing
export { app };

// Start if run directly
if (require.main === module) {
  startServer();
}
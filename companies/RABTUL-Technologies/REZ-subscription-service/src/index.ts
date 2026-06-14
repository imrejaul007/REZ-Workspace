import express, { Application } from 'express';
import { tracingMiddleware } from './middleware/tracing';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Import utilities
import { logger, connectDatabase } from './utils';

// Import services
import { billingEngine, subscriptionManager } from './services';
import { Plan } from './models';

// Import routes
import apiRoutes from './routes';

// Import middleware
import { requestLogger, errorHandler } from './middleware';

const app: Application = express();
const PORT = process.env.PORT || 4022;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
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
      frameSrc: ["'none'"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || 'https://rez.money').split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
  credentials: true,
  maxAge: 86400
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.'
  }
});

app.use('/api/', limiter);

// Request logging
app.use(requestLogger);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Mount API routes
app.use('/api/v1', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'REZ Subscription Service',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/v1'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use(errorHandler);

// Graceful shutdown handler
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // Stop billing cron jobs
    billingEngine.stop();

    // Close database connection
    const { disconnectDatabase } = await import('./utils/database');
    await disconnectDatabase();

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to database
    logger.info('Connecting to database...');
    await connectDatabase();

    // Seed default plans
    try {
      await Plan.seedDefaultPlans();
      logger.info('Default plans seeded successfully');
    } catch (error) {
      logger.warn('Failed to seed default plans (may already exist)', { error });
    }

    // Start billing engine
    billingEngine.start();
    logger.info('Billing engine started');

    // Start HTTP server
    

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-subscription-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
app.listen(PORT, () => {
      logger.info(`REZ Subscription Service started`, {
        port: PORT,
        nodeEnv: process.env.NODE_ENV || 'development',
        url: `http://localhost:${PORT}`
      });

      logger.info('Available endpoints:', {
        health: `http://localhost:${PORT}/api/v1/health`,
        subscriptions: `http://localhost:${PORT}/api/v1/subscriptions`,
        usage: `http://localhost:${PORT}/api/v1/usage`,
        invoices: `http://localhost:${PORT}/api/v1/invoices`,
        plans: `http://localhost:${PORT}/api/v1/plans`,
        analytics: `http://localhost:${PORT}/api/v1/analytics`,
        webhooks: `http://localhost:${PORT}/api/v1/webhooks`
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;

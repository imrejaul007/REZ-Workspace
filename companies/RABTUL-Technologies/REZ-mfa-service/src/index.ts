import express, { Express, Request, Response } from 'express';
import { tracingMiddleware } from './middleware/tracing';
import helmet from 'helmet';
import cors from 'cors';
import config from './config';
import { logger, connectDatabase, disconnectDatabase } from './utils';
import { mfaRouter } from './routes';
import {
  generalRateLimiter,
  requestMetadata,
  errorHandler,
  notFoundHandler,
} from './middleware';

const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://rez.money').split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Admin-Token', 'X-Forwarded-For', 'X-City', 'X-Country'],
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request metadata
app.use(requestMetadata);

// Global rate limiting
app.use(generalRateLimiter);

// Trust proxy (for rate limiting behind load balancer)
app.set('trust proxy', 1);

// Routes
app.use('/api/v1/mfa', mfaRouter);

// Root health check
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'rez-mfa-service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    await disconnectDatabase();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error during shutdown', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
});

// Start server
async function start(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Start HTTP server
    const server = 

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-mfa-service',
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
app.listen(config.port, () => {
      logger.info(`REZ MFA Service started`, {
        port: config.port,
        nodeEnv: config.nodeEnv,
        pid: process.pid,
      });
    });

    // Server error handling
    server.on('error', (error) => {
      logger.error('Server error', {
        error: error.message,
      });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

// Start the application
start();

export default app;

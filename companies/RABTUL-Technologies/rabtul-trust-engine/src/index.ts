import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import trustRoutes from './routes/trust.routes';
import logger from './utils/logger';

const app: Application = express();

// Trust the proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'rabtul-trust-engine',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    const mongoState = mongoose.connection.readyState;
    const isConnected = mongoState === 1;

    if (!isConnected) {
      return res.status(503).json({
        status: 'not ready',
        mongodb: 'disconnected',
      });
    }

    res.json({
      status: 'ready',
      mongodb: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: 'Health check failed',
    });
  }
});

app.get('/health/live', (_req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', trustRoutes);

// Metrics endpoint
app.get('/metrics', (_req: Request, res: Response) => {
  res.json({
    service: 'rabtul-trust-engine',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Database connection
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  logger.info('Shutting down gracefully...');
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(config.port, () => {
    logger.info(`rabtul-trust-engine running on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Health check: http://localhost:${config.port}/health`);
    logger.info(`API endpoints: http://localhost:${config.port}/api`);
  });
};

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default app;

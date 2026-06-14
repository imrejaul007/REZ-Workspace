import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from 'redis';
import { rateLimit } from 'express-rate-limit';
import notesRoutes from './routes/notes';
import { validateEnvironment } from './config/environment';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';
import { MetricsCollector } from './services/metricsCollector';
import { NotificationService } from './services/notificationService';

// Environment validation
validateEnvironment();

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(logger);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'REZ-meeting-notes-service',
    version: '1.0.0',
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: redisClient.isReady ? 'connected' : 'disconnected'
  };
  res.json(health);
});

// Readiness check
app.get('/ready', async (req: Request, res: Response) => {
  const ready =
    mongoose.connection.readyState === 1 &&
    redisClient.isReady;

  res.status(ready ? 200 : 503).json({
    ready,
    checks: {
      mongodb: mongoose.connection.readyState === 1,
      redis: redisClient.isReady
    }
  });
});

// Metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  const metrics = MetricsCollector.getMetrics();
  res.json(metrics);
});

// API Routes
app.use('/api/v1/notes', notesRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(errorHandler);

// Initialize services
let redisClient: ReturnType<typeof createClient>;
let notificationService: NotificationService;

async function initializeServices(): Promise<void> {
  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_meeting_notes';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  // Connect to Redis
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  redisClient.on('error', (err) => console.error('Redis error:', err));
  await redisClient.connect();
  console.log('Connected to Redis');

  // Initialize notification service
  notificationService = new NotificationService();
}

// Graceful shutdown
async function shutdown(): Promise<void> {
  console.log('Shutting down...');

  try {
    await mongoose.connection.close();
    await redisClient.quit();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const PORT = parseInt(process.env.PORT || '4133');

async function startServer(): Promise<void> {
  try {
    await initializeServices();

    app.listen(PORT, () => {
      logger.info(REZ Meeting Notes Service running on port ${PORT}`);
      logger.info(Health check: http://localhost:${PORT}/health`);
      logger.info(Metrics: http://localhost:${PORT}/metrics`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app };

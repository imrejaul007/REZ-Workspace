import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Routes
import matchRoutes from './routes/matchRoutes';
import fingerprintRoutes from './routes/fingerprintRoutes';
import graphRoutes from './routes/graphRoutes';

// Utils
import { logger } from './utils/logger';
import { initializeMetrics } from './utils/metrics';

// Models
import './models/ProbMatch';
import './models/Fingerprint';
import './models/MatchGraph';
import './models/MatchStats';

// Environment
const PORT = process.env.PORT || 4998;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/probabilistic_matching';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Express app
const app: Express = express();

// Winston logger setup
const log = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Metrics
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 1]
});

const activeMatches = new Gauge({
  name: 'active_matches_total',
  help: 'Total number of active matches'
});

const matchAccuracy = new Gauge({
  name: 'match_accuracy_score',
  help: 'Current match accuracy score'
});

// Redis client
let redisClient: ReturnType<typeof createClient>;

// Connect to MongoDB
async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI);
    log.info('Connected to MongoDB', { uri: MONGO_URI });
  } catch (error) {
    log.error('MongoDB connection failed', { error });
    throw error;
  }
}

// Connect to Redis
async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => log.error('Redis error', { error: err }));
    await redisClient.connect();
    log.info('Connected to Redis', { url: REDIS_URL });
  } catch (error) {
    log.error('Redis connection failed', { error });
    throw error;
  }
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = uuidv4();

  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestsTotal.inc({ method: req.method, route: req.route?.path || req.path, status: res.statusCode });
    httpRequestDuration.observe({ method: req.method, route: req.route?.path || req.path, status: res.statusCode }, duration / 1000);

    log.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  req.headers['x-request-id'] = requestId;
  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'probabilistic-matching',
    version: '1.0.0',
    uptime: process.uptime(),
    checks: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redisClient?.isReady ? 'connected' : 'disconnected'
    }
  };

  try {
    // Check MongoDB
    await mongoose.connection.db?.admin().ping();

    // Check Redis
    if (redisClient?.isReady) {
      await redisClient.ping();
    }

    res.status(200).json(health);
  } catch (error) {
    health.status = 'unhealthy';
    res.status(503).json(health);
  }
});

// Metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// API routes
app.use('/api/match', matchRoutes);
app.use('/api/match/fingerprint', fingerprintRoutes);
app.use('/api/match/graph', graphRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  log.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
async function shutdown(): Promise<void> {
  log.info('Shutting down gracefully...');

  try {
    await mongoose.connection.close();
    log.info('MongoDB connection closed');

    if (redisClient) {
      await redisClient.quit();
      log.info('Redis connection closed');
    }

    process.exit(0);
  } catch (error) {
    log.error('Error during shutdown', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start(): Promise<void> {
  try {
    // Initialize metrics
    initializeMetrics();
    collectDefaultMetrics({ prefix: 'probabilistic_matching_' });

    // Connect to databases
    await connectMongoDB();
    await connectRedis();

    // Start HTTP server
    app.listen(PORT, () => {
      log.info(`Probabilistic Matching Service started`, {
        port: PORT,
        mongoUri: MONGO_URI,
        redisUrl: REDIS_URL
      });
    });
  } catch (error) {
    log.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Export for testing
export { app, redisClient, log };

// Start if running directly
if (require.main === module) {
  start();
}

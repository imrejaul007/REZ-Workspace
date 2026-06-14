/**
 * REZ Deal Intelligence Service
 *
 * CRM Pipeline Intelligence with AI Insights
 * Port: 4131
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { config } from './config/index.js';
import logger from './utils/logger.js';
import dealRoutes from './routes/deals.js';

// ============================================================================
// Express App
// ============================================================================

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.NODE_ENV === 'production'
    ? ['https://rez.commerce', 'https://*.rez.commerce']
    : '*',
  credentials: true,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests' },
});
app.use(limiter);

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();
  _res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: _res.statusCode,
      duration,
    });
  });
  next();
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', async (_req: Request, res: Response) => {
  try {
    const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
      success: true,
      service: 'rez-deal-intelligence',
      version: '1.0.0',
      port: config.PORT,
      database: dbState,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Health check failed',
    });
  }
});

// ============================================================================
// Internal Service Auth
// ============================================================================

app.use('/api/v1', (req: Request, res: Response, next: NextFunction) => {
  if (['/health', '/ready'].includes(req.path)) return next();

  const token = req.headers['x-internal-token'] as string;
  const validTokens = Object.values(config.SERVICE_TOKENS);

  if (!token || !validTokens.includes(token)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing internal token',
    });
  }

  next();
});

// ============================================================================
// API Routes
// ============================================================================

app.use('/api/v1/deals', dealRoutes);

// API info
app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'REZ Deal Intelligence',
    version: '1.0.0',
    description: 'CRM Pipeline Intelligence with AI Insights',
    endpoints: {
      deals: '/api/v1/deals',
    },
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });

  res.status(500).json({
    success: false,
    error: config.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ============================================================================
// Database Connection
// ============================================================================

async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: config.MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: (error as Error).message });
    throw error;
  }
}

// ============================================================================
// Start Server
// ============================================================================

async function start(): Promise<void> {
  try {
    await connectDatabase();

    app.listen(config.PORT, () => {
      logger.info('REZ Deal Intelligence started', {
        port: config.PORT,
        env: config.NODE_ENV,
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down...');
      await mongoose.disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down...');
      await mongoose.disconnect();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

start();

export { app };

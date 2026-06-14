import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import postsRoutes from './routes/posts.routes';
import adsRoutes from './routes/ads.routes';
import analyticsRoutes from './routes/analytics.routes';
import leadsRoutes from './routes/leads.routes';
import organizationsRoutes from './routes/organizations.routes';

const app: Express = express();
const PORT = process.env.PORT || 4790;

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Security middleware
app.use(helmet());

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy violation: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Request-ID'],
}));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use tenant ID + IP for rate limiting if available
    const tenantId = req.headers['x-tenant-id'] as string;
    return tenantId ? `${tenantId}-${req.ip}` : req.ip || 'unknown';
  },
});

// Apply rate limiting to API routes
app.use('/api', globalLimiter);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  const start = Date.now();

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';

    logger[logLevel](`${req.method} ${req.path}`, {
      requestId,
      status: res.statusCode,
      duration: `${duration}ms`,
      tenantId: req.headers['x-tenant-id'] || 'unknown',
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  });

  next();
});

// Health check endpoint (unlimited)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-linkedin-ads',
    version: '1.1.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Liveness probe for Kubernetes
app.get('/health/live', (req: Request, res: Response) => {
  res.json({ status: 'alive' });
});

// Readiness probe for Kubernetes
app.get('/health/ready', (req: Request, res: Response) => {
  // Could add dependency checks here (database, etc.)
  res.json({ status: 'ready' });
});

// API routes
app.use('/auth', authRoutes);
app.use('/posts', postsRoutes);
app.use('/ads', adsRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/leads', leadsRoutes);
app.use('/organizations', organizationsRoutes);

// API documentation endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    service: 'REZ LinkedIn Ads Service',
    version: '1.1.0',
    description: 'LinkedIn Marketing API integration service for ReZ platform',
    documentation: 'https://docs.linkedin.com/ads/',
    endpoints: {
      health: {
        'GET /health': 'Service health check',
        'GET /health/live': 'Liveness probe',
        'GET /health/ready': 'Readiness probe',
      },
      auth: {
        'GET /auth/url': 'Generate OAuth authorization URL',
        'GET /auth/callback': 'OAuth callback handler',
        'POST /auth/token': 'Set access token directly',
        'POST /auth/refresh': 'Refresh access token',
        'DELETE /auth/disconnect': 'Disconnect LinkedIn integration',
        'GET /auth/status': 'Check connection status',
      },
      posts: {
        'POST /posts': 'Create post on personal profile',
        'POST /posts/organization/:id': 'Create post on organization page',
        'POST /posts/image': 'Upload image for posts',
        'GET /posts/:id': 'Get post by ID',
        'DELETE /posts/:id': 'Delete post',
      },
      ads: {
        'GET /ads/accounts': 'Get advertising accounts',
        'POST /ads/campaigns': 'Create advertising campaign',
        'GET /ads/campaigns': 'List campaigns (requires accountId)',
        'GET /ads/campaigns/:id': 'Get campaign by ID',
        'PATCH /ads/campaigns/:id': 'Update campaign',
        'DELETE /ads/campaigns/:id': 'Archive campaign',
        'POST /ads/creatives': 'Create sponsored creative',
        'GET /ads/creatives/:id': 'Get creative by ID',
      },
      analytics: {
        'POST /analytics/campaigns': 'Get campaign analytics',
      },
      leads: {
        'POST /leads/forms': 'Create lead generation form',
        'GET /leads/forms/:id': 'Get lead form by ID',
        'GET /leads/forms/:id/leads': 'Get leads from form',
      },
      organizations: {
        'GET /organizations': 'List accessible organizations',
        'GET /organizations/:id': 'Get organization details',
      },
    },
    headers: {
      required: ['X-Tenant-ID'],
      optional: ['X-Request-ID'],
    },
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'REZ LinkedIn Ads Service',
    version: '1.1.0',
    description: 'LinkedIn Marketing API integration service',
    documentation: 'GET /api',
    health: 'GET /health',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || uuidv4(),
    },
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log the error
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    tenantId: req.headers['x-tenant-id'],
    requestId: req.headers['x-request-id'],
  });

  // Handle CORS errors
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CORS_ERROR',
        message: 'Cross-origin request blocked',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || uuidv4(),
      },
    });
  }

  // Generic error response
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal server error occurred',
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || uuidv4(),
    },
  });
});

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close((err) => {
    if (err) {
      logger.error('Error during shutdown', { error: err });
      process.exit(1);
    }
    logger.info('Server shut down gracefully');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Start server
const server = app.listen(PORT, () => {
  logger.info(`REZ LinkedIn Ads Service started`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
  });
  logger.info(LinkedIn Ads Service running on port ${PORT}`);
  logger.info(API documentation available at http://localhost:${PORT}/api`);
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

export default app;

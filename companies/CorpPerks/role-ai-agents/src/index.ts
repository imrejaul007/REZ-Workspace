// ============================================================================
// Role AI Agents - Main Application Entry Point
// ============================================================================

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import config from './config';
import { connectDatabase } from './models';
import { roleRoutes } from './routes';
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
  securityHeaders,
  internalServiceAuth,
  requestId,
} from './middleware';
import logger from './utils/logger';

// ============================================================================
// Create Express Application
// ============================================================================

const app: Application = express();

// ============================================================================
// Basic Middleware
// ============================================================================

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security headers
app.use(securityHeaders);

// CORS
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Request-ID'],
  })
);

// Helmet
app.use(helmet());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID
app.use(requestId);

// Request logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    },
    timestamp: new Date(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter rate limiting for chat endpoints
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many chat requests, please slow down',
    },
    timestamp: new Date(),
  },
});
app.use('/api/roles/chat', chatLimiter);

// ============================================================================
// Internal Service Authentication
// ============================================================================

app.use('/api', internalServiceAuth);

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'role-ai-agents',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', async (_req, res) => {
  try {
    const { getConnectionStatus } = await import('./models');
    const dbConnected = getConnectionStatus();

    if (!dbConnected) {
      res.status(503).json({
        status: 'not ready',
        service: 'role-ai-agents',
        checks: {
          database: 'disconnected',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      status: 'ready',
      service: 'role-ai-agents',
      checks: {
        database: 'connected',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      service: 'role-ai-agents',
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================================
// API Routes
// ============================================================================

app.use('/api/roles', roleRoutes);

// ============================================================================
// API Documentation
// ============================================================================

app.get('/api', (_req, res) => {
  res.json({
    name: 'Role AI Agents API',
    version: '1.0.0',
    description: 'AI Agents for 10 job roles with 4 levels each',
    endpoints: [
      {
        method: 'GET',
        path: '/api/roles',
        description: 'List all available job roles',
      },
      {
        method: 'GET',
        path: '/api/roles/:role',
        description: 'Get information about a specific role',
      },
      {
        method: 'GET',
        path: '/api/roles/:role/levels',
        description: 'Get all levels for a role (L1-L4)',
      },
      {
        method: 'GET',
        path: '/api/roles/:role/levels/:level',
        description: 'Get specific role level details',
      },
      {
        method: 'POST',
        path: '/api/roles/chat',
        description: 'Chat with a role agent',
      },
      {
        method: 'POST',
        path: '/api/roles/chat/:sessionId',
        description: 'Continue an existing chat session',
      },
      {
        method: 'POST',
        path: '/api/roles/recommend',
        description: 'Get role recommendations based on profile',
      },
      {
        method: 'GET',
        path: '/api/roles/sessions/:sessionId',
        description: 'Get chat session details',
      },
    ],
    roles: [
      'software-engineer',
      'sales',
      'marketing',
      'finance',
      'hr',
      'operations',
      'product',
      'design',
      'support',
      'admin',
    ],
    levels: ['L1', 'L2', 'L3', 'L4'],
    documentation: {
      L1: 'Entry Level (0-2 years experience)',
      L2: 'Mid Level (2-5 years experience)',
      L3: 'Senior Level (5-8 years experience)',
      L4: 'Lead Level (8+ years experience)',
    },
  });
});

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// ============================================================================
// Start Server
// ============================================================================

async function startServer(): Promise<void> {
  try {
    // Connect to database
    logger.info('Connecting to database...');
    await connectDatabase();

    // Start listening
    const { port, nodeEnv } = config;
    app.listen(port, () => {
      logger.info(`Role AI Agents service started`, {
        port,
        environment: nodeEnv,
        url: `http://localhost:${port}`,
        endpoints: {
          health: `http://localhost:${port}/health`,
          ready: `http://localhost:${port}/ready`,
          api: `http://localhost:${port}/api`,
          docs: `http://localhost:${port}/api`,
        },
      });

      logger.info('Available roles:', {
        roles: [
          'software-engineer',
          'sales',
          'marketing',
          'finance',
          'hr',
          'operations',
          'product',
          'design',
          'support',
          'admin',
        ],
      });

      logger.info('Ready to accept requests');
    });
  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

export default app;

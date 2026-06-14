/**
 * StayOwn AI Front Desk Service - Refactored
 * Port: 3800 - Hotel AI receptionist for guest interactions
 *
 * Architecture: Modular with services, routes, models, middleware
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { connectDatabase, getConnectionStatus } from './config/database';
import { logger } from './config/logger';
import { errorHandler } from './validators';
import { apiKeyAuth, requestLogger } from './middleware/auth';
import { sanitizeBody, trustProxy } from './middleware/security';
import routes from './routes';

// Create Express app
const app: Express = express();

// Trust proxy for correct IP detection
app.use(trustProxy);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
}));

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Internal-Token'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Sanitize request body
app.use(sanitizeBody);

// Request logging
app.use(requestLogger);

// Health check endpoint (no auth required)
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'ai-front-desk',
    version: '3.0.0',
    database: getConnectionStatus() ? 'MongoDB' : 'in-memory',
    timestamp: new Date().toISOString(),
  });
});

// Ready check
app.get('/ready', (_req: Request, res: Response) => {
  const isReady = getConnectionStatus();
  res.status(isReady ? 200 : 503).json({
    ready: isReady,
    database: getConnectionStatus() ? 'connected' : 'disconnected',
  });
});

// API routes (with optional API key auth)
app.use('/api', apiKeyAuth, routes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler
app.use(errorHandler);

// Graceful shutdown
function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
async function start(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    const { port } = config;

    app.listen(port, () => {
      logger.info(`AI Front Desk Service started`, {
        port,
        nodeEnv: config.nodeEnv,
        database: getConnectionStatus() ? 'MongoDB' : 'in-memory',
      });

      logger.info(
╔═══════════════════════════════════════════════════════════════╗
║           AI Front Desk Service v3.0.0                ║
╠═══════════════════════════════════════════════════════════════╣
║  Port:    ${port}                                              ║
║  Database: ${getConnectionStatus() ? 'MongoDB ✅' : 'In-Memory ⚠️'}                              ║
║  Routes:  /api/guests, /api/requests, /api/bookings,    ║
║           /api/concierge, /api/dashboard                ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

start();

export default app;
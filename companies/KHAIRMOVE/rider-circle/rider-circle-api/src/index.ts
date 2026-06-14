import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import { initSocketManager } from './events/socket.js';

async function startServer(): Promise<void> {
  // Create Express app
  const app: Express = express();

  // Create HTTP server (for Socket.io)
  const httpServer = createServer(app);

  // Trust proxy (for load balancers)
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
  }));

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check (before auth)
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'rider-circle-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  app.use('/api', routes);

  // Root endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'RiderCircle API',
      version: '1.0.0',
      description: 'The Operating System for Adventure Mobility',
      documentation: '/api/docs',
      health: '/health',
      websocket: '/socket.io',
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  // Connect to database
  try {
    await connectDatabase();
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  }

  // Initialize Socket.io
  initSocketManager(httpServer);
  logger.info('Socket.io initialized');

  // Start server
  httpServer.listen(config.port, () => {
    logger.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚴 RiderCircle API Starting...                          ║
║                                                            ║
║   Environment: ${config.nodeEnv.padEnd(42)}║
║   Port: ${config.port.toString().padEnd(50)}║
║   Database: ${config.mongodb.dbName.padEnd(45)}║
║   Socket.io: ✅ Enabled                                    ║
║                                                            ║
║   Endpoints:                                                ║
║   • http://localhost:${config.port}/api/health             ║
║   • http://localhost:${config.port}/api/riders              ║
║   • http://localhost:${config.port}/api/rides               ║
║   • http://localhost:${config.port}/api/groups              ║
║   • http://localhost:${config.port}/api/events              ║
║   • http://localhost:${config.port}/api/sos                 ║
║   • http://localhost:${config.port}/api/presence            ║
║                                                            ║
║   WebSocket Events:                                        ║
║   • presence:join     - Join presence                      ║
║   • presence:update  - Update location                    ║
║   • ride:start       - Start ride                         ║
║   • ride:location    - GPS update                          ║
║   • ride:complete    - End ride                           ║
║   • sos:triggered    - Emergency SOS                       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received. Shutting down gracefully...`);

    httpServer.close(async () => {
      logger.info('HTTP server closed');

      try {
        const { disconnectDatabase } = await import('./config/database.js');
        await disconnectDatabase();
      } catch {
        // Ignore disconnect errors
      }

      process.exit(0);
    });

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

// Start the server
startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

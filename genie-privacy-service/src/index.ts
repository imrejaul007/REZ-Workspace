import express, { Express, Request, Response } from 'express';
import { createPrivacyRouter } from './routes/privacy';
import {
  tenantMiddleware,
  validationErrorHandler,
  AuthenticatedRequest
} from './middleware/tenant';
import {
  setupSecurityMiddleware,
  errorHandler,
  notFoundHandler
} from './middleware/security';
import { createStorage, Storage } from './types';

// Service configuration
const SERVICE_CONFIG = {
  name: 'genie-privacy-service',
  version: '1.0.0',
  port: parseInt(process.env.PORT || '4709', 10),
  environment: process.env.NODE_ENV || 'development'
};

// Initialize storage
let storage: Storage;

/**
 * Create and configure the Express application
 */
export const createApp = (): { app: Express; storage: Storage } => {
  const app = express();

  // Initialize storage
  storage = createStorage();

  // Security middleware
  setupSecurityMiddleware(app);

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Health check endpoint (no auth required)
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: SERVICE_CONFIG.name,
      version: SERVICE_CONFIG.version,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Readiness check (no auth required)
  app.get('/ready', (_req: Request, res: Response) => {
    res.json({
      status: 'ready',
      service: SERVICE_CONFIG.name,
      timestamp: new Date().toISOString()
    });
  });

  // Service info (no auth required)
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      service: SERVICE_CONFIG.name,
      version: SERVICE_CONFIG.version,
      description: 'GENIE Personal Intelligence OS - Privacy Model Service',
      endpoints: {
        health: 'GET /health',
        privacy: {
          settings: {
            get: 'GET /api/privacy/settings',
            update: 'PUT /api/privacy/settings'
          },
          incognito: 'POST /api/privacy/incognito',
          memory: 'POST /api/privacy/memory/:id/delete',
          export: 'POST /api/privacy/export',
          deleteAll: 'DELETE /api/privacy/delete-all',
          audit: 'GET /api/privacy/audit'
        }
      },
      headers: {
        required: ['x-tenant-id', 'x-user-id'],
        optional: ['x-client-type']
      }
    });
  });

  // Tenant middleware for API routes
  app.use('/api', tenantMiddleware);

  // Privacy routes
  app.use('/api/privacy', createPrivacyRouter(storage));

  // Error handling
  app.use(notFoundHandler);
  app.use(validationErrorHandler);
  app.use(errorHandler);

  return { app, storage };
};

/**
 * Start the server
 */
export const startServer = async (): Promise<void> => {
  const { app } = createApp();

  const server = app.listen(SERVICE_CONFIG.port, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║           GENIE Privacy Service Started                   ║
╠══════════════════════════════════════════════════════════╣
║  Service: ${SERVICE_CONFIG.name.padEnd(43)}║
║  Version: ${SERVICE_CONFIG.version.padEnd(43)}║
║  Port:    ${SERVICE_CONFIG.port.toString().padEnd(43)}║
║  Env:     ${SERVICE_CONFIG.environment.padEnd(43)}║
╚══════════════════════════════════════════════════════════╝

Available endpoints:
  GET  /health                           - Health check
  GET  /ready                            - Readiness check
  GET  /                                 - Service info

  GET  /api/privacy/settings            - Get privacy settings
  PUT  /api/privacy/settings            - Update privacy settings
  POST /api/privacy/incognito           - Toggle incognito mode
  POST /api/privacy/memory/:id/delete   - Delete memory
  POST /api/privacy/export               - Export all data
  DELETE /api/privacy/delete-all        - Delete all data
  GET  /api/privacy/audit               - Get audit log

Required headers:
  x-tenant-id: <tenant-id>
  x-user-id: <user-id>
  x-client-type: REZ_ECOSYSTEM | RABTUL_SAAS | EXTERNAL
`);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
};

// Start server if this is the main module
if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

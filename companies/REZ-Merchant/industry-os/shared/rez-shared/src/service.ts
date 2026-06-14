import express, { Express } from 'express';
import {
  createMiddlewareStack,
  createShutdownHandler,
  createLogger,
  createDatabaseConnection,
  createHealthCheck,
  createErrorHandler,
  createNotFoundHandler,
  createAuthMiddleware,
} from './index';

export interface ServiceConfig {
  name: string;
  port: number;
  mongoUrl?: string;
  authServiceUrl?: string;
  internalToken?: string;
  corsOrigins?: string[];
}

/**
 * Create a standardized REZ service with all best practices
 */
export async function createService(config: ServiceConfig): Promise<Express> {
  const {
    name,
    port,
    mongoUrl,
    authServiceUrl,
    internalToken,
    corsOrigins,
  } = config;

  const logger = createLogger({ serviceName: name });
  const app = express();

  // Apply standard middleware
  app.use(createMiddlewareStack({
    serviceName: name,
    corsOrigins: corsOrigins || ['*'],
  }) as any);

  // Health check
  app.Use(createHealthCheck({
    serviceName: name,
    port,
    checks: async () => ({
      database: 'ok',
    }),
  }));

  // Liveness/Readiness probes for Kubernetes
  app.get('/health/live', (req, res) => {
    res.json({ status: 'alive' });
  });

  app.get('/health/ready', async (...args) => {
    const { createReadinessProbe } = await import('./health');
    const handler = createReadinessProbe({});
    handler(...args);
  });

  // Auth middleware (will be used by routes)
  if (authServiceUrl && internalToken) {
    app.use('/api', createAuthMiddleware({
      authServiceUrl,
      internalToken,
    }) as any);
  }

  // Error handling
  app.use(createNotFoundHandler());
  app.use(createErrorHandler());

  // Graceful shutdown
  const cleanup = async () => {
    logger.info('Cleaning up...');
    if (mongoUrl) {
      const { closeDatabaseConnection } = await import('./database');
      await closeDatabaseConnection();
    }
    logger.info('Cleanup complete');
  };

  process.on('SIGTERM', createShutdownHandler(cleanup));
  process.on('SIGINT', createShutdownHandler(cleanup));

  // Start server
  return new Promise<Express>((resolve) => {
    app.listen(port, () => {
      logger.info(`[${name}] Service started on port ${port}`);
      resolve(app);
    });
  });
}

export default createService;

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import twinRoutes from './routes';
import { errorHandler, notFoundHandler } from './middleware';
import { apiLimiter } from './middleware/rate-limit.middleware';
import { logger } from './utils/logger';

export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use((req: Request, _res: Response, next) => {
    logger.info(`${req.method} ${req.path}`, {
      query: req.query,
      ip: req.ip,
    });
    next();
  });

  // Rate limiting
  app.use(apiLimiter);

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'property-twin-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Readiness check endpoint
  app.get('/ready', (_req: Request, res: Response) => {
    res.json({
      status: 'ready',
      service: 'property-twin-service',
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  app.use('/api/twins', twinRoutes);

  // API documentation endpoint
  app.get('/api', (_req: Request, res: Response) => {
    res.json({
      service: 'Property Twin Service',
      version: '1.0.0',
      description: 'Digital twin service for real estate properties',
      endpoints: {
        health: 'GET /health',
        ready: 'GET /ready',
        propertyTwin: {
          create: 'POST /api/twins/property',
          query: 'GET /api/twins/property',
          search: 'GET /api/twins/property/search',
          getById: 'GET /api/twins/property/:id',
          update: 'PUT /api/twins/property/:id',
          updateStatus: 'PATCH /api/twins/property/:id/status',
          updatePrice: 'PATCH /api/twins/property/:id/price',
          addMedia: 'POST /api/twins/property/:id/media',
          addTour: 'POST /api/twins/property/:id/tour',
          addFloorPlan: 'POST /api/twins/property/:id/floorplan',
          updateAgent: 'PATCH /api/twins/property/:id/agent',
          getPropflow: 'GET /api/twins/property/:id/propflow',
          archive: 'DELETE /api/twins/property/:id',
          delete: 'DELETE /api/twins/property/:id/permanent',
        },
        statistics: {
          market: 'GET /api/twins/property/stats/market',
          pricePerSqft: 'GET /api/twins/property/stats/price-per-sqft',
        },
      },
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}

export default createApp;

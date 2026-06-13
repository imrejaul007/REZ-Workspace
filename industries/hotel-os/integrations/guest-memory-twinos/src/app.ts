import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { GuestMemoryService, TwinOSClient } from './services';
import { createTwinsRouter } from './routes';
import { errorHandler, notFoundHandler, zodErrorHandler, apiKeyAuth } from './middleware';
import { logger } from './utils';

export function createApp(guestMemoryService: GuestMemoryService): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Internal-Service-Token'],
  }));

  // Request logging
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check (no auth required)
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'guest-memory-twinos',
      timestamp: new Date().toISOString(),
    });
  });

  // Readiness check
  app.get('/ready', async (req, res) => {
    const twinosEnabled = guestMemoryService.isTwinOSEnabledCheck();
    res.json({
      status: 'ready',
      service: 'guest-memory-twinos',
      twinos_sync_enabled: twinosEnabled,
      timestamp: new Date().toISOString(),
    });
  });

  // API routes with authentication
  app.use('/api/twins', apiKeyAuth, createTwinsRouter(guestMemoryService));

  // Error handlers
  app.use(notFoundHandler);
  app.use(zodErrorHandler);
  app.use(errorHandler);

  return app;
}

export { GuestMemoryService, TwinOSClient };
/**
 * AI Concierge Agent - Express Application
 * Main application setup and configuration
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import {
  createGuestTwinRoutes,
  createRoomTwinRoutes,
  createPropertyTwinRoutes,
  createHealthRoutes,
} from './routes';
import {
  GuestTwinService,
  RoomTwinService,
  PropertyTwinService,
  GuestMemoryClient,
} from './services';
import { requestIdMiddleware, errorHandler } from './utils';
import { rateLimiter } from './middleware';
import { logger } from './utils/logger';

export const createApp = (): {
  app: Application;
  services: {
    guestTwinService: GuestTwinService;
    roomTwinService: RoomTwinService;
    propertyTwinService: PropertyTwinService;
    guestMemoryClient: GuestMemoryClient;
  };
} => {
  const app = express();

  // Configuration
  const guestMemoryUrl = process.env.GUEST_MEMORY_URL || 'http://localhost:8447';

  // Initialize services
  const guestTwinService = new GuestTwinService(guestMemoryUrl);
  const roomTwinService = new RoomTwinService();
  const propertyTwinService = new PropertyTwinService();
  const guestMemoryClient = new GuestMemoryClient(guestMemoryUrl);

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  }));
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request ID middleware
  app.use(requestIdMiddleware);

  // Rate limiting
  app.use(rateLimiter);

  // Request logging
  app.use((req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.info('Request completed', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: duration,
      });
    });
    next();
  });

  // Health routes
  app.use('/health', createHealthRoutes(guestMemoryClient));

  // API routes
  app.use('/api/twins/guest', createGuestTwinRoutes(guestTwinService));
  app.use('/api/twins/room', createRoomTwinRoutes(roomTwinService));
  app.use('/api/twins/property', createPropertyTwinRoutes(propertyTwinService));

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
      },
    });
  });

  // Error handler
  app.use(errorHandler);

  return {
    app,
    services: {
      guestTwinService,
      roomTwinService,
      propertyTwinService,
      guestMemoryClient,
    },
  };
};

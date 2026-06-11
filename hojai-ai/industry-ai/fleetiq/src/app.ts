/**
 * FLEETIQ - Express Application Setup
 * Production-ready Express server with comprehensive middleware
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import apiRoutes from './routes/api';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { standardLimiter, authLimiter } from './middleware/rateLimiter';
import { config } from './utils/config';
import { logger } from './utils/logger';
import { Vehicle, Driver, Trip, Maintenance } from './models';
import mongoose from 'mongoose';

// ExpertOS Integration - Clone your profession for online services
import { registerExpertOS } from '../../../hojai-expert-os/src/expertOS-integration';

// ============================================
// CREATE EXPRESS APP
// ============================================

export const createApp = (): Express => {
  const app = express();

  // Trust proxy (for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);

  // ============================================
  // SECURITY MIDDLEWARE
  // ============================================

  // Helmet - Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));

  // CORS - Cross-Origin Resource Sharing
  app.use(cors({
    origin: config.cors.origin,
    methods: config.cors.methods,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    credentials: true,
    maxAge: 86400 // 24 hours
  }));

  // ============================================
  // COMPRESSION
  // ============================================

  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
    level: 6
  }));

  // ============================================
  // BODY PARSING
  // ============================================

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ============================================
  // REQUEST LOGGING
  // ============================================

  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    },
    skip: (req) => req.url === '/health/live'
  }));

  // Request ID middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
    res.setHeader('X-Request-ID', req.headers['x-request-id']);

    // Log request start
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.url !== '/health/live') {
        logger.info('Request completed', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          requestId: req.headers['x-request-id'],
          userId: (req as any).userId
        });
      }
    });

    next();
  });

  // ============================================
  // RATE LIMITING
  // ============================================

  app.use('/api/', standardLimiter);
  app.use('/api/auth', authLimiter);

  // ============================================
  // HEALTH CHECKS
  // ============================================

  // Basic liveness probe
  app.get('/health/live', (req: Request, res: Response) => {
    res.json({
      status: 'alive',
      service: 'FLEETIQ',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Readiness probe (checks DB)
  app.get('/health/ready', async (req: Request, res: Response) => {
    const mongoReady = mongoose.connection.readyState === 1;

    if (!mongoReady) {
      res.status(503).json({
        status: 'not ready',
        checks: { mongodb: 'disconnected' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.json({
      status: 'ready',
      checks: { mongodb: 'connected' },
      timestamp: new Date().toISOString()
    });
  });

  // Detailed health check
  app.get('/health', async (req: Request, res: Response) => {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    try {
      const [vehicleCount, driverCount, tripCount, maintenanceCount] = await Promise.all([
        Vehicle.countDocuments(),
        Driver.countDocuments(),
        Trip.countDocuments(),
        Maintenance.countDocuments()
      ]);

      const memUsage = process.memoryUsage();

      res.json({
        status: 'healthy',
        service: 'FLEETIQ',
        version: '1.0.0',
        port: config.port,
        environment: config.nodeEnv,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mongodb: {
          status: mongoStatus,
          host: mongoose.connection.host,
          name: mongoose.connection.name
        },
        resources: {
          memory: {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
            rss: Math.round(memUsage.rss / 1024 / 1024)
          },
          cpu: process.cpuUsage()
        },
        aiEmployees: [
          { name: 'Dispatch Agent', status: 'active' },
          { name: 'Route Agent', status: 'active' },
          { name: 'Fleet Manager', status: 'active' },
          { name: 'Driver Coach', status: 'active' },
          { name: 'ExpertOS', status: 'active', description: 'Professional AI Twin for fleet managers' }
        ],
        stats: {
          vehicles: vehicleCount,
          drivers: driverCount,
          trips: tripCount,
          maintenance: maintenanceCount
        }
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // ============================================
  // API ROUTES
  // ============================================

  app.use('/api', apiRoutes);

  // ============================================
  // EXPERTOS - Professional AI Twin for Fleet Managers
  // ============================================

  const expertOSRouter = registerExpertOS('fleetiq');
  app.use('/api/expert-os', expertOSRouter);

  // ============================================
  // ERROR HANDLING
  // ============================================

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
};

export default createApp;
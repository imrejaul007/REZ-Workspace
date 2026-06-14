import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import logger from './config/logger.js';
import routes from './routes/index.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

// Initialize Prometheus metrics
collectDefaultMetrics({ prefix: 'youtube_integration_' });

// Custom metrics
const httpRequestsTotal = new Counter({
  name: 'youtube_integration_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

const httpRequestDuration = new Histogram({
  name: 'youtube_integration_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.1, 0.3, 0.5, 1, 3, 5, 10],
});

const activeConnections = new Gauge({
  name: 'youtube_integration_active_connections',
  help: 'Number of active connections',
});

const videosUploadedTotal = new Counter({
  name: 'youtube_integration_videos_uploaded_total',
  help: 'Total number of videos uploaded',
});

const channelsConnected = new Gauge({
  name: 'youtube_integration_channels_connected',
  help: 'Number of connected YouTube channels',
});

const liveStreamsActive = new Gauge({
  name: 'youtube_integration_live_streams_active',
  help: 'Number of active live streams',
});

const createApp = (): Express => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Internal-Token'],
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use((req: Request, _res: Response, next) => {
    activeConnections.inc();
    const startTime = Date.now();

    _res.on('finish', () => {
      activeConnections.dec();
      const duration = (Date.now() - startTime) / 1000;
      const path = req.route?.path || req.path;

      httpRequestsTotal.inc({
        method: req.method,
        path,
        status: _res.statusCode,
      });

      httpRequestDuration.observe(
        {
          method: req.method,
          path,
          status: _res.statusCode,
        },
        duration
      );

      logger.info('Request completed', {
        method: req.method,
        path: req.path,
        status: _res.statusCode,
        duration: `${duration.toFixed(3)}s`,
      });
    });

    next();
  });

  // Health check endpoint (no auth required)
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'youtube-integration',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Metrics endpoint (no auth required)
  app.get('/metrics', async (_req: Request, res: Response) => {
    try {
      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.send(metrics);
    } catch (error) {
      logger.error('Failed to collect metrics', { error: (error as Error).message });
      res.status(500).send('Failed to collect metrics');
    }
  });

  // API routes with auth middleware
  app.use('/api', authMiddleware, routes);

  //404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
};

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Create and start app
    const app = createApp();

    app.listen(config.port, () => {
      logger.info(`YouTube Integration Service started`, {
        port: config.port,
        nodeEnv: config.nodeEnv,
        nodeVersion: process.version,
      });

      logger.info('Available endpoints:', {
        health: `GET /health`,
        metrics: `GET /metrics`,
        auth: {
          oauth: 'GET /api/auth/oauth',
          callback: 'GET /api/auth/callback',
          connect: 'POST /api/auth/connect',
        },
        channels: {
          list: 'GET /api/channels',
          get: 'GET /api/channels/:id',
          connect: 'POST /api/channels/connect',
          refresh: 'POST /api/channels/:id/refresh',
          delete: 'DELETE /api/channels/:id',
        },
        videos: {
          upload: 'POST /api/videos',
          list: 'GET /api/videos',
          get: 'GET /api/videos/:id',
          update: 'PATCH /api/videos/:id',
          delete: 'DELETE /api/videos/:id',
          analytics: 'GET /api/videos/:id/analytics',
        },
        playlists: {
          create: 'POST /api/playlists',
          list: 'GET /api/playlists',
          addVideo: 'POST /api/playlists/:id/videos',
        },
        comments: {
          list: 'GET /api/comments',
          moderate: 'POST /api/comments/moderate',
        },
        live: {
          start: 'POST /api/live/start',
          end: 'POST /api/live/end',
          stats: 'GET /api/live/stats',
        },
      });
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
};

// Export for testing
export { createApp };

// Start server if running directly
startServer();
import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {
  KDSConfigSchema,
  defaultConfig,
  StationType
} from './config';
import { KitchenOrder } from './models/KitchenOrder';
import { Station } from './models/Station';
import { orderDisplayService } from './services/OrderDisplayService';
import { stationRoutingService } from './services/StationRoutingService';
import { timingService } from './services/TimingService';
import ordersRoutes from './routes/orders.routes';
import stationsRoutes from './routes/stations.routes';
import {
  internalAuthMiddleware,
  requestLoggerMiddleware,
  kdsCorsMiddleware,
  errorHandlerMiddleware
} from './middleware';
import { logger } from './utils/logger';

class KDSServer {
  private app: Express;
  private httpServer: ReturnType<typeof createServer>;
  private io: SocketServer;
  private config: typeof defaultConfig;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);

    // CORS origins configuration
    const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
    ];

    this.io = new SocketServer(this.httpServer, {
      cors: {
        origin: (origin, callback) => {
          // Allow no-origin (mobile apps)
          if (!origin) return callback(null, true);

          // In production, strict origin check
          if (process.env.NODE_ENV === 'production') {
            if (corsOrigins.includes(origin)) {
              return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
          }

          // In development, allow localhost
          if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return callback(null, true);
          }

          callback(null, true);
        },
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
        credentials: true,
      }
    });
    this.config = defaultConfig;
  }

  async initialize(): Promise<void> {
    // Validate environment variables
    const envConfig = {
      port: process.env.KDS_PORT ? parseInt(process.env.KDS_PORT, 10) : undefined,
      mongoUri: process.env.MONGODB_URI,
      redisUrl: process.env.REDIS_URL,
      audioEnabled: process.env.AUDIO_ENABLED,
      internalServiceToken: process.env.INTERNAL_SERVICE_TOKENS_JSON
    };

    const validation = KDSConfigSchema.safeParse(envConfig);
    if (!validation.success) {
      logger.error('Configuration validation failed:', { errors: validation.error.errors });
      throw new Error('Invalid configuration');
    }

    this.config = { ...this.config, ...validation.data };

    // Connect to MongoDB
    await this.connectToMongo();

    // Initialize Socket.IO
    orderDisplayService.setSocketServer(this.io);
    this.setupSocketHandlers();

    // Initialize stations
    await stationRoutingService.initializeStations();

    // Start timing monitoring
    timingService.startMonitoring(15000); // Check every 15 seconds

    // Setup timing alerts
    timingService.onAlert((alert) => {
      logger.warn(`[TIMING ALERT] ${alert.type.toUpperCase()}: Order ${alert.orderNumber} at ${alert.stations.join(', ')}`, {
        elapsedSeconds: alert.elapsedSeconds,
        priority: alert.priority,
      });
      this.io.emit('timing:alert', alert);
    });

    // Setup middleware
    this.setupMiddleware();

    // Setup routes
    this.setupRoutes();

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        service: 'rez-kds-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        connections: orderDisplayService.getActiveConnectionCount()
      });
    });

    // Kubernetes liveness probe
    this.app.get('/health/live', (req: Request, res: Response) => {
      res.json({ status: 'alive', timestamp: new Date().toISOString() });
    });

    // Kubernetes readiness probe
    this.app.get('/health/ready', async (req: Request, res: Response) => {
      const checks: Record<string, any> = {
        mongodb: { status: 'unknown' },
        redis: { status: 'unknown' },
      };

      let allHealthy = true;

      // Check MongoDB
      try {
        const mongoStatus = mongoose.connection.readyState;
        if (mongoStatus === 1) {
          checks.mongodb = { status: 'connected' };
        } else {
          checks.mongodb = { status: 'disconnected' };
          allHealthy = false;
        }
      } catch (error) {
        checks.mongodb = { status: 'error', error: (error as Error).message };
        allHealthy = false;
      }

      const statusCode = allHealthy ? 200 : 503;
      res.status(statusCode).json({
        status: allHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks,
      });
    });

    // Kubernetes healthz
    this.app.get('/healthz', (req: Request, res: Response) => {
      res.status(200).send('OK');
    });

    // Metrics endpoint
    this.app.get('/metrics', async (req: Request, res: Response) => {
      try {
        const report = await timingService.getKitchenTimingReport();
        res.json({
          timestamp: new Date().toISOString(),
          report
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to generate metrics' });
      }
    });

    logger.info('KDS Service initialized successfully');
  }

  private async connectToMongo(): Promise<void> {
    try {
      await mongoose.connect(this.config.mongoUri);
      logger.info('Connected to MongoDB', { uri: this.config.mongoUri.replace(/\/\/.*@/, '//***@') });
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', { error: (error as Error).message });
      throw error;
    }
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info(`KDS Socket connected: ${socket.id}`, { socketId: socket.id });

      // Handle station subscriptions
      socket.on('subscribe', (data: { stations: StationType[] }) => {
        for (const station of data.stations) {
          socket.join(`station:${station}`);
        }
        logger.info(`Socket ${socket.id} subscribed to stations`, { stations: data.stations });
        socket.emit('subscribed', { stations: data.stations });
      });

      // Handle unsubscribing
      socket.on('unsubscribe', (data: { stations: StationType[] }) => {
        for (const station of data.stations) {
          socket.leave(`station:${station}`);
        }
        socket.emit('unsubscribed', { stations: data.stations });
      });

      // Handle ping for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      socket.on('disconnect', () => {
        logger.info(`KDS Socket disconnected: ${socket.id}`, { socketId: socket.id });
      });
    });
  }

  private setupMiddleware(): void {
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      xssFilter: true,
      hidePoweredBy: true,
    }));

    // Rate limiting
    const globalLimiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests, please try again later.' },
      skip: (req) => req.path === '/health' || req.path === '/health/live' || req.path === '/healthz',
    });
    this.app.use(globalLimiter);

    // CORS middleware (no wildcard)
    this.app.use(kdsCorsMiddleware);

    // Body parsing
    this.app.use(express.json());

    // Request logging
    this.app.use(requestLoggerMiddleware);

    // Request ID
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      res.setHeader('X-Request-ID', requestId);
      (req as any).requestId = requestId;
      next();
    });
  }

  private setupRoutes(): void {
    // API routes with internal auth
    this.app.use('/api/orders', internalAuthMiddleware, ordersRoutes);
    this.app.use('/api/stations', internalAuthMiddleware, stationsRoutes);
  }

  async start(): Promise<void> {
    await this.initialize();

    return new Promise((resolve) => {
      this.httpServer.listen(this.config.port, () => {
        logger.info('='.repeat(50));
        logger.info('KDS Service started successfully');
        logger.info(`Server listening on port ${this.config.port}`);
        logger.info(`WebSocket server ready`);
        logger.info('='.repeat(50));
        resolve();
      });
    });
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down KDS Service...');

    timingService.stopMonitoring();
    await mongoose.disconnect();
    this.httpServer.close();

    logger.info('KDS Service shut down gracefully');
  }
}

// Start the server
const server = new KDSServer();

process.on('SIGTERM', async () => {
  await server.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await server.shutdown();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
});

server.start().catch((error) => {
  logger.error('Failed to start KDS Service:', { error: (error as Error).message });
  process.exit(1);
});

export { server };
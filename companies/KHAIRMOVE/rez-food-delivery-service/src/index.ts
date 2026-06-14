import { logger } from './utils/logger';
import express from 'express';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import Redis from 'ioredis';
import helmet from 'helmet';
import { config } from './config';
import { OrderService } from './services/OrderService';
import { DeliveryAssignmentService } from './services/DeliveryAssignmentService';
import { TrackingService } from './services/TrackingService';
import { RoutingService } from './services/RoutingService';
import { createOrderRoutes } from './routes/orders.routes';
import { createTrackingRoutes } from './routes/tracking.routes';
import { createDeliveryRoutes } from './routes/delivery.routes';
import {
  internalAuth,
  rateLimiter,
  errorHandler,
  requestLogger,
  sanitizeInput,
} from './middleware';

// Secure CORS configuration
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',');
const socketCorsOptions = {
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST'],
  credentials: true,
};

async function bootstrap(): Promise<void> {
  const app = express();
  const httpServer = createServer(app);

  // Security middleware
  app.use(helmet());
  
  // CORS for HTTP
  const cors = require('cors');
  app.use(cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  }));

  // Initialize Socket.IO with secure CORS
  const io = new SocketServer(httpServer, {
    cors: socketCorsOptions,
  });

  // Initialize Redis
  const redis = new Redis(config.redisUrl);
  redis.on('error', (err: Error) => {
    logger.error('Redis connection error:', err);
  });
  redis.on('connect', () => {
    logger.info('Connected to Redis');
  });

  // Initialize MongoDB
  try {
    await mongoose.connect(config.mongodbUri);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }

  // Initialize services
  const orderService = new OrderService(redis);
  const routingService = new RoutingService(redis);
  const assignmentService = new DeliveryAssignmentService(redis, orderService, routingService);
  const trackingService = new TrackingService(redis);
  trackingService.setSocketServer(io);

  // Middleware
  app.use(express.json());
  app.use(requestLogger);
  app.use(sanitizeInput);
  app.use(rateLimiter(100, 60000)); // 100 requests per minute

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'food-delivery-service',
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        redis: redis.status === 'ready' ? 'connected' : 'disconnected',
      },
    });
  });

  // Readiness probe
  app.get('/ready', (req, res) => {
    if (mongoose.connection.readyState !== 1 || redis.status !== 'ready') {
      return res.status(503).json({ 
        ready: false, 
        dependencies: {
          mongodb: mongoose.connection.readyState === 1,
          redis: redis.status === 'ready',
        }
      });
    }
    res.json({ ready: true });
  });

  // API routes
  app.use('/api/orders', createOrderRoutes(orderService));
  app.use('/api/tracking', createTrackingRoutes(trackingService));
  app.use('/api/delivery', createDeliveryRoutes(assignmentService));

  // Internal routes (require service token)
  app.use('/internal/orders', internalAuth, createOrderRoutes(orderService));
  app.use('/internal/delivery', internalAuth, createDeliveryRoutes(assignmentService));

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    logger.info('Socket connected:', socket.id);

    // Handle order tracking room joining
    socket.on('join:order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      logger.info(`Socket ${socket.id} joined order room: ${orderId}`);
    });

    // Handle customer room joining
    socket.on('join:customer', (customerId: string) => {
      socket.join(`customer:${customerId}`);
      logger.info(`Socket ${socket.id} joined customer room: ${customerId}`);
    });

    // Handle driver room joining and location updates
    socket.on('join:driver', async (data: { driverId: string; orderId?: string }) => {
      socket.join(`driver:${data.driverId}`);

      if (data.orderId) {
        socket.join(`order:${data.orderId}`);
      }

      logger.info(`Socket ${socket.id} joined driver room: ${data.driverId}`);
    });

    // Handle location updates from drivers
    socket.on('location:update', async (data: {
      driverId: string;
      lat: number;
      lng: number;
      orderId?: string;
    }) => {
      await trackingService.updateDriverLocation({
        ...data,
        timestamp: new Date(),
      });
    });

    // Handle order status updates
    socket.on('order:status', async (data: { orderId: string; status: string; note?: string }) => {
      // Emit to all subscribers
      io.to(`order:${data.orderId}`).emit('order:status_update', data);
    });

    socket.on('disconnect', () => {
      logger.info('Socket disconnected:', socket.id);
    });
  });

  // Error handling middleware
  app.use(errorHandler);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Not found',
    });
  });

  // Start server
  httpServer.listen(config.port, () => {
    logger.info(`Food Delivery Service running on port ${config.port}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`MongoDB URI: ${config.mongodbUri}`);
    logger.info(`Redis URL: ${config.redisUrl}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    httpServer.close(() => {
      logger.info('HTTP server closed');
    });
    await mongoose.connection.close();
    await redis.quit();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    httpServer.close(() => {
      logger.info('HTTP server closed');
    });
    await mongoose.connection.close();
    await redis.quit();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start service:', error);
  process.exit(1);
});

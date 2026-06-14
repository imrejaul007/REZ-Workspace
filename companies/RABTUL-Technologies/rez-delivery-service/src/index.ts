import express, { Express, Request, Response } from 'express';
import { tracingMiddleware } from './middleware/tracing';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import config from './config';
import db from './config/database';
import redisClient from './config/redis';
import { errorHandler, requestLogger } from './middleware';
import { trackingService } from './services/trackingService';
import { DeliveryStatus, GeoLocation } from './types';
import { logger } from './utils/logger';

// Routes
import ordersRouter from './routes/orders';
import trackRouter from './routes/track';
import ridersRouter from './routes/riders';
import aggregatorsRouter from './routes/aggregators';
import analyticsRouter from './routes/analytics';

// Event listeners - Initialize integrations with order service and KDS
import './events/orderEvents';

interface SocketUser {
  id: string;
  type: 'driver' | 'customer' | 'admin';
}

interface DeliveryRoom {
  deliveryId: string;
  driverId: string;
  customerId: string;
}

class App {
  public app: Express;
  public server: http.Server;
  public io: SocketServer;
  private deliveryRooms: Map<string, DeliveryRoom> = new Map();

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    const corsOrigins = (() => {
  const origins = process.env.CORS_ORIGIN?.split(',') || [];
  if (origins.includes('*')) {
    throw new Error('Wildcard CORS origin forbidden in production');
  }
  return origins.length > 0 ? origins : ['http://localhost:4000'];
})();

    this.io = new SocketServer(this.server, {
      cors: {
        origin: corsOrigins,
        methods: ['GET', 'POST']
      }
    });

    this.setupMiddlewares();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupHealthCheck();
  }

  private setupMiddlewares(): void {
    this.app.use(cors());
    this.app.use(helmet());
    this.app.use(morgan('combined'));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(requestLogger);
  }

  private setupRoutes(): void {
    // API Routes
    this.app.use('/api/orders', ordersRouter);
    this.app.use('/api/track', trackRouter);
    this.app.use('/api/riders', ridersRouter);
    this.app.use('/api/aggregators', aggregatorsRouter);
    this.app.use('/api/analytics', analyticsRouter);

    this.app.get('/api/health', (req: Request, res: Response) => {
      res.json({
        success: true,
        data: {
          status: 'healthy',
          service: 'rez-delivery-service',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          mongodb: db.getConnectionStatus() ? 'connected' : 'disconnected'
        }
      });
    });

    this.app.get('/api', (req: Request, res: Response) => {
      res.json({
        success: true,
        data: {
          name: 'REZ Delivery Management Service',
          version: '1.0.0',
          endpoints: {
            orders: '/api/orders',
            tracking: '/api/track',
            riders: '/api/riders',
            aggregators: '/api/aggregators',
            analytics: '/api/analytics',
            health: '/api/health'
          },
          websocket: {
            path: '/socket.io',
            events: [
              'join_delivery',
              'leave_delivery',
              'location_update',
              'delivery_status_change',
              'eta_update'
            ]
          }
        }
      });
    });

    this.app.use(errorHandler);
  }

  private setupSocketIO(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('register', (user: SocketUser) => {
        socket.data.user = user;
        logger.info(`User registered: ${user.type} - ${user.id}`);
        socket.join(`user:${user.id}`);
      });

      socket.on('join_delivery', async (data: { deliveryId: string; userId: string; type: 'driver' | 'customer' }) => {
        const { deliveryId, userId, type } = data;
        socket.join(`delivery:${deliveryId}`);

        if (type === 'driver') {
          const room = this.deliveryRooms.get(deliveryId);
          if (room) {
            room.driverId = socket.id;
          } else {
            this.deliveryRooms.set(deliveryId, { deliveryId, driverId: socket.id, customerId: '' });
          }
        } else if (type === 'customer') {
          const room = this.deliveryRooms.get(deliveryId);
          if (room) {
            room.customerId = socket.id;
          } else {
            this.deliveryRooms.set(deliveryId, { deliveryId, driverId: '', customerId: socket.id });
          }
        }

        logger.info(`User ${userId} joined delivery room: ${deliveryId}`);
      });

      socket.on('leave_delivery', (data: { deliveryId: string; userId: string }) => {
        const { deliveryId } = data;
        socket.leave(`delivery:${deliveryId}`);
        logger.info(`User ${data.userId} left delivery room: ${deliveryId}`);
      });

      socket.on('location_update', async (data: { deliveryId: string; location: GeoLocation }) => {
        const { deliveryId, location } = data;
        const room = this.deliveryRooms.get(deliveryId);

        if (room) {
          const eta = await trackingService.updateLocation(
            deliveryId,
            room.driverId,
            location
          );

          this.io.to(`delivery:${deliveryId}`).emit('eta_update', {
            deliveryId,
            location,
            eta
          });
        }
      });

      socket.on('delivery_status_change', (data: { deliveryId: string; status: DeliveryStatus; notes?: string }) => {
        const { deliveryId, status, notes } = data;
        this.io.to(`delivery:${deliveryId}`).emit('delivery_status_changed', {
          deliveryId,
          status,
          notes,
          timestamp: new Date()
        });
      });

      socket.on('request_location', (data: { deliveryId: string }) => {
        const { deliveryId } = data;
        const room = this.deliveryRooms.get(deliveryId);

        if (room?.driverId) {
          this.io.to(room.driverId).emit('location_request', {
            deliveryId,
            requester: socket.id
          });
        }
      });

      socket.on('location_response', (data: { deliveryId: string; location: GeoLocation; requester?: string }) => {
        const { deliveryId, location, requester } = data;
        const room = this.deliveryRooms.get(deliveryId);

        if (requester) {
          this.io.to(requester).emit('location_update', {
            deliveryId,
            location
          });
        }

        this.io.to(`delivery:${deliveryId}`).emit('location_update', {
          deliveryId,
          location
        });
      });

      socket.on('subscribe_driver', (data: { driverId: string }) => {
        socket.join(`driver:${data.driverId}`);
        logger.info(`Socket subscribed to driver: ${data.driverId}`);
      });

      socket.on('unsubscribe_driver', (data: { driverId: string }) => {
        socket.leave(`driver:${data.driverId}`);
        logger.info(`Socket unsubscribed from driver: ${data.driverId}`);
      });

      socket.on('subscribe_nearby_drivers', (data: { latitude: number; longitude: number; radiusKm: number }) => {
        socket.join('nearby_drivers');
        socket.data.nearbyQuery = data;
        logger.info(`Socket subscribed to nearby drivers`);
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);

        for (const [deliveryId, room] of this.deliveryRooms.entries()) {
          if (room.driverId === socket.id || room.customerId === socket.id) {
            this.io.to(`delivery:${deliveryId}`).emit('participant_left', {
              deliveryId,
              socketId: socket.id
            });

            if (room.driverId === socket.id) {
              room.driverId = '';
            }
            if (room.customerId === socket.id) {
              room.customerId = '';
            }

            if (!room.driverId && !room.customerId) {
              this.deliveryRooms.delete(deliveryId);
            }
          }
        }
      });
    });
  }

  private setupHealthCheck(): void {
    this.app.head('/', (req: Request, res: Response) => {
      res.status(200).end();
    });
  }

  public async connectDatabases(): Promise<void> {
    try {
      await db.connect();
      await redisClient.getClient();
      logger.info('All database connections established');
    } catch (error) {
      logger.error('Failed to connect to databases:', error);
      throw error;
    }
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-delivery-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
server.listen(config.port, () => {
        logger.info(`REZ Delivery Service started`, {
          port: config.port,
          environment: config.env,
        });
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    logger.info('Shutting down gracefully...');
    this.io.close();
    this.server.close();
    await db.disconnect();
    await redisClient.disconnect();
    logger.info('Server stopped');
  }
}

async function main(): Promise<void> {
  const app = new App();

  try {
    await app.connectDatabases();
    await app.start();

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received');
      await app.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received');
      await app.stop();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

export default App;

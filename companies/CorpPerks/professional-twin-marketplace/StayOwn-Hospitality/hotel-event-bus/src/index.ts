/**
 * Hotel Event Bus Service
 * Port: 3812
 *
 * Real-time event streaming for StayOwn hospitality operations.
 * Coordinates events between all hotel services including:
 * - Guest arrivals/departures
 * - Room status changes
 * - Housekeeping tasks
 * - Maintenance requests
 * - Billing events
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';

// Configuration
const PORT = process.env.PORT || 3812;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const JWT_SECRET = process.env.JWT_SECRET || 'hotel-event-bus-secret';

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/event-bus.log' })
  ]
});

// Types
interface HotelEvent {
  id: string;
  type: EventType;
  source: string;
  hotelId: string;
  guestId?: string;
  roomId?: string;
  timestamp: string;
  payload: Record<string, any>;
  metadata?: {
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    idempotencyKey?: string;
    correlationId?: string;
  };
}

type EventType =
  // Guest lifecycle
  | 'guest.arrival.scheduled'
  | 'guest.arrival.confirmed'
  | 'guest.arrival.checked-in'
  | 'guest.departure.scheduled'
  | 'guest.departure.extension-requested'
  | 'guest.departure.checked-out'
  | 'guest.preference.updated'
  | 'guest.feedback.received'
  // Room events
  | 'room.status.changed'
  | 'room.cleaning.started'
  | 'room.cleaning.completed'
  | 'room.maintenance.requested'
  | 'room.maintenance.completed'
  | 'room.service.requested'
  | 'room.service.delivered'
  | 'room.minibar.consumed'
  // Housekeeping
  | 'housekeeping.task.created'
  | 'housekeeping.task.assigned'
  | 'housekeeping.task.started'
  | 'housekeeping.task.completed'
  | 'housekeeping.task.cancelled'
  | 'housekeeping.schedule.updated'
  // Maintenance
  | 'maintenance.request.created'
  | 'maintenance.request.assigned'
  | 'maintenance.request.started'
  | 'maintenance.request.completed'
  | 'maintenance.request.cancelled'
  | 'maintenance.scheduled.created'
  // Billing
  | 'billing.charge.added'
  | 'billing.payment.received'
  | 'billing.invoice.generated'
  | 'billing.refund.processed'
  | 'billing.inquiry.received'
  // Booking
  | 'booking.created'
  | 'booking.modified'
  | 'booking.cancelled'
  | 'booking.no-show'
  // Staff
  | 'staff.arrival'
  | 'staff.departure'
  | 'staff.break.started'
  | 'staff.break.ended'
  | 'staff.task.assigned'
  // System
  | 'system.alert'
  | 'system.health-check';

interface Subscription {
  id: string;
  hotelId: string;
  clientId: string;
  socketId?: string;
  events: EventType[] | '*';
  filters?: {
    roomId?: string;
    guestId?: string;
    priority?: string;
  };
  createdAt: string;
}

interface EventHistoryEntry {
  event: HotelEvent;
  deliveredTo: string[];
  timestamp: string;
}

// Services
class RedisEventStore {
  private redis: Redis;
  private readonly HISTORY_TTL = 86400 * 7; // 7 days
  private readonly MAX_HISTORY = 10000;

  constructor(url: string) {
    this.redis = new Redis(url);
  }

  async publish(event: HotelEvent): Promise<void> {
    const channel = `hotel:${event.hotelId}:events`;
    await this.redis.publish(channel, JSON.stringify(event));

    // Store in history
    const historyKey = `hotel:${event.hotelId}:history`;
    await this.redis.lpush(historyKey, JSON.stringify(event));
    await this.redis.ltrim(historyKey, 0, this.MAX_HISTORY - 1);
    await this.redis.expire(historyKey, this.HISTORY_TTL);
  }

  async getHistory(hotelId: string, limit = 100): Promise<HotelEvent[]> {
    const historyKey = `hotel:${hotelId}:history`;
    const events = await this.redis.lrange(historyKey, 0, limit - 1);
    return events.map(e => JSON.parse(e));
  }

  async subscribe(channel: string, callback: (event: HotelEvent) => void): Promise<void> {
    const subscriber = this.redis.duplicate();
    await subscriber.subscribe(channel);
    subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        callback(JSON.parse(message));
      }
    });
  }

  async addSubscription(sub: Subscription): Promise<void> {
    await this.redis.hset(
      `hotel:${sub.hotelId}:subscriptions`,
      sub.id,
      JSON.stringify(sub)
    );
  }

  async removeSubscription(hotelId: string, subId: string): Promise<void> {
    await this.redis.hdel(`hotel:${hotelId}:subscriptions`, subId);
  }

  async getSubscriptions(hotelId: string): Promise<Subscription[]> {
    const subs = await this.redis.hgetall(`hotel:${hotelId}:subscriptions`);
    return Object.values(subs).map(s => JSON.parse(s));
  }
}

class EventBusService {
  private app: express.Application;
  private httpServer: createServer.Server;
  private io: SocketIOServer;
  private redisStore: RedisEventStore;
  private subscriptions: Map<string, Subscription> = new Map();
  private eventHandlers: Map<EventType, Array<(event: HotelEvent) => Promise<void>>> = new Map();

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    this.redisStore = new RedisEventStore(REDIS_URL);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());

    // Auth middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.path === '/health') return next();

      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        (req as any).hotelId = decoded.hotelId || decoded.hotel_id;
        next();
      } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        service: 'hotel-event-bus',
        port: PORT,
        timestamp: new Date().toISOString()
      });
    });

    // Publish event
    this.app.post('/events', async (req: Request, res: Response) => {
      try {
        const hotelId = (req as any).hotelId;
        const event: HotelEvent = {
          id: uuidv4(),
          type: req.body.type,
          source: req.body.source || 'api',
          hotelId,
          guestId: req.body.guestId,
          roomId: req.body.roomId,
          timestamp: new Date().toISOString(),
          payload: req.body.payload || {},
          metadata: req.body.metadata
        };

        await this.publishEvent(event);
        logger.info(`Event published: ${event.type}`, { eventId: event.id });

        res.status(201).json({
          success: true,
          eventId: event.id,
          event
        });
      } catch (error: any) {
        logger.error('Failed to publish event', { error: error.message });
        res.status(500).json({ error: 'Failed to publish event' });
      }
    });

    // Get event history
    this.app.get('/events/history', async (req: Request, res: Response) => {
      try {
        const hotelId = (req as any).hotelId;
        const limit = parseInt(req.query.limit as string) || 100;
        const events = await this.redisStore.getHistory(hotelId, limit);
        res.json({ events });
      } catch (error: any) {
        logger.error('Failed to get history', { error: error.message });
        res.status(500).json({ error: 'Failed to get event history' });
      }
    });

    // Subscribe to events
    this.app.post('/subscriptions', async (req: Request, res: Response) => {
      try {
        const hotelId = (req as any).hotelId;
        const subscription: Subscription = {
          id: uuidv4(),
          hotelId,
          clientId: req.body.clientId,
          events: req.body.events || '*',
          filters: req.body.filters,
          createdAt: new Date().toISOString()
        };

        this.subscriptions.set(subscription.id, subscription);
        await this.redisStore.addSubscription(subscription);

        logger.info('Subscription created', { subscriptionId: subscription.id });
        res.status(201).json({ subscriptionId: subscription.id, subscription });
      } catch (error: any) {
        logger.error('Failed to create subscription', { error: error.message });
        res.status(500).json({ error: 'Failed to create subscription' });
      }
    });

    // Get subscriptions
    this.app.get('/subscriptions', async (req: Request, res: Response) => {
      const hotelId = (req as any).hotelId;
      const subs = await this.redisStore.getSubscriptions(hotelId);
      res.json({ subscriptions: subs });
    });

    // Delete subscription
    this.app.delete('/subscriptions/:id', async (req: Request, res: Response) => {
      const hotelId = (req as any).hotelId;
      const { id } = req.params;

      this.subscriptions.delete(id);
      await this.redisStore.removeSubscription(hotelId, id);

      res.json({ success: true });
    });

    // Event types
    this.app.get('/event-types', (req: Request, res: Response) => {
      const eventTypes: Record<string, string[]> = {
        'guest-lifecycle': [
          'guest.arrival.scheduled',
          'guest.arrival.confirmed',
          'guest.arrival.checked-in',
          'guest.departure.scheduled',
          'guest.departure.extension-requested',
          'guest.departure.checked-out',
          'guest.preference.updated',
          'guest.feedback.received'
        ],
        'room': [
          'room.status.changed',
          'room.cleaning.started',
          'room.cleaning.completed',
          'room.maintenance.requested',
          'room.maintenance.completed',
          'room.service.requested',
          'room.service.delivered',
          'room.minibar.consumed'
        ],
        'housekeeping': [
          'housekeeping.task.created',
          'housekeeping.task.assigned',
          'housekeeping.task.started',
          'housekeeping.task.completed',
          'housekeeping.task.cancelled',
          'housekeeping.schedule.updated'
        ],
        'maintenance': [
          'maintenance.request.created',
          'maintenance.request.assigned',
          'maintenance.request.started',
          'maintenance.request.completed',
          'maintenance.request.cancelled',
          'maintenance.scheduled.created'
        ],
        'billing': [
          'billing.charge.added',
          'billing.payment.received',
          'billing.invoice.generated',
          'billing.refund.processed',
          'billing.inquiry.received'
        ],
        'booking': [
          'booking.created',
          'booking.modified',
          'booking.cancelled',
          'booking.no-show'
        ],
        'staff': [
          'staff.arrival',
          'staff.departure',
          'staff.break.started',
          'staff.break.ended',
          'staff.task.assigned'
        ],
        'system': [
          'system.alert',
          'system.health-check'
        ]
      };
      res.json({ eventTypes });
    });

    // Emit event (for internal service communication)
    this.app.post('/emit', async (req: Request, res: Response) => {
      try {
        const event: HotelEvent = req.body;
        event.id = event.id || uuidv4();
        event.timestamp = event.timestamp || new Date().toISOString();

        await this.publishEvent(event);

        res.json({ success: true, eventId: event.id });
      } catch (error: any) {
        logger.error('Failed to emit event', { error: error.message });
        res.status(500).json({ error: 'Failed to emit event' });
      }
    });
  }

  private setupSocketIO(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info('Client connected', { socketId: socket.id });

      // Authenticate socket
      const token = socket.handshake.auth.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          (socket as any).hotelId = decoded.hotelId || decoded.hotel_id;
          (socket as any).clientId = decoded.clientId || decoded.client_id;
        } catch (err) {
          socket.disconnect();
          return;
        }
      }

      // Subscribe to hotel events
      socket.on('subscribe', async (data: { events?: string[], filters?: any }) => {
        const hotelId = (socket as any).hotelId;
        if (!hotelId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const subscription: Subscription = {
          id: uuidv4(),
          hotelId,
          clientId: (socket as any).clientId || 'unknown',
          socketId: socket.id,
          events: data.events || '*',
          filters: data.filters,
          createdAt: new Date().toISOString()
        };

        this.subscriptions.set(subscription.id, subscription);
        await this.redisStore.addSubscription(subscription);

        socket.emit('subscribed', { subscriptionId: subscription.id });
        logger.info('Socket subscription created', { socketId: socket.id, subscriptionId: subscription.id });
      });

      // Unsubscribe
      socket.on('unsubscribe', async (subscriptionId: string) => {
        const hotelId = (socket as any).hotelId;
        if (!hotelId) return;

        this.subscriptions.delete(subscriptionId);
        await this.redisStore.removeSubscription(hotelId, subscriptionId);
        socket.emit('unsubscribed', { subscriptionId });
      });

      socket.on('disconnect', async () => {
        logger.info('Client disconnected', { socketId: socket.id });
        // Clean up subscriptions for this socket
        const hotelId = (socket as any).hotelId;
        if (hotelId) {
          const toDelete: string[] = [];
          this.subscriptions.forEach((sub, id) => {
            if (sub.socketId === socket.id) {
              toDelete.push(id);
            }
          });
          for (const id of toDelete) {
            this.subscriptions.delete(id);
            await this.redisStore.removeSubscription(hotelId, id);
          }
        }
      });
    });
  }

  private setupEventHandlers(): void {
    // Guest arrival handler - triggers welcome sequence
    this.registerHandler('guest.arrival.checked-in', async (event) => {
      logger.info('Guest checked in, triggering welcome sequence', {
        guestId: event.guestId,
        roomId: event.roomId
      });
      // Emit to relevant services
      this.io.to(`hotel:${event.hotelId}`).emit('guest.welcome', {
        guestId: event.guestId,
        roomId: event.roomId,
        preferences: event.payload.preferences
      });
    });

    // Room cleaning completed - update availability
    this.registerHandler('room.cleaning.completed', async (event) => {
      logger.info('Room cleaning completed', { roomId: event.roomId });
      this.io.to(`hotel:${event.hotelId}`).emit('room.available', {
        roomId: event.roomId
      });
    });

    // Maintenance completed - clear alert
    this.registerHandler('maintenance.request.completed', async (event) => {
      logger.info('Maintenance completed', {
        requestId: event.payload.requestId,
        roomId: event.roomId
      });
    });

    // Guest feedback - alert management
    this.registerHandler('guest.feedback.received', async (event) => {
      const rating = event.payload.rating;
      if (rating && rating < 3) {
        logger.warn('Low guest rating received', {
          guestId: event.guestId,
          rating
        });
        this.io.to(`hotel:${event.hotelId}`).emit('alert.low-rating', {
          guestId: event.guestId,
          rating,
          feedback: event.payload.feedback
        });
      }
    });

    // Billing inquiry - auto-respond
    this.registerHandler('billing.inquiry.received', async (event) => {
      logger.info('Billing inquiry received', {
        guestId: event.guestId,
        inquiryType: event.payload.type
      });
    });
  }

  private registerHandler(eventType: EventType, handler: (event: HotelEvent) => Promise<void>): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  async publishEvent(event: HotelEvent): Promise<void> {
    // Publish to Redis for persistence and cross-instance communication
    await this.redisStore.publish(event);

    // Emit to local sockets
    this.io.emit('event', event);

    // Also emit to hotel-specific room
    this.io.to(`hotel:${event.hotelId}`).emit('event', event);

    // Trigger event handlers
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      await Promise.all(handlers.map(h => h(event).catch(e =>
        logger.error('Event handler error', { eventType: event.type, error: e.message })
      )));
    }

    // Handle wildcard subscribers
    const wildcardHandlers = this.eventHandlers.get('*' as EventType);
    if (wildcardHandlers) {
      await Promise.all(wildcardHandlers.map(h => h(event).catch(e =>
        logger.error('Wildcard handler error', { error: e.message })
      )));
    }
  }

  async start(): Promise<void> {
    // Subscribe to Redis pub/sub for cross-instance events
    await this.redisStore.subscribe('*', async (event) => {
      this.io.to(`hotel:${event.hotelId}`).emit('event', event);
    });

    this.httpServer.listen(PORT, () => {
      logger.info(`Hotel Event Bus started on port ${PORT}`);
      logger.info(🏨 Hotel Event Bus running on port ${PORT}`);
    });
  }
}

// Start the service
const eventBus = new EventBusService();
eventBus.start().catch(err => {
  logger.error('Failed to start event bus', { error: err.message });
  process.exit(1);
});

export { HotelEvent, EventType, Subscription };

import EventEmitter from 'events';
import Redis from 'ioredis';
import { logger } from '../utils/index.js';

// ============================================================================
// EVENT EMITTER
// ============================================================================

class TwinEventEmitter extends EventEmitter {
  private redis: Redis | null = null;
  private redisUrl: string | null = null;
  private isConnected: boolean = false;

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Initialize with Redis for pub/sub
   */
  async initialize(redisUrl: string): Promise<void> {
    this.redisUrl = redisUrl;

    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) return null;
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
      });

      this.redis.on('error', (err) => {
        logger.error('Redis connection error', { error: err.message });
        this.isConnected = false;
      });

      this.redis.on('connect', () => {
        logger.info('Redis connected');
        this.isConnected = true;
      });

      await this.redis.connect();
      this.isConnected = true;
      logger.info('Event emitter initialized with Redis', { url: redisUrl });
    } catch (error) {
      logger.warn('Failed to connect to Redis, using local events only', { error });
      this.redis = null;
    }
  }

  /**
   * Emit an event (local + Redis if available)
   */
  emit(event: string, data: unknown): boolean {
    // Always emit locally
    const result = super.emit(event, data);

    // Publish to Redis if available
    if (this.redis && this.isConnected) {
      const channel = `finance.${event.replace(/_/g, '.')}`;
      this.redis.publish(channel, JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString(),
      })).catch((err) => {
        logger.error('Failed to publish event to Redis', { event, error: err.message });
      });
    }

    return result;
  }

  /**
   * Subscribe to events
   */
  async subscribe(event: string, handler: (data: unknown) => void): Promise<void> {
    // Local subscription
    this.on(event, handler);

    // Redis subscription if available
    if (this.redis && this.isConnected) {
      const channel = `finance.${event.replace(/_/g, '.')}`;
      await this.redis.subscribe(channel);
      this.redis.on('message', (ch, message) => {
        if (ch === channel) {
          try {
            const parsed = JSON.parse(message);
            handler(parsed.data);
          } catch {
            handler(message);
          }
        }
      });
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
    this.isConnected = false;
    logger.info('Event emitter closed');
  }

  /**
   * Check if connected to Redis
   */
  get isRedisConnected(): boolean {
    return this.isConnected;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let eventEmitter: TwinEventEmitter | null = null;

export function getEventEmitter(redisUrl?: string): TwinEventEmitter {
  if (!eventEmitter) {
    eventEmitter = new TwinEventEmitter();

    // Initialize with Redis if URL provided
    if (redisUrl) {
      eventEmitter.initialize(redisUrl).catch((err) => {
        logger.error('Failed to initialize event emitter', { error: err });
      });
    }
  }
  return eventEmitter;
}

export function resetEventEmitter(): void {
  if (eventEmitter) {
    eventEmitter.removeAllListeners();
  }
  eventEmitter = null;
}
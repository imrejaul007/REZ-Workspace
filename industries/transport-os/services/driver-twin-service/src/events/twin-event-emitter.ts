import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// EVENT TYPES
// ============================================================================

export enum TwinEventType {
  // Driver Twin Events
  DRIVER_TWIN_CREATED = 'driver.twin.created',
  DRIVER_TWIN_UPDATED = 'driver.twin.updated',
  DRIVER_STATUS_CHANGED = 'driver.status.changed',
  DRIVER_LOCATION_UPDATED = 'driver.location.updated',
  DRIVER_PERFORMANCE_UPDATED = 'driver.performance.updated',
  DRIVER_EARNINGS_UPDATED = 'driver.earnings.updated',
  DRIVER_SCHEDULE_UPDATED = 'driver.schedule.updated',
  DRIVER_RATING_RECEIVED = 'driver.rating.received',
  DRIVER_SHIFT_STARTED = 'driver.shift.started',
  DRIVER_SHIFT_ENDED = 'driver.shift.ended',
  DRIVER_LICENSE_EXPIRING = 'driver.license.expiring',
  DRIVER_BACKGROUND_UPDATED = 'driver.background.updated',
  DRIVER_ORDER_ACCEPTED = 'driver.order.accepted',
  DRIVER_ORDER_CANCELLED = 'driver.order.cancelled',
  DRIVER_VEHICLE_ASSIGNED = 'driver.vehicle.assigned',
  DRIVER_VEHICLE_UNASSIGNED = 'driver.vehicle.unassigned',
  DRIVER_FLEET_ASSIGNED = 'driver.fleet.assigned',

  // System Events
  TWIN_ERROR = 'twin.error',
  TWIN_SYNC = 'twin.sync',
}

export interface TwinEvent<T = any> {
  id: string;
  type: TwinEventType;
  twin_id: string;
  twin_type: 'driver';
  timestamp: string;
  version: number;
  data: T;
  metadata?: {
    source_service?: string;
    correlation_id?: string;
    user_id?: string;
  };
}

export interface DriverCreatedEvent extends TwinEvent {
  type: TwinEventType.DRIVER_TWIN_CREATED;
  data: {
    driver_id: string;
    profile: any;
    fleet_id?: string;
  };
}

export interface DriverStatusChangedEvent extends TwinEvent {
  type: TwinEventType.DRIVER_STATUS_CHANGED;
  data: {
    driver_id: string;
    previous_status: string;
    new_status: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
}

export interface DriverLocationUpdatedEvent extends TwinEvent {
  type: TwinEventType.DRIVER_LOCATION_UPDATED;
  data: {
    driver_id: string;
    location: {
      lat: number;
      lng: number;
    };
    heading?: number;
    speed?: number;
  };
}

export interface DriverRatingReceivedEvent extends TwinEvent {
  type: TwinEventType.DRIVER_RATING_RECEIVED;
  data: {
    driver_id: string;
    rating: number;
    trip_id?: string;
    order_id?: string;
    feedback?: string;
  };
}

export interface DriverShiftStartedEvent extends TwinEvent {
  type: TwinEventType.DRIVER_SHIFT_STARTED;
  data: {
    driver_id: string;
    vehicle_id: string;
    shift_start: string;
  };
}

export interface DriverShiftEndedEvent extends TwinEvent {
  type: TwinEventType.DRIVER_SHIFT_ENDED;
  data: {
    driver_id: string;
    shift_end: string;
    shift_duration_hours: number;
    earnings: {
      today: number;
      week: number;
    };
  };
}

export interface DriverOrderAcceptedEvent extends TwinEvent {
  type: TwinEventType.DRIVER_ORDER_ACCEPTED;
  data: {
    driver_id: string;
    order_id: string;
    pickup_location: {
      lat: number;
      lng: number;
    };
  };
}

export interface DriverOrderCancelledEvent extends TwinEvent {
  type: TwinEventType.DRIVER_ORDER_CANCELLED;
  data: {
    driver_id: string;
    order_id: string;
    reason?: string;
  };
}

// ============================================================================
// EVENT EMITTER SERVICE
// ============================================================================

export class TwinEventEmitter {
  private emitter: EventEmitter;
  private redis: Redis | null = null;
  private redisChannel: string;
  private isConnected: boolean = false;

  constructor(redisUrl?: string) {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
    this.redisChannel = 'transport-driver-events';

    if (redisUrl) {
      this.initRedis(redisUrl);
    }
  }

  private initRedis(redisUrl: string): void {
    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        console.log('[TwinEventEmitter] Redis connected');
      });

      this.redis.on('error', (err) => {
        console.error('[TwinEventEmitter] Redis error:', err);
        this.isConnected = false;
      });

      this.redis.subscribe(this.redisChannel, (err) => {
        if (err) {
          console.error('[TwinEventEmitter] Subscribe error:', err);
        }
      });

      this.redis.on('message', (channel, message) => {
        if (channel === this.redisChannel) {
          try {
            const event = JSON.parse(message) as TwinEvent;
            this.emitter.emit(event.type, event);
            this.emitter.emit('*', event);
          } catch (err) {
            console.error('[TwinEventEmitter] Failed to parse event:', err);
          }
        }
      });
    } catch (err) {
      console.error('[TwinEventEmitter] Failed to init Redis:', err);
    }
  }

  /**
   * Emit a twin event
   */
  async emit<T>(type: TwinEventType, twin_id: string, twin_type: 'driver', data: T, metadata?: TwinEvent['metadata']): Promise<TwinEvent<T>> {
    const event: TwinEvent<T> = {
      id: uuidv4(),
      type,
      twin_id,
      twin_type,
      timestamp: new Date().toISOString(),
      version: 1,
      data,
      metadata,
    };

    this.emitter.emit(type, event);
    this.emitter.emit('*', event);

    if (this.redis && this.isConnected) {
      try {
        await this.redis.publish(this.redisChannel, JSON.stringify(event));
      } catch (err) {
        console.error('[TwinEventEmitter] Failed to publish to Redis:', err);
      }
    }

    console.log(`[TwinEventEmitter] Event emitted: ${type} for ${twin_type} ${twin_id}`);
    return event;
  }

  /**
   * Subscribe to events
   */
  on<T = any>(type: TwinEventType, handler: (event: TwinEvent<T>) => void): () => void {
    this.emitter.on(type, handler);
    return () => this.emitter.off(type, handler);
  }

  /**
   * Subscribe to all events
   */
  onAny(handler: (event: TwinEvent) => void): () => void {
    this.emitter.on('*', handler);
    return () => this.emitter.off('*', handler);
  }

  /**
   * Subscribe once
   */
  once<T = any>(type: TwinEventType, handler: (event: TwinEvent<T>) => void): void {
    this.emitter.once(type, handler);
  }

  /**
   * Unsubscribe
   */
  off<T = any>(type: TwinEventType, handler: (event: TwinEvent<T>) => void): void {
    this.emitter.off(type, handler);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(type?: TwinEventType): void {
    if (type) {
      this.emitter.removeAllListeners(type);
    } else {
      this.emitter.removeAllListeners();
    }
  }

  /**
   * Get listener count
   */
  listenerCount(type?: TwinEventType): number {
    if (type) {
      return this.emitter.listenerCount(type);
    }
    return this.emitter.eventNames().reduce((acc, name) => acc + this.emitter.listenerCount(name), 0);
  }

  /**
   * Check if Redis is connected
   */
  isRedisConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isConnected = false;
    }
    this.emitter.removeAllListeners();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let instance: TwinEventEmitter | null = null;

export function getEventEmitter(redisUrl?: string): TwinEventEmitter {
  if (!instance) {
    instance = new TwinEventEmitter(redisUrl);
  }
  return instance;
}

export function resetEventEmitter(): void {
  if (instance) {
    instance.close();
    instance = null;
  }
}

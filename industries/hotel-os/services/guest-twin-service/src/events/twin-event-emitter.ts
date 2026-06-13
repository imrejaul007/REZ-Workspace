import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// EVENT TYPES
// ============================================================================

export enum TwinEventType {
  // Guest Twin Events
  GUEST_TWIN_CREATED = 'guest.twin.created',
  GUEST_TWIN_UPDATED = 'guest.twin.updated',
  GUEST_PREFERENCES_UPDATED = 'guest.preferences.updated',
  GUEST_SENTIMENT_UPDATED = 'guest.sentiment.updated',
  GUEST_CHECKIN = 'guest.checkin',
  GUEST_CHECKOUT = 'guest.checkout',
  GUEST_LOYALTY_UPDATED = 'guest.loyalty.updated',

  // Room Twin Events
  ROOM_TWIN_CREATED = 'room.twin.created',
  ROOM_TWIN_UPDATED = 'room.twin.updated',
  ROOM_STATUS_CHANGED = 'room.status.changed',
  ROOM_IOT_STATE_CHANGED = 'room.iot.changed',
  ROOM_OCCUPIED = 'room.occupied',
  ROOM_VACATED = 'room.vacated',

  // Property Twin Events
  PROPERTY_TWIN_CREATED = 'property.twin.created',
  PROPERTY_TWIN_UPDATED = 'property.twin.updated',
  PROPERTY_INVENTORY_CHANGED = 'property.inventory.changed',
  PROPERTY_REVENUE_UPDATED = 'property.revenue.updated',

  // System Events
  TWIN_ERROR = 'twin.error',
  TWIN_SYNC = 'twin.sync',
}

export interface TwinEvent<T = any> {
  id: string;
  type: TwinEventType;
  twin_id: string;
  twin_type: 'guest' | 'room' | 'property';
  timestamp: string;
  version: number;
  data: T;
  metadata?: {
    source_service?: string;
    correlation_id?: string;
    user_id?: string;
  };
}

export interface GuestCreatedEvent extends TwinEvent {
  type: TwinEventType.GUEST_TWIN_CREATED;
  data: {
    guest_id: string;
    profile: any;
    property_id?: string;
  };
}

export interface GuestPreferencesUpdatedEvent extends TwinEvent {
  type: TwinEventType.GUEST_PREFERENCES_UPDATED;
  data: {
    guest_id: string;
    preferences: any;
    changed_fields: string[];
  };
}

export interface GuestCheckInEvent extends TwinEvent {
  type: TwinEventType.GUEST_CHECKIN;
  data: {
    guest_id: string;
    room_id: string;
    check_in: string;
    check_out: string;
  };
}

export interface GuestCheckOutEvent extends TwinEvent {
  type: TwinEventType.GUEST_CHECKOUT;
  data: {
    guest_id: string;
    room_id: string;
    check_out: string;
    rating?: number;
    feedback?: string;
    total_spend: number;
  };
}

export interface RoomStatusChangedEvent extends TwinEvent {
  type: TwinEventType.ROOM_STATUS_CHANGED;
  data: {
    room_id: string;
    property_id: string;
    previous_status: string;
    new_status: string;
  };
}

export interface IoTStateChangedEvent extends TwinEvent {
  type: TwinEventType.ROOM_IOT_STATE_CHANGED;
  data: {
    room_id: string;
    changed_fields: string[];
    state: any;
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
    this.redisChannel = 'twin-events';

    if (redisUrl) {
      this.initRedis(redisUrl);
    }
  }

  private async initRedis(redisUrl: string): Promise<void> {
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

      // Subscribe to remote events
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
  async emit<T>(type: TwinEventType, twin_id: string, twin_type: 'guest' | 'room' | 'property', data: T, metadata?: TwinEvent['metadata']): Promise<TwinEvent<T>> {
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

    // Emit locally
    this.emitter.emit(type, event);
    this.emitter.emit('*', event);

    // Publish to Redis for distributed systems
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
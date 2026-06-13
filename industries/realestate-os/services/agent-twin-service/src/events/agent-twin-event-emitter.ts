import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// EVENT TYPES
// ============================================================================

export enum AgentTwinEventType {
  // Agent Twin Events
  AGENT_TWIN_CREATED = 'agent.twin.created',
  AGENT_TWIN_UPDATED = 'agent.twin.updated',
  AGENT_PROFILE_UPDATED = 'agent.profile.updated',
  AGENT_CONTACT_UPDATED = 'agent.contact.updated',
  AGENT_BROKERAGE_UPDATED = 'agent.brokerage.updated',
  AGENT_PERFORMANCE_UPDATED = 'agent.performance.updated',
  AGENT_AVAILABILITY_UPDATED = 'agent.availability.updated',
  AGENT_LEAD_PREFERENCES_UPDATED = 'agent.lead_preferences.updated',
  AGENT_COMPENSATION_UPDATED = 'agent.compensation.updated',
  AGENT_LISTING_ADDED = 'agent.listing.added',
  AGENT_LISTING_REMOVED = 'agent.listing.removed',
  AGENT_DEAL_ADDED = 'agent.deal.added',
  AGENT_DEAL_REMOVED = 'agent.deal.removed',
  AGENT_STATUS_CHANGED = 'agent.status.changed',

  // System Events
  TWIN_ERROR = 'twin.error',
  TWIN_SYNC = 'twin.sync',
}

export interface TwinEvent<T = unknown> {
  id: string;
  type: AgentTwinEventType;
  twin_id: string;
  twin_type: 'agent';
  timestamp: string;
  version: number;
  data: T;
  metadata?: {
    source_service?: string;
    correlation_id?: string;
    user_id?: string;
  };
}

export interface AgentCreatedEvent extends TwinEvent {
  type: AgentTwinEventType.AGENT_TWIN_CREATED;
  data: {
    agent_id: string;
    profile: {
      name: { first: string; last: string; prefix?: string | null };
      license_number: string;
      license_state: string;
    };
    brokerage: {
      brokerage_id: string;
      brokerage_name: string;
    };
  };
}

export interface AgentProfileUpdatedEvent extends TwinEvent {
  type: AgentTwinEventType.AGENT_PROFILE_UPDATED;
  data: {
    agent_id: string;
    changes: Record<string, unknown>;
  };
}

export interface AgentPerformanceUpdatedEvent extends TwinEvent {
  type: AgentTwinEventType.AGENT_PERFORMANCE_UPDATED;
  data: {
    agent_id: string;
    performance: {
      transactions_ytd?: number;
      volume_ytd?: number;
      avg_days_to_close?: number;
      list_to_sale_ratio?: number;
      client_rating?: number;
      review_count?: number;
      recommendation_rate?: number;
    };
  };
}

export interface AgentAvailabilityUpdatedEvent extends TwinEvent {
  type: AgentTwinEventType.AGENT_AVAILABILITY_UPDATED;
  data: {
    agent_id: string;
    status: 'available' | 'busy' | 'unavailable';
    previous_status?: 'available' | 'busy' | 'unavailable';
  };
}

export interface AgentListingEvent extends TwinEvent {
  type: AgentTwinEventType.AGENT_LISTING_ADDED | AgentTwinEventType.AGENT_LISTING_REMOVED;
  data: {
    agent_id: string;
    listing_id: string;
  };
}

export interface AgentDealEvent extends TwinEvent {
  type: AgentTwinEventType.AGENT_DEAL_ADDED | AgentTwinEventType.AGENT_DEAL_REMOVED;
  data: {
    agent_id: string;
    deal_id: string;
  };
}

export interface AgentStatusChangedEvent extends TwinEvent {
  type: AgentTwinEventType.AGENT_STATUS_CHANGED;
  data: {
    agent_id: string;
    previous_status: 'available' | 'busy' | 'unavailable';
    new_status: 'available' | 'busy' | 'unavailable';
  };
}

// ============================================================================
// EVENT EMITTER SERVICE
// ============================================================================

// Redis client interface for type safety
interface RedisClient {
  on(event: string, callback: (...args: unknown[]) => void): void;
  subscribe(channel: string, callback?: (err: Error | null) => void): void;
  publish(channel: string, message: string): Promise<number>;
  quit(): Promise<void>;
}

export class AgentTwinEventEmitter {
  private emitter: EventEmitter;
  private redis: RedisClient | null = null;
  private redisChannel: string;
  private isConnected: boolean = false;

  constructor(redisUrl?: string) {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
    this.redisChannel = 'agent-twin-events';

    if (redisUrl) {
      this.initRedis(redisUrl);
    }
  }

  private async initRedis(redisUrl: string): Promise<void> {
    try {
      // Dynamic import to handle ioredis typing issues
      const RedisModule = await import('ioredis');
      const Redis = RedisModule.default;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const RedisConstructor = Redis as any;
      this.redis = new RedisConstructor(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
      }) as unknown as RedisClient;

      this.redis.on('connect', () => {
        this.isConnected = true;
        console.log('[AgentTwinEventEmitter] Redis connected');
      });

      this.redis.on('error', (err: unknown) => {
        console.error('[AgentTwinEventEmitter] Redis error:', err);
        this.isConnected = false;
      });

      // Subscribe to remote events
      this.redis.subscribe(this.redisChannel);
      this.redis.on('message', (channel: unknown, message: unknown) => {
        if (channel === this.redisChannel && typeof channel === 'string' && typeof message === 'string') {
          try {
            const event = JSON.parse(message) as TwinEvent;
            this.emitter.emit(event.type, event);
            this.emitter.emit('*', event);
          } catch (err) {
            console.error('[AgentTwinEventEmitter] Failed to parse event:', err);
          }
        }
      });
    } catch (err) {
      console.error('[AgentTwinEventEmitter] Failed to init Redis:', err);
    }
  }

  /**
   * Emit a twin event
   */
  async emit<T>(type: AgentTwinEventType, twin_id: string, data: T, metadata?: TwinEvent['metadata']): Promise<TwinEvent<T>> {
    const event: TwinEvent<T> = {
      id: uuidv4(),
      type,
      twin_id,
      twin_type: 'agent',
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
        console.error('[AgentTwinEventEmitter] Failed to publish to Redis:', err);
      }
    }

    console.log(`[AgentTwinEventEmitter] Event emitted: ${type} for agent ${twin_id}`);
    return event;
  }

  /**
   * Subscribe to events
   */
  on<T = unknown>(type: AgentTwinEventType, handler: (event: TwinEvent<T>) => void): () => void {
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
  once<T = unknown>(type: AgentTwinEventType, handler: (event: TwinEvent<T>) => void): void {
    this.emitter.once(type, handler);
  }

  /**
   * Unsubscribe
   */
  off<T = unknown>(type: AgentTwinEventType, handler: (event: TwinEvent<T>) => void): void {
    this.emitter.off(type, handler);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(type?: AgentTwinEventType): void {
    if (type) {
      this.emitter.removeAllListeners(type);
    } else {
      this.emitter.removeAllListeners();
    }
  }

  /**
   * Get listener count
   */
  listenerCount(type?: AgentTwinEventType): number {
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

let instance: AgentTwinEventEmitter | null = null;

export function getEventEmitter(redisUrl?: string): AgentTwinEventEmitter {
  if (!instance) {
    instance = new AgentTwinEventEmitter(redisUrl);
  }
  return instance;
}

export function resetEventEmitter(): void {
  if (instance) {
    instance.close();
    instance = null;
  }
}

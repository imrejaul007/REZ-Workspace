/**
 * Event Bus Connector - RABTUL Event Bus Service Client
 *
 * Handles all event-driven operations including:
 * - Event publishing (pub/sub)
 * - Event subscription (real-time handlers)
 * - Event history retrieval
 *
 * @example
 * ```typescript
 * import { EventBusConnector } from '@rez/connector-sdk/eventBus';
 *
 * const eventBus = new EventBusConnector({
 *   baseUrl: 'http://localhost:4051',
 *   internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,
 * });
 *
 * // Publish an event
 * await eventBus.publish('user.created', { userId: '123', email: 'user@example.com' });
 *
 * // Subscribe to events
 * eventBus.subscribe('order.placed', (data) => {
 *   console.log('New order:', data);
 * });
 * ```
 */

import { BaseConnector } from '../core';
import {
  ApiError,
  PublishEventResponse,
  EventHistoryResponse,
  PublishSchema,
  EventHistorySchema,
} from '../types';

// ============================================================================
// Connector Configuration
// ============================================================================

export interface EventBusConnectorConfig {
  /** Event bus service URL (defaults to EVENT_BUS_URL env var or http://localhost:4051) */
  baseUrl?: string;
  /** Internal service token for inter-service communication */
  internalServiceToken?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

// ============================================================================
// Event Handler Types
// ============================================================================

export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

interface Subscription {
  topic: string;
  handler: EventHandler;
  handlerId: string;
}

// ============================================================================
// Connector Class
// ============================================================================

export class EventBusConnector extends BaseConnector<EventBusConnectorConfig> {
  private static readonly SERVICE_NAME = 'eventBus';
  private static readonly DEFAULT_PORT = 4051;
  private static readonly ENV_VAR = 'EVENT_BUS_URL';

  private readonly subscriptions: Map<string, Set<Subscription>> = new Map();
  private readonly eventHandlers: Map<string, EventHandler[]> = new Map();
  private webSocketConnection: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;

  constructor(config: EventBusConnectorConfig = {}) {
    const completeConfig: EventBusConnectorConfig = {
      baseUrl: config.baseUrl || process.env[EventBusConnector.ENV_VAR] || `http://localhost:${EventBusConnector.DEFAULT_PORT}`,
      internalServiceToken: config.internalServiceToken || process.env.INTERNAL_SERVICE_TOKEN,
      timeout: config.timeout ?? 30000,
      retries: config.retries ?? 3,
      debug: config.debug ?? false,
    };

    super(completeConfig, EventBusConnector.SERVICE_NAME);
  }

  // ============================================================================
  // Connection Management
  // ============================================================================

  private getWebSocketUrl(): string {
    const baseUrl = this.config.baseUrl || `http://localhost:${EventBusConnector.DEFAULT_PORT}`;
    const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
    const host = baseUrl.replace(/^https?:\/\//, '');
    return `${wsProtocol}://${host}/ws`;
  }

  private async connectWebSocket(): Promise<void> {
    if (this.isConnecting || this.webSocketConnection?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.getWebSocketUrl();
        const ws = new WebSocket(`${wsUrl}?token=${this.config.internalServiceToken || ''}`);

        ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.webSocketConnection = ws;
          this.resubscribeAll();
          resolve();
        };

        ws.onmessage = (event) => {
          this.handleWebSocketMessage(event);
        };

        ws.onerror = (error) => {
          this.isConnecting = false;
          this.config['debug'] && console.error('[EventBus] WebSocket error:', error);
        };

        ws.onclose = () => {
          this.isConnecting = false;
          this.webSocketConnection = null;
          this.scheduleReconnect();
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as {
        topic: string;
        data: unknown;
        eventId?: string;
        timestamp?: string;
      };

      const handlers = this.eventHandlers.get(message.topic);
      if (handlers) {
        for (const handler of handlers) {
          try {
            const result = handler(message.data);
            if (result instanceof Promise) {
              result.catch((error) => {
                console.error(`[EventBus] Handler error for topic ${message.topic}:`, error);
              });
            }
          } catch (error) {
            console.error(`[EventBus] Handler error for topic ${message.topic}:`, error);
          }
        }
      }

      // Also notify wildcard handlers
      const wildcardHandlers = this.eventHandlers.get('*');
      if (wildcardHandlers && message.topic !== '*') {
        for (const handler of wildcardHandlers) {
          try {
            handler({ topic: message.topic, ...message });
          } catch (error) {
            console.error(`[EventBus] Wildcard handler error:`, error);
          }
        }
      }
    } catch (error) {
      console.error('[EventBus] Failed to parse WebSocket message:', error);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[EventBus] Max reconnect attempts reached');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      this.connectWebSocket().catch((error) => {
        console.error('[EventBus] Reconnect failed:', error);
      });
    }, delay);
  }

  private resubscribeAll(): void {
    for (const [topic, subscriptions] of this.subscriptions) {
      for (const sub of subscriptions) {
        this.sendSubscriptionMessage(topic, 'subscribe');
      }
    }
  }

  private sendSubscriptionMessage(topic: string, action: 'subscribe' | 'unsubscribe'): void {
    if (this.webSocketConnection?.readyState === WebSocket.OPEN) {
      this.webSocketConnection.send(
        JSON.stringify({
          action,
          topic,
          token: this.config.internalServiceToken,
        })
      );
    }
  }

  // ============================================================================
  // Event Publishing
  // ============================================================================

  /**
   * Publish an event to a topic
   *
   * @param topic - Event topic name (e.g., 'user.created', 'order.placed')
   * @param data - Event payload data
   * @returns Published event confirmation with event ID
   *
   * @example
   * ```typescript
   * const result = await eventBus.publish('user.created', {
   *   userId: '123',
   *   email: 'user@example.com',
   *   name: 'John Doe'
   * });
   * console.log('Event ID:', result.eventId);
   * ```
   */
  async publish(topic: string, data: object): Promise<PublishEventResponse | null> {
    // Validate input with Zod
    const parsed = PublishSchema.safeParse({ topic, data });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<PublishEventResponse>(async () => {
      return this.http.post<PublishEventResponse>('/events/publish', {
        topic,
        data,
        timestamp: new Date().toISOString(),
      });
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Publish an event with custom metadata
   *
   * @param topic - Event topic
   * @param data - Event payload
   * @param metadata - Additional metadata
   * @returns Published event confirmation
   */
  async publishWithMetadata(
    topic: string,
    data: object,
    metadata: {
      correlationId?: string;
      causationId?: string;
      priority?: 'high' | 'normal' | 'low';
      ttl?: number;
    }
  ): Promise<PublishEventResponse | null> {
    return this.safeCall<PublishEventResponse>(async () => {
      return this.http.post<PublishEventResponse>('/events/publish', {
        topic,
        data,
        timestamp: new Date().toISOString(),
        metadata,
      });
    });
  }

  /**
   * Publish multiple events in batch
   *
   * @param events - Array of events to publish
   * @returns Batch publish results
   */
  async publishBatch(
    events: Array<{ topic: string; data: object }>
  ): Promise<{
    success: boolean;
    results?: Array<{ topic: string; eventId?: string; error?: string }>;
    error?: ApiError;
  }> {
    return this.safeCall(async () => {
      return this.http.post<Array<{ topic: string; eventId?: string; error?: string }>>(
        '/events/publish/batch',
        { events }
      );
    });
  }

  // ============================================================================
  // Event Subscription
  // ============================================================================

  /**
   * Subscribe to an event topic with a handler function
   *
   * @param topic - Event topic to subscribe to
   * @param handler - Callback function to handle incoming events
   *
   * @example
   * ```typescript
   * // Subscribe to a specific topic
   * eventBus.subscribe('order.placed', (data) => {
   *   console.log('Order placed:', data);
   *   // Process the order...
   * });
   *
   * // Subscribe to wildcard pattern
   * eventBus.subscribe('user.*', (data) => {
   *   console.log('User event:', data);
   * });
   * ```
   */
  subscribe<T = unknown>(topic: string, handler: EventHandler<T>): () => void {
    const handlerId = `handler-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Store subscription
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    this.subscriptions.get(topic)?.add({ topic, handler, handlerId });

    // Store handler for WebSocket messages
    if (!this.eventHandlers.has(topic)) {
      this.eventHandlers.set(topic, []);
    }
    this.eventHandlers.get(topic)?.push(handler as EventHandler);

    // Send subscription to server for persistent subscriptions
    this.sendSubscriptionMessage(topic, 'subscribe');

    // Also try WebSocket connection for real-time events
    this.connectWebSocket().catch((error) => {
      console.error('[EventBus] WebSocket connection failed:', error);
    });

    // Return unsubscribe function
    return () => {
      this.unsubscribe(topic, handlerId);
    };
  }

  /**
   * Unsubscribe from an event topic
   *
   * @param topic - Event topic to unsubscribe from
   * @param handlerId - Optional specific handler ID to remove
   */
  unsubscribe(topic: string, handlerId?: string): void {
    // Remove from subscriptions map
    const subs = this.subscriptions.get(topic);
    if (subs) {
      if (handlerId) {
        for (const sub of subs) {
          if (sub.handlerId === handlerId) {
            subs.delete(sub);
            break;
          }
        }
      } else {
        // Remove all handlers for this topic
        subs.clear();
      }

      if (subs.size === 0) {
        this.subscriptions.delete(topic);
      }
    }

    // Remove from event handlers map
    const handlers = this.eventHandlers.get(topic);
    if (handlers && handlerId) {
      // For now, we can't easily identify specific handlers in the array
      // This would need refactoring to use a Map of handlerId -> handler
    }

    // Send unsubscribe to server
    this.sendSubscriptionMessage(topic, 'unsubscribe');
  }

  /**
   * Unsubscribe all handlers
   */
  unsubscribeAll(): void {
    for (const topic of this.subscriptions.keys()) {
      this.unsubscribe(topic);
    }
    this.eventHandlers.clear();
  }

  /**
   * Check if a topic has active subscriptions
   *
   * @param topic - Topic to check
   * @returns Whether the topic has active subscriptions
   */
  hasSubscription(topic: string): boolean {
    return (this.subscriptions.get(topic)?.size ?? 0) > 0;
  }

  /**
   * Get all subscribed topics
   *
   * @returns List of topics with active subscriptions
   */
  getSubscribedTopics(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  // ============================================================================
  // Event History
  // ============================================================================

  /**
   * Get historical events for a topic
   *
   * @param topic - Event topic to retrieve history for
   * @param limit - Maximum number of events to return (default: 20, max: 100)
   * @returns Historical event records
   *
   * @example
   * ```typescript
   * const history = await eventBus.getHistory('order.placed', 50);
   * for (const event of history.events) {
   *   console.log(`${event.publishedAt}:`, event.data);
   * }
   * ```
   */
  async getHistory(topic: string, limit?: number): Promise<EventHistoryResponse | null> {
    // Validate input with Zod
    const parsed = EventHistorySchema.safeParse({ topic, limit });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<EventHistoryResponse>(async () => {
      const params = new URLSearchParams({ topic });
      if (limit) params.set('limit', String(limit));
      return this.http.get<EventHistoryResponse>(`/events/history?${params.toString()}`);
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Get a specific event by ID
   *
   * @param eventId - Event's unique identifier
   * @returns Event details
   */
  async getEvent(eventId: string): Promise<{
    id: string;
    topic: string;
    data: Record<string, unknown>;
    publishedAt: string;
    metadata?: Record<string, unknown>;
  } | null> {
    return this.safeCall(async () => {
      return this.http.get<{
        id: string;
        topic: string;
        data: Record<string, unknown>;
        publishedAt: string;
        metadata?: Record<string, unknown>;
      }>(`/events/${eventId}`);
    });
  }

  /**
   * Search events by criteria
   *
   * @param params - Search parameters
   * @returns Matching events
   */
  async searchEvents(params: {
    topic?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<EventHistoryResponse | null> {
    return this.safeCall(async () => {
      const params_ = new URLSearchParams();
      if (params.topic) params_.set('topic', params.topic);
      if (params.startDate) params_.set('startDate', params.startDate);
      if (params.endDate) params_.set('endDate', params.endDate);
      if (params.limit) params_.set('limit', String(params.limit));
      if (params.offset) params_.set('offset', String(params.offset));
      return this.http.get<EventHistoryResponse>(`/events/search?${params_.toString()}`);
    });
  }

  // ============================================================================
  // Topic Management
  // ============================================================================

  /**
   * Create a new topic
   *
   * @param topic - Topic name
   * @param config - Topic configuration
   * @returns Success status
   */
  async createTopic(
    topic: string,
    config: {
      description?: string;
      retention?: number;
      partitions?: number;
      replicationFactor?: number;
    }
  ): Promise<{ success: boolean; error?: ApiError }> {
    return this.safeCall(async () => {
      return this.http.post<{ topicId: string }>('/topics', { name: topic, ...config });
    });
  }

  /**
   * Get topic information
   *
   * @param topic - Topic name
   * @returns Topic details
   */
  async getTopic(topic: string): Promise<{
    name: string;
    partitions: number;
    retention: number;
    messageCount: number;
    createdAt: string;
  } | null> {
    return this.safeCall(async () => {
      return this.http.get<{
        name: string;
        partitions: number;
        retention: number;
        messageCount: number;
        createdAt: string;
      }>(`/topics/${encodeURIComponent(topic)}`);
    });
  }

  /**
   * List all available topics
   *
   * @returns List of topics
   */
  async listTopics(): Promise<{ name: string; messageCount: number }[] | null> {
    return this.safeCall(async () => {
      return this.http.get<{ name: string; messageCount: number }[]>('/topics');
    });
  }

  /**
   * Delete a topic
   *
   * @param topic - Topic name
   * @returns Success status
   */
  async deleteTopic(topic: string): Promise<{ success: boolean; error?: ApiError }> {
    return this.safeCall(async () => {
      return this.http.delete<void>(`/topics/${encodeURIComponent(topic)}`);
    });
  }

  // ============================================================================
  // Consumer Group Management
  // ============================================================================

  /**
   * Create a consumer group
   *
   * @param groupId - Consumer group ID
   * @param topics - Topics to subscribe to
   * @param config - Consumer group configuration
   * @returns Created consumer group
   */
  async createConsumerGroup(
    groupId: string,
    topics: string[],
    config?: {
      autoOffsetReset?: 'earliest' | 'latest';
      enableAutoCommit?: boolean;
    }
  ): Promise<{ success: boolean; groupId?: string; error?: ApiError }> {
    return this.safeCall(async () => {
      return this.http.post<{ groupId: string }>('/consumer-groups', {
        groupId,
        topics,
        ...config,
      });
    });
  }

  /**
   * Join a consumer group and start consuming
   *
   * @param groupId - Consumer group ID
   * @param handler - Message handler function
   * @returns Consumer instance with control methods
   */
  async consume(
    groupId: string,
    handler: EventHandler
  ): Promise<{
    pause: () => void;
    resume: () => void;
    stop: () => Promise<void>;
  }> {
    // For HTTP-based consumption, we poll
    const pollingInterval = 1000;
    let isPaused = false;
    let isStopped = false;

    const poll = async (): Promise<void> => {
      while (!isStopped && !isPaused) {
        try {
          const result = await this.safeCall<{ messages: Array<{ topic: string; data: unknown; offset: string }> }>(
            async () => {
              return this.http.post<{ messages: Array<{ topic: string; data: unknown; offset: string }> }>(
                `/consumer-groups/${groupId}/consume`
              );
            }
          );

          if (result.success && result.data) {
            for (const message of result.data.messages) {
              await handler(message.data);
            }
          }
        } catch (error) {
          console.error('[EventBus] Consumer poll error:', error);
        }

        await new Promise((resolve) => setTimeout(resolve, pollingInterval));
      }
    };

    poll();

    return {
      pause: () => {
        isPaused = true;
      },
      resume: () => {
        isPaused = false;
      },
      stop: async () => {
        isStopped = true;
      },
    };
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  /**
   * Check if the event bus service is healthy
   *
   * @returns Health status
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number }> {
    const start = Date.now();
    try {
      const response = await this.http.get<{ status: string }>('/health');
      return {
        healthy: response.success,
        latency: Date.now() - start,
      };
    } catch {
      return { healthy: false };
    }
  }

  /**
   * Get connection status
   *
   * @returns WebSocket connection status
   */
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (this.webSocketConnection?.readyState === WebSocket.OPEN) {
      return 'connected';
    }
    if (this.isConnecting) {
      return 'connecting';
    }
    return 'disconnected';
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.unsubscribeAll();
    if (this.webSocketConnection) {
      this.webSocketConnection.close();
      this.webSocketConnection = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

let eventBusInstance: EventBusConnector | null = null;

/**
 * Get or create a singleton EventBusConnector instance
 *
 * @param config - Optional configuration override
 * @returns EventBusConnector instance
 */
export function createEventBusConnector(config?: EventBusConnectorConfig): EventBusConnector {
  if (!eventBusInstance) {
    eventBusInstance = new EventBusConnector(config);
  } else if (config) {
    eventBusInstance = new EventBusConnector(config);
  }
  return eventBusInstance;
}

/**
 * Reset the singleton instance (mainly for testing)
 */
export function resetEventBusConnector(): void {
  if (eventBusInstance) {
    eventBusInstance.destroy();
  }
  eventBusInstance = null;
}
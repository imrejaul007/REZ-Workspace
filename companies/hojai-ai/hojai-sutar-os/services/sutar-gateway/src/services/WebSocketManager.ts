// ============================================================================
// SUTAR Gateway - WebSocket Manager
// Real-time connection management
// ============================================================================

import { v4 as uuidv4 } from 'uuid';
import type { WebSocketConnection, ApiResponse } from '../types/index.js';

export interface WebSocketConfig {
  pingInterval: number;
  pongTimeout: number;
  maxConnections: number;
  messageQueueSize: number;
  reconnectAttempts: number;
  reconnectDelay: number;
}

export interface WebSocketMessage {
  id: string;
  type: 'text' | 'binary' | 'ping' | 'pong' | 'close';
  data: unknown;
  timestamp: string;
}

export interface WebSocketSession {
  id: string;
  serviceId: string;
  serviceName: string;
  url: string;
  connected: boolean;
  reconnectAttempts: number;
  lastMessage?: string;
  messageCount: number;
  createdAt: string;
  handlers: Map<string, (message: WebSocketMessage) => void>;
}

export class WebSocketManager {
  private connections: Map<string, WebSocketConnection> = new Map();
  private sessions: Map<string, WebSocketSession> = new Map();
  private config: WebSocketConfig;
  private listeners: Set<(event: WebSocketEvent) => void> = new Set();
  private pingTimers: Map<string, NodeJS.Timeout> = new Map();
  private messageQueues: Map<string, WebSocketMessage[]> = new Map();

  constructor(config?: Partial<WebSocketConfig>) {
    this.config = {
      pingInterval: config?.pingInterval ?? 30000,
      pongTimeout: config?.pongTimeout ?? 10000,
      maxConnections: config?.maxConnections ?? 1000,
      messageQueueSize: config?.messageQueueSize ?? 100,
      reconnectAttempts: config?.reconnectAttempts ?? 5,
      reconnectDelay: config?.reconnectDelay ?? 1000,
    };
  }

  // ---------------------------------------------------------------------------
  // Connection Management
  // ---------------------------------------------------------------------------

  createConnection(
    serviceId: string,
    serviceName: string,
    url: string,
    options?: {
      protocols?: string[];
      headers?: Record<string, string>;
    }
  ): ApiResponse<WebSocketConnection> {
    if (this.connections.size >= this.config.maxConnections) {
      return this.errorResponse('Maximum connections reached');
    }

    const connection: WebSocketConnection = {
      id: uuidv4(),
      serviceId,
      serviceName,
      url,
      protocols: options?.protocols,
      headers: options?.headers,
      connectedAt: new Date().toISOString(),
      messageCount: 0,
      status: 'connecting',
    };

    this.connections.set(connection.id, connection);

    // Create session
    const session: WebSocketSession = {
      id: connection.id,
      serviceId,
      serviceName,
      url,
      connected: false,
      reconnectAttempts: 0,
      messageCount: 0,
      createdAt: new Date().toISOString(),
      handlers: new Map(),
    };

    this.sessions.set(connection.id, session);
    this.messageQueues.set(connection.id, []);

    this.emit({
      type: 'connection_created',
      connectionId: connection.id,
      serviceId,
      timestamp: new Date().toISOString(),
    });

    return this.successResponse(connection, 'Connection created');
  }

  updateConnectionStatus(
    connectionId: string,
    status: WebSocketConnection['status']
  ): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.status = status;

      if (status === 'connected') {
        this.startPingTimer(connectionId);
      } else {
        this.stopPingTimer(connectionId);
      }
    }
  }

  closeConnection(connectionId: string): ApiResponse<{ connectionId: string }> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return this.errorResponse('Connection not found');
    }

    this.stopPingTimer(connectionId);
    this.connections.delete(connectionId);
    this.sessions.delete(connectionId);
    this.messageQueues.delete(connectionId);

    this.emit({
      type: 'connection_closed',
      connectionId,
      timestamp: new Date().toISOString(),
    });

    return this.successResponse({ connectionId }, 'Connection closed');
  }

  // ---------------------------------------------------------------------------
  // Message Handling
  // ---------------------------------------------------------------------------

  sendMessage(
    connectionId: string,
    data: unknown,
    type: 'text' | 'binary' = 'text'
  ): ApiResponse<{ messageId: string; queued: boolean }> {
    const session = this.sessions.get(connectionId);
    if (!session) {
      return this.errorResponse('Session not found');
    }

    const message: WebSocketMessage = {
      id: uuidv4(),
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    if (session.connected) {
      // In a real implementation, this would send via WebSocket
      session.messageCount++;
      const connection = this.connections.get(connectionId);
      if (connection) {
        connection.messageCount++;
        connection.lastMessage = new Date().toISOString();
      }

      this.emit({
        type: 'message_sent',
        connectionId,
        messageId: message.id,
        timestamp: new Date().toISOString(),
      });

      return this.successResponse({ messageId: message.id, queued: false });
    } else {
      // Queue message
      const queue = this.messageQueues.get(connectionId);
      if (queue) {
        if (queue.length >= this.config.messageQueueSize) {
          queue.shift(); // Remove oldest
        }
        queue.push(message);
        return this.successResponse({ messageId: message.id, queued: true });
      }

      return this.errorResponse('Message queue not available');
    }
  }

  receiveMessage(connectionId: string, message: WebSocketMessage): void {
    const session = this.sessions.get(connectionId);
    if (!session) return;

    session.messageCount++;
    session.lastMessage = message.timestamp;

    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.messageCount++;
      connection.lastMessage = message.timestamp;
    }

    // Emit message event
    this.emit({
      type: 'message_received',
      connectionId,
      messageId: message.id,
      messageType: message.type,
      timestamp: new Date().toISOString(),
    });

    // Call registered handlers
    const handlers = session.handlers.get(message.type);
    if (handlers) {
      handlers(message);
    }

    // Call wildcard handlers
    const wildcardHandlers = session.handlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers(message);
    }
  }

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  onMessage(
    connectionId: string,
    messageType: string,
    handler: (message: WebSocketMessage) => void
  ): void {
    const session = this.sessions.get(connectionId);
    if (session) {
      session.handlers.set(messageType, handler);
    }
  }

  offMessage(connectionId: string, messageType: string): void {
    const session = this.sessions.get(connectionId);
    if (session) {
      session.handlers.delete(messageType);
    }
  }

  // ---------------------------------------------------------------------------
  // Ping/Pong
  // ---------------------------------------------------------------------------

  private startPingTimer(connectionId: string): void {
    this.stopPingTimer(connectionId);

    const timer = setInterval(() => {
      const session = this.sessions.get(connectionId);
      if (session && session.connected) {
        this.sendMessage(connectionId, { type: 'ping' }, 'text');

        // Set pong timeout
        setTimeout(() => {
          const conn = this.connections.get(connectionId);
          if (conn && conn.status === 'connected') {
            // If no pong received, consider connection stale
            this.emit({
              type: 'pong_timeout',
              connectionId,
              timestamp: new Date().toISOString(),
            });
          }
        }, this.config.pongTimeout);
      }
    }, this.config.pingInterval);

    this.pingTimers.set(connectionId, timer);
  }

  private stopPingTimer(connectionId: string): void {
    const timer = this.pingTimers.get(connectionId);
    if (timer) {
      clearInterval(timer);
      this.pingTimers.delete(connectionId);
    }
  }

  // ---------------------------------------------------------------------------
  // Reconnection
  // ---------------------------------------------------------------------------

  attemptReconnect(connectionId: string): ApiResponse<{ reconnected: boolean }> {
    const session = this.sessions.get(connectionId);
    if (!session) {
      return this.errorResponse('Session not found');
    }

    if (session.reconnectAttempts >= this.config.reconnectAttempts) {
      return this.errorResponse('Max reconnection attempts reached');
    }

    session.reconnectAttempts++;

    this.emit({
      type: 'reconnect_attempt',
      connectionId,
      attempt: session.reconnectAttempts,
      timestamp: new Date().toISOString(),
    });

    // In a real implementation, this would attempt to reconnect
    // For now, we just simulate the process
    setTimeout(() => {
      this.updateConnectionStatus(connectionId, 'connected');
      session.connected = true;

      // Flush message queue
      const queue = this.messageQueues.get(connectionId);
      if (queue) {
        for (const message of queue) {
          this.sendMessage(connectionId, message.data, message.type as 'text' | 'binary');
        }
        queue.length = 0;
      }

      this.emit({
        type: 'reconnected',
        connectionId,
        timestamp: new Date().toISOString(),
      });
    }, this.config.reconnectDelay * session.reconnectAttempts);

    return this.successResponse({ reconnected: true });
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  getConnection(connectionId: string): ApiResponse<WebSocketConnection | null> {
    const connection = this.connections.get(connectionId);
    return this.successResponse(connection ?? null);
  }

  listConnections(filters?: {
    serviceId?: string;
    serviceName?: string;
    status?: WebSocketConnection['status'];
  }): ApiResponse<{ connections: WebSocketConnection[]; total: number }> {
    let connections = Array.from(this.connections.values());

    if (filters?.serviceId) {
      connections = connections.filter(c => c.serviceId === filters.serviceId);
    }
    if (filters?.serviceName) {
      connections = connections.filter(c => c.serviceName === filters.serviceName);
    }
    if (filters?.status) {
      connections = connections.filter(c => c.status === filters.status);
    }

    return this.successResponse({
      connections,
      total: connections.length,
    });
  }

  getSession(connectionId: string): ApiResponse<WebSocketSession | null> {
    const session = this.sessions.get(connectionId);
    return this.successResponse(session ?? null);
  }

  getMessageQueue(connectionId: string): ApiResponse<WebSocketMessage[]> {
    const queue = this.messageQueues.get(connectionId);
    return this.successResponse(queue ?? []);
  }

  // ---------------------------------------------------------------------------
  // Bulk Operations
  // ---------------------------------------------------------------------------

  closeAllConnections(): ApiResponse<{ closed: number }> {
    const count = this.connections.size;

    for (const connectionId of this.connections.keys()) {
      this.closeConnection(connectionId);
    }

    return this.successResponse({ closed: count });
  }

  closeConnectionsByService(serviceId: string): ApiResponse<{ closed: number }> {
    const toClose = Array.from(this.connections.values())
      .filter(c => c.serviceId === serviceId)
      .map(c => c.id);

    for (const connectionId of toClose) {
      this.closeConnection(connectionId);
    }

    return this.successResponse({ closed: toClose.length });
  }

  // ---------------------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------------------

  getStats(): ApiResponse<{
    totalConnections: number;
    byStatus: Record<WebSocketConnection['status'], number>;
    byService: Record<string, number>;
    totalMessages: number;
    queuedMessages: number;
  }> {
    const byStatus: Record<WebSocketConnection['status'], number> = {
      connecting: 0,
      connected: 0,
      disconnected: 0,
      error: 0,
    };

    const byService: Record<string, number> = {};
    let totalMessages = 0;
    let queuedMessages = 0;

    for (const connection of this.connections.values()) {
      byStatus[connection.status]++;
      byService[connection.serviceName] = (byService[connection.serviceName] ?? 0) + 1;
      totalMessages += connection.messageCount;
    }

    for (const queue of this.messageQueues.values()) {
      queuedMessages += queue.length;
    }

    return this.successResponse({
      totalConnections: this.connections.size,
      byStatus,
      byService,
      totalMessages,
      queuedMessages,
    });
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  private successResponse<T>(data: T, message?: string): ApiResponse<T> {
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  private errorResponse<T>(error: string): ApiResponse<T> {
    return { success: false, error, timestamp: new Date().toISOString() };
  }

  private emit(event: WebSocketEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[WebSocket] Event listener error:', error);
      }
    }
  }

  onEvent(listener: (event: WebSocketEvent) => void): void {
    this.listeners.add(listener);
  }

  offEvent(listener: (event: WebSocketEvent) => void): void {
    this.listeners.delete(listener);
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  destroy(): void {
    for (const timer of this.pingTimers.values()) {
      clearInterval(timer);
    }
    this.pingTimers.clear();
    this.connections.clear();
    this.sessions.clear();
    this.messageQueues.clear();
    this.listeners.clear();
  }
}

// ============================================================================
// Types and Singleton
// ============================================================================

export interface WebSocketEvent {
  type: 'connection_created' | 'connection_closed' | 'message_sent' | 'message_received' |
         'reconnect_attempt' | 'reconnected' | 'pong_timeout' | 'error';
  connectionId?: string;
  serviceId?: string;
  messageId?: string;
  messageType?: string;
  attempt?: number;
  error?: string;
  timestamp: string;
}

export const webSocketManager = new WebSocketManager();

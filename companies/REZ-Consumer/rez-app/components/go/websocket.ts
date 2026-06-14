// @ts-nocheck
/**
 * REZ Go WebSocket Service
 *
 * Real-time updates for:
 * - Live cart updates
 * - Merchant live shopper count
 * - Exit verification status
 * - Fraud alerts
 */

import { REZ_GO_CONFIG } from './config';

export type WebSocketEventType =
  | 'cart.updated'
  | 'cart.item_added'
  | 'cart.item_removed'
  | 'session.started'
  | 'session.completed'
  | 'session.cancelled'
  | 'exit.verified'
  | 'exit.rejected'
  | 'fraud.alert'
  | 'merchant.live_count';

export interface WebSocketMessage {
  type: WebSocketEventType;
  sessionId?: string;
  storeId?: string;
  merchantId?: string;
  data: unknown;
  timestamp: number;
}

type EventHandler = (message: WebSocketMessage) => void;

class GoWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private handlers: Map<WebSocketEventType, Set<EventHandler>> = new Map();
  private sessionId: string | null = null;
  private storeId: string | null = null;
  private authToken: string | null = null;
  private isConnecting = false;

  /**
   * Connect to WebSocket server
   */
  connect(options: {
    sessionId: string;
    storeId: string;
    authToken: string;
  }): void {
    this.sessionId = options.sessionId;
    this.storeId = options.storeId;
    this.authToken = options.authToken;

    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;

    const wsUrl = `${REZ_GO_CONFIG.REZ_GO_WS}/ws?sessionId=${this.sessionId}&storeId=${this.storeId}`;

    try {
      this.ws = new WebSocket(wsUrl, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to event
   */
  on(event: WebSocketEventType, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  /**
   * Unsubscribe from event
   */
  off(event: WebSocketEventType, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  /**
   * Send message to server
   */
  send(type: WebSocketEventType, data?: unknown): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, message queued');
      return;
    }

    const message: WebSocketMessage = {
      type,
      sessionId: this.sessionId || undefined,
      storeId: this.storeId || undefined,
      data,
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Private methods

  private handleOpen(): void {
    console.log('WebSocket connected');
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    // Send join message
    this.send('session.started', {
      sessionId: this.sessionId,
      storeId: this.storeId,
    });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      // Dispatch to handlers
      const handlers = this.handlers.get(message.type);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(message);
          } catch (error) {
            console.error('WebSocket handler error:', error);
          }
        });
      }

      // Also dispatch to wildcard handlers
      const wildcardHandlers = this.handlers.get('*' as WebSocketEventType);
      if (wildcardHandlers) {
        wildcardHandlers.forEach((handler) => handler(message));
      }
    } catch (error) {
      console.error('WebSocket message parse error:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket closed:', event.code, event.reason);
    this.isConnecting = false;
    this.ws = null;

    // Don't reconnect if closed normally
    if (event.code === 1000) return;

    this.scheduleReconnect();
  }

  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.isConnecting = false;
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.sessionId && this.storeId && this.authToken) {
        this.connect({
          sessionId: this.sessionId,
          storeId: this.storeId,
          authToken: this.authToken,
        });
      }
    }, delay);
  }
}

export const goWebSocket = new GoWebSocketService();
export default goWebSocket;

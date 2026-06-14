import logger from './utils/logger';

/**
 * WebSocket Service
 * Real-time communication with Do backend
 */

import { useChatStore } from '@/stores';
import { useUserStore } from '@/stores';

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'heartbeat' | 'connected' | 'error';
  payload?: {
    text?: string;
    location?: { lat: number; lng: number };
    isTyping?: boolean;
    messages?: unknown[];
    sessionId?: string;
    userId?: string;
    timestamp?: number;
    code?: string;
    message?: string;
  };
}

export interface WebSocketOptions {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: string) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onTyping?: (isTyping: boolean) => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private options: WebSocketOptions = {};
  private isConnecting = false;

  /**
   * Connect to WebSocket server
   */
  connect(options: WebSocketOptions = {}): void {
    this.options = options;

    const { token } = useUserStore.getState();
    const { sessionId } = useChatStore.getState();

    if (!token) {
      this.options.onError?.('No authentication token');
      return;
    }

    const wsUrl = process.env.EXPO_PUBLIC_DO_WS_URL || 'ws://localhost:3000/stream';
    const url = `${wsUrl}?token=${encodeURIComponent(token)}&sessionId=${encodeURIComponent(sessionId)}`;

    if (this.ws?.readyState === WebSocket.OPEN) {
      logger.info('WebSocket already connected');
      return;
    }

    if (this.isConnecting) {
      logger.info('WebSocket connection in progress...');
      return;
    }

    this.isConnecting = true;
    this.url = url;

    console.log('Connecting to WebSocket:', wsUrl);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      logger.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.options.onError?.('Failed to connect');
    }
  }

  /**
   * Handle WebSocket open
   */
  private handleOpen(): void {
    logger.info('WebSocket connected');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    this.options.onConnected?.();
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'connected':
          console.log('WebSocket authenticated:', message.payload);
          this.options.onMessage?.(message);
          break;

        case 'typing':
          this.options.onTyping?.(message.payload?.isTyping ?? false);
          useChatStore.getState().setTyping(message.payload?.isTyping ?? false);
          break;

        case 'message':
          if (message.payload?.messages) {
            // Add messages to chat store
            const store = useChatStore.getState();
            message.payload.messages.forEach((msg) => {
              store.addMessage({
                id: msg.id || `msg-${Date.now()}`,
                type: 'do',
                content: msg.content || msg.text,
                timestamp: new Date(msg.timestamp || Date.now()),
                status: 'delivered',
              });
            });
          }
          this.options.onMessage?.(message);
          break;

        case 'error':
          logger.error('WebSocket error:', message.payload);
          this.options.onError?.(message.payload?.message || 'Unknown error');
          break;

        case 'heartbeat':
          // Server acknowledged heartbeat
          break;

        default:
          this.options.onMessage?.(message);
      }
    } catch (error) {
      logger.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close
   */
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket closed:', event.code, event.reason);
    this.isConnecting = false;
    this.stopHeartbeat();
    this.options.onDisconnected?.();

    // Attempt reconnection if not intentionally closed
    if (event.code !== 1000 && event.code !== 1008) {
      this.attemptReconnect();
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleError(event: Event): void {
    logger.error('WebSocket error:', event);
    this.isConnecting = false;
    this.options.onError?.('Connection error');
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.info('Max reconnection attempts reached');
      this.options.onError?.('Failed to reconnect');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect(this.options);
    }, delay);
  }

  /**
   * Send a message
   */
  send(text: string, location?: { lat: number; lng: number }): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      logger.warn('WebSocket not connected');
      return;
    }

    const message: WebSocketMessage = {
      type: 'message',
      payload: {
        text,
        location,
      },
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send typing indicator
   */
  sendTyping(isTyping: boolean): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    const message: WebSocketMessage = {
      type: 'typing',
      payload: { isTyping },
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.stopHeartbeat();
    this.maxReconnectAttempts = 0; // Prevent reconnection

    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService;

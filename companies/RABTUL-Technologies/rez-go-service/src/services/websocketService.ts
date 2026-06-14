/**
 * REZ Go WebSocket Service
 *
 * Real-time updates for:
 * - Live cart updates
 * - Merchant live shopper count
 * - Exit verification status
 * - Fraud alerts
 */

import { WebSocketServer, WebSocket, RawData } from 'ws';
import { Server, IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { sessionService } from './sessionService.js';

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
  userId?: string;
  data: unknown;
  timestamp: number;
}

interface ConnectedClient {
  ws: WebSocket;
  sessionId?: string;
  storeId?: string;
  merchantId?: string;
  userId?: string;
  role: 'customer' | 'merchant' | 'staff';
}

class GoWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ConnectedClient> = new Map();
  private storeSessions: Map<string, Set<string>> = new Map(); // storeId -> Set<clientId>
  private merchantClients: Map<string, Set<string>> = new Map(); // merchantId -> Set<clientId>

  /**
   * Initialize WebSocket server
   */
  initialize(server: Server): void {
    this.wss = new WebSocketServer({
      server,
      path: '/ws',
    });

    this.wss.on('connection', this.handleConnection.bind(this));

    console.log('WebSocket server initialized on /ws');

    // Cleanup interval
    setInterval(() => this.cleanupStaleConnections(), 60000); // Every minute
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, request: IncomingMessage): void {
    const clientId = this.generateClientId();
    const url = new URL(request.url, `http://${request.headers.host}`);

    // Extract query params
    const sessionId = url.searchParams.get('sessionId') || undefined;
    const storeId = url.searchParams.get('storeId') || undefined;
    const merchantId = url.searchParams.get('merchantId') || undefined;
    const token = request.headers.authorization?.replace('Bearer ', '');

    // Authenticate
    let userId: string | undefined;
    let role: 'customer' | 'merchant' | 'staff' = 'customer';

    if (token) {
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as any;
        userId = decoded.sub;
        role = decoded.role || 'customer';
      } catch {
        // Invalid token, connection will be closed
        ws.close(4001, 'Invalid token');
        return;
      }
    }

    // Store client
    const client: ConnectedClient = {
      ws,
      sessionId,
      storeId,
      merchantId,
      userId,
      role,
    };
    this.clients.set(clientId, client);

    // Track by store
    if (storeId) {
      if (!this.storeSessions.has(storeId)) {
        this.storeSessions.set(storeId, new Set());
      }
      this.storeSessions.get(storeId)!.add(clientId);
    }

    // Track by merchant
    if (merchantId) {
      if (!this.merchantClients.has(merchantId)) {
        this.merchantClients.set(merchantId, new Set());
      }
      this.merchantClients.get(merchantId)!.add(clientId);

      // Send current live count
      this.sendToClient(clientId, {
        type: 'merchant.live_count',
        storeId,
        merchantId,
        data: {
          liveCount: this.getStoreLiveCount(storeId!),
        },
        timestamp: Date.now(),
      });
    }

    // Handle messages
    ws.on('message', (data: RawData) => this.handleMessage(clientId, data));

    // Handle close
    ws.on('close', () => this.handleClose(clientId));

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      this.handleClose(clientId);
    });

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'session.started',
      sessionId,
      storeId,
      data: { clientId, connected: true },
      timestamp: Date.now(),
    });

    console.log(`Client connected: ${clientId} (role: ${role}, user: ${userId})`);
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(clientId: string, data: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const message: WebSocketMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'cart.item_added':
          await this.handleCartUpdate(clientId, message);
          break;
        case 'cart.item_removed':
          await this.handleCartUpdate(clientId, message);
          break;
        case 'cart.updated':
          await this.handleCartUpdate(clientId, message);
          break;
        case 'exit.verified':
          await this.handleExitVerified(clientId, message);
          break;
        case 'fraud.alert':
          await this.handleFraudAlert(clientId, message);
          break;
        default:
          console.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`Error handling message from ${clientId}:`, error);
    }
  }

  /**
   * Handle cart update - broadcast to relevant clients
   */
  private async handleCartUpdate(clientId: string, message: WebSocketMessage): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client || !client.sessionId) return;

    // Update session in database
    try {
      await sessionService.touchSession(client.sessionId);
    } catch (error) {
      console.error('Error updating session:', error);
    }

    // Broadcast to merchant
    if (client.storeId) {
      const merchantClients = this.merchantClients.get(client.merchantId || '');
      if (merchantClients) {
        for (const merchantClientId of merchantClients) {
          this.sendToClient(merchantClientId, {
            type: 'cart.updated',
            sessionId: client.sessionId,
            storeId: client.storeId,
            userId: client.userId,
            data: message.data,
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  /**
   * Handle exit verified - notify merchant
   */
  private async handleExitVerified(clientId: string, message: WebSocketMessage): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client || !client.sessionId) return;

    // Broadcast to merchant
    if (client.merchantId) {
      const merchantClients = this.merchantClients.get(client.merchantId);
      if (merchantClients) {
        for (const merchantClientId of merchantClients) {
          this.sendToClient(merchantClientId, {
            type: 'exit.verified',
            sessionId: client.sessionId,
            storeId: client.storeId,
            data: {
              sessionId: client.sessionId,
              userId: client.userId,
              ...(message.data as Record<string, unknown>),
            },
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  /**
   * Handle fraud alert - notify merchant
   */
  private async handleFraudAlert(clientId: string, message: WebSocketMessage): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client || !client.sessionId) return;

    // Broadcast to merchant
    if (client.merchantId) {
      const merchantClients = this.merchantClients.get(client.merchantId);
      if (merchantClients) {
        for (const merchantClientId of merchantClients) {
          this.sendToClient(merchantClientId, {
            type: 'fraud.alert',
            sessionId: client.sessionId,
            storeId: client.storeId,
            data: {
              sessionId: client.sessionId,
              userId: client.userId,
              ...(message.data as Record<string, unknown>),
            },
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  /**
   * Handle client close
   */
  private handleClose(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from store tracking
    if (client.storeId) {
      this.storeSessions.get(client.storeId)?.delete(clientId);
      if (this.storeSessions.get(client.storeId)?.size === 0) {
        this.storeSessions.delete(client.storeId);
      }
    }

    // Remove from merchant tracking
    if (client.merchantId) {
      this.merchantClients.get(client.merchantId)?.delete(clientId);
      if (this.merchantClients.get(client.merchantId)?.size === 0) {
        this.merchantClients.delete(client.merchantId);
      }
    }

    this.clients.delete(clientId);
    console.log(`Client disconnected: ${clientId}`);
  }

  /**
   * Cleanup stale connections
   */
  private cleanupStaleConnections(): void {
    for (const [clientId, client] of this.clients) {
      if (client.ws.readyState !== WebSocket.OPEN) {
        this.handleClose(clientId);
      }
    }
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;

    client.ws.send(JSON.stringify(message));
  }

  /**
   * Broadcast to all clients watching a store
   */
  broadcastToStore(storeId: string, message: WebSocketMessage): void {
    const clientIds = this.storeSessions.get(storeId);
    if (!clientIds) return;

    for (const clientId of clientIds) {
      this.sendToClient(clientId, message);
    }
  }

  /**
   * Broadcast to all merchant clients
   */
  broadcastToMerchant(merchantId: string, message: WebSocketMessage): void {
    const clientIds = this.merchantClients.get(merchantId);
    if (!clientIds) return;

    for (const clientId of clientIds) {
      this.sendToClient(clientId, message);
    }
  }

  /**
   * Get live session count for a store
   */
  getStoreLiveCount(storeId: string): number {
    return this.storeSessions.get(storeId)?.size || 0;
  }

  /**
   * Get total connected clients
   */
  getTotalClients(): number {
    return this.clients.size;
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const goWebSocketServer = new GoWebSocketServer();
export default goWebSocketServer;

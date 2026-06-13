/**
 * WebSocket Service
 *
 * Manages real-time WebSocket connections for rider updates
 */

import { WebSocket, WebSocketServer } from 'ws';
import { createLogger } from '../utils/logger';

const logger = createLogger('websocket-service');

export interface ClientSubscription {
  clientId: string;
  riderId: string;
  connectedAt: string;
}

export interface BroadcastMessage {
  type: string;
  rider_id: string;
  event: Record<string, any>;
  timestamp: string;
}

/**
 * WebSocket Service for real-time rider updates
 */
export class WebSocketService {
  private clients: Map<string, { ws: WebSocket; subscription: ClientSubscription }> = new Map();
  private wss: WebSocketServer | null = null;

  constructor() {
    logger.info('websocket_service_initialized');
  }

  /**
   * Set the WebSocket server instance
   */
  setServer(wss: WebSocketServer): void {
    this.wss = wss;
  }

  /**
   * Register a new client connection
   */
  registerClient(clientId: string, ws: WebSocket, riderId?: string): ClientSubscription {
    const subscription: ClientSubscription = {
      clientId,
      riderId: riderId || '',
      connectedAt: new Date().toISOString(),
    };

    this.clients.set(clientId, { ws, subscription });

    logger.info('ws_client_registered', {
      clientId,
      riderId: subscription.riderId,
      totalClients: this.clients.size,
    });

    return subscription;
  }

  /**
   * Unregister a client
   */
  unregisterClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      logger.info('ws_client_unregistered', {
        clientId,
        riderId: client.subscription.riderId,
        remainingClients: this.clients.size,
      });
    }
  }

  /**
   * Subscribe a client to a rider's updates
   */
  subscribeToRider(clientId: string, riderId: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    client.subscription.riderId = riderId;
    logger.info('ws_client_subscribed', { clientId, riderId });

    return true;
  }

  /**
   * Send a message to a specific client
   */
  sendToClient(clientId: string, message: BroadcastMessage): boolean {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error('ws_send_error', { clientId, error });
      return false;
    }
  }

  /**
   * Broadcast to all clients subscribed to a specific rider
   */
  broadcastToRider(riderId: string, event: Record<string, any>): number {
    let sent = 0;
    const message: BroadcastMessage = {
      type: 'rider_update',
      rider_id: riderId,
      event,
      timestamp: new Date().toISOString(),
    };

    for (const [clientId, client] of this.clients) {
      if (client.subscription.riderId === riderId && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(JSON.stringify(message));
          sent++;
        } catch (error) {
          logger.error('ws_broadcast_error', { clientId, error });
        }
      }
    }

    if (sent > 0) {
      logger.debug('ws_broadcast_sent', { riderId, sent, total: this.clients.size });
    }

    return sent;
  }

  /**
   * Broadcast to all connected clients
   */
  broadcastToAll(message: BroadcastMessage): number {
    let sent = 0;

    for (const [clientId, client] of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(JSON.stringify(message));
          sent++;
        } catch (error) {
          logger.error('ws_broadcast_error', { clientId, error });
        }
      }
    }

    return sent;
  }

  /**
   * Get active client count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get clients subscribed to a specific rider
   */
  getRiderSubscribers(riderId: string): string[] {
    const subscribers: string[] = [];
    for (const [clientId, client] of this.clients) {
      if (client.subscription.riderId === riderId) {
        subscribers.push(clientId);
      }
    }
    return subscribers;
  }

  /**
   * Clean up disconnected clients
   */
  cleanup(): number {
    let cleaned = 0;
    for (const [clientId, client] of this.clients) {
      if (client.ws.readyState !== WebSocket.OPEN) {
        this.clients.delete(clientId);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      logger.info('ws_clients_cleaned', { cleaned, remaining: this.clients.size });
    }
    return cleaned;
  }
}

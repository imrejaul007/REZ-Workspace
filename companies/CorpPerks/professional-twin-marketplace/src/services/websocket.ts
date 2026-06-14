/**
 * WebSocket Server - Real-time Updates
 *
 * Provides real-time communication for:
 * - Live notifications (hire requests, approvals)
 * - Marketplace updates (new twins, price changes)
 * - Twin learning updates
 * - Presence indicators
 */

import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'twin-marketplace-jwt-secret';

// Types
interface Client {
  ws: WebSocket;
  userId: string;
  corpId: string;
  subscriptions: Set<string>;
  connectedAt: Date;
}

interface Event {
  type: string;
  data: any;
  timestamp: Date;
}

// Client connections
const clients = new Map<string, Client>();
const userConnections = new Map<string, Set<string>>(); // userId -> Set of clientIds

// Event handlers
const eventHandlers = new Map<string, Set<(event: Event) => void>>();

// Broadcast channels
const channels = new Map<string, Set<string>>(); // channel -> Set of clientIds

// =============================================================================
// SERVER SETUP
// =============================================================================

export function createWebSocketServer(server: any) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  logger.info('🔌 WebSocket server started on /ws');

  wss.on('connection', (ws: WebSocket, req) => {
    const clientId = generateClientId();
    const client: Client = {
      ws,
      userId: '',
      corpId: '',
      subscriptions: new Set(),
      connectedAt: new Date()
    };

    clients.set(clientId, client);

    logger.info(`📡 Client connected: ${clientId}`);

    // Handle messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(clientId, message);
      } catch (error) {
        logger.error('WebSocket message error:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      handleDisconnect(clientId);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error(`WebSocket error for ${clientId}:`, error);
    });

    // Send welcome message
    sendToClient(clientId, {
      type: 'CONNECTED',
      data: { clientId, timestamp: new Date() }
    });
  });

  // Start heartbeat
  startHeartbeat(wss);

  return wss;
}

// =============================================================================
// MESSAGE HANDLING
// =============================================================================

function handleMessage(clientId: string, message: any) {
  const client = clients.get(clientId);
  if (!client) return;

  switch (message.type) {
    case 'AUTHENTICATE':
      handleAuth(clientId, message.token);
      break;

    case 'SUBSCRIBE':
      handleSubscribe(clientId, message.channel);
      break;

    case 'UNSUBSCRIBE':
      handleUnsubscribe(clientId, message.channel);
      break;

    case 'PING':
      sendToClient(clientId, { type: 'PONG', data: { timestamp: new Date() } });
      break;

    case 'TWIN_LEARNED':
      handleTwinLearned(clientId, message.data);
      break;

    case 'HIRE_REQUEST':
      handleHireRequest(clientId, message.data);
      break;

    default:
      logger.info(`Unknown message type: ${message.type}`);
  }
}

function handleAuth(clientId: string, token: string) {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const client = clients.get(clientId);
    if (!client) return;

    client.userId = payload.userId;
    client.corpId = payload.corpId;

    // Track user connections
    if (!userConnections.has(payload.userId)) {
      userConnections.set(payload.userId, new Set());
    }
    userConnections.get(payload.userId)!.add(clientId);

    // Auto-subscribe to personal channel
    const personalChannel = `user:${payload.userId}`;
    handleSubscribe(clientId, personalChannel);

    sendToClient(clientId, {
      type: 'AUTHENTICATED',
      data: { userId: payload.userId, corpId: payload.corpId }
    });

    logger.info(`🔑 Client ${clientId} authenticated as ${payload.userId}`);
  } catch (error) {
    sendToClient(clientId, {
      type: 'AUTH_ERROR',
      data: { error: 'Invalid token' }
    });
  }
}

function handleSubscribe(clientId: string, channel: string) {
  const client = clients.get(clientId);
  if (!client) return;

  client.subscriptions.add(channel);

  if (!channels.has(channel)) {
    channels.set(channel, new Set());
  }
  channels.get(channel)!.add(clientId);

  sendToClient(clientId, {
    type: 'SUBSCRIBED',
    data: { channel }
  });

  logger.info(`📢 Client ${clientId} subscribed to ${channel}`);
}

function handleUnsubscribe(clientId: string, channel: string) {
  const client = clients.get(clientId);
  if (!client) return;

  client.subscriptions.delete(channel);
  channels.get(channel)?.delete(clientId);

  sendToClient(clientId, {
    type: 'UNSUBSCRIBED',
    data: { channel }
  });
}

function handleDisconnect(clientId: string) {
  const client = clients.get(clientId);
  if (!client) return;

  // Remove from all channels
  for (const channel of client.subscriptions) {
    channels.get(channel)?.delete(clientId);
  }

  // Remove from user connections
  if (client.userId) {
    userConnections.get(client.userId)?.delete(clientId);
    if (userConnections.get(client.userId)?.size === 0) {
      userConnections.delete(client.userId);
    }
  }

  clients.delete(clientId);
  logger.info(`📴 Client disconnected: ${clientId}`);
}

// =============================================================================
// EVENT BROADCASTING
// =============================================================================

/**
 * Broadcast event to all clients in a channel
 */
export function broadcastToChannel(channel: string, event: Event) {
  const channelClients = channels.get(channel);
  if (!channelClients) return;

  const message = JSON.stringify(event);
  for (const clientId of channelClients) {
    const client = clients.get(clientId);
    if (client?.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

/**
 * Send event to specific user (all their connections)
 */
export function broadcastToUser(userId: string, event: Event) {
  const userClientIds = userConnections.get(userId);
  if (!userClientIds) return;

  const message = JSON.stringify(event);
  for (const clientId of userClientIds) {
    const client = clients.get(clientId);
    if (client?.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

/**
 * Send event to specific client
 */
export function sendToClient(clientId: string, event: Event) {
  const client = clients.get(clientId);
  if (!client || client.ws.readyState !== WebSocket.OPEN) return;

  client.ws.send(JSON.stringify(event));
}

// =============================================================================
// PREDEFINED EVENTS
// =============================================================================

/**
 * Notify employee of new hire request
 */
export function notifyHireRequest(employeeCorpId: string, request: any) {
  broadcastToUser(employeeCorpId, {
    type: 'HIRE_REQUEST',
    data: {
      twinId: request.twinId,
      companyName: request.companyName,
      accessType: request.accessType,
      timestamp: new Date()
    },
    timestamp: new Date()
  });

  // Also broadcast to marketplace-admins
  broadcastToChannel('marketplace-admins', {
    type: 'HIRE_REQUEST_CREATED',
    data: request,
    timestamp: new Date()
  });
}

/**
 * Notify company of hire approval/rejection
 */
export function notifyHireResponse(companyId: string, response: any) {
  broadcastToUser(companyId, {
    type: 'HIRE_RESPONSE',
    data: response,
    timestamp: new Date()
  });
}

/**
 * Notify about twin learning progress
 */
export function notifyTwinLearned(corpId: string, data: any) {
  broadcastToUser(corpId, {
    type: 'TWIN_LEARNED',
    data: {
      twinId: data.twinId,
      skill: data.skill,
      metrics: data.metrics,
      progress: data.progress
    },
    timestamp: new Date()
  });
}

/**
 * Notify marketplace of new twin
 */
export function notifyNewTwin(twin: any) {
  broadcastToChannel('marketplace', {
    type: 'NEW_TWIN',
    data: twin,
    timestamp: new Date()
  });
}

/**
 * Notify about twin metrics update
 */
export function notifyTwinMetrics(twinId: string, metrics: any) {
  broadcastToChannel('marketplace', {
    type: 'TWIN_METRICS_UPDATED',
    data: { twinId, metrics },
    timestamp: new Date()
  });

  // Also notify owner
  const ownerId = twinId.split('-').slice(0, 3).join('-');
  broadcastToUser(ownerId, {
    type: 'TWIN_METRICS_UPDATED',
    data: { twinId, metrics },
    timestamp: new Date()
  });
}

/**
 * Notify about subscription changes
 */
export function notifySubscriptionChange(userId: string, subscription: any) {
  broadcastToUser(userId, {
    type: 'SUBSCRIPTION_CHANGED',
    data: subscription,
    timestamp: new Date()
  });
}

/**
 * Notify about privacy settings change
 */
export function notifyPrivacyChange(corpId: string, twinId: string, privacy: any) {
  broadcastToUser(corpId, {
    type: 'PRIVACY_CHANGED',
    data: { twinId, privacy },
    timestamp: new Date()
  });

  // Notify companies that had access
  if (!privacy.shareWithCurrentEmployer) {
    broadcastToChannel('marketplace', {
      type: 'TWIN_PRIVACY_CHANGED',
      data: { twinId, privacyChanged: true },
      timestamp: new Date()
    });
  }
}

/**
 * System-wide notification
 */
export function notifySystem(message: string, type: 'info' | 'warning' | 'error' = 'info') {
  const event = {
    type: 'SYSTEM_NOTIFICATION',
    data: { message, notificationType: type },
    timestamp: new Date()
  };

  for (const [, client] of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(event));
    }
  }
}

// =============================================================================
// PRESENCE
// =============================================================================

/**
 * Get online users
 */
export function getOnlineUsers(): string[] {
  return Array.from(userConnections.keys());
}

/**
 * Get user connection count
 */
export function getUserConnectionCount(userId: string): number {
  return userConnections.get(userId)?.size || 0;
}

/**
 * Get total connections
 */
export function getTotalConnections(): number {
  return clients.size;
}

/**
 * Get online users in a channel
 */
export function getChannelUsers(channel: string): string[] {
  const channelClients = channels.get(channel);
  if (!channelClients) return [];

  const users: string[] = [];
  for (const clientId of channelClients) {
    const client = clients.get(clientId);
    if (client?.userId) {
      users.push(client.userId);
    }
  }
  return users;
}

// =============================================================================
// HEARTBEAT
// =============================================================================

function startHeartbeat(wss: WebSocketServer) {
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if ((ws as any).isAlive === false) {
        return ws.terminate();
      }

      (ws as any).isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });
}

// =============================================================================
// HELPERS
// =============================================================================

function generateClientId(): string {
  return `CL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// =============================================================================
// EVENT TYPES
// =============================================================================

export const WS_EVENTS = {
  // Connection
  CONNECTED: 'CONNECTED',
  AUTHENTICATED: 'AUTHENTICATED',
  AUTH_ERROR: 'AUTH_ERROR',
  DISCONNECTED: 'DISCONNECTED',

  // Subscriptions
  SUBSCRIBED: 'SUBSCRIBED',
  UNSUBSCRIBED: 'UNSUBSCRIBED',

  // Marketplace
  NEW_TWIN: 'NEW_TWIN',
  TWIN_METRICS_UPDATED: 'TWIN_METRICS_UPDATED',
  TWIN_PRIVACY_CHANGED: 'TWIN_PRIVACY_CHANGED',

  // Hiring
  HIRE_REQUEST: 'HIRE_REQUEST',
  HIRE_RESPONSE: 'HIRE_RESPONSE',
  HIRE_REQUEST_CREATED: 'HIRE_REQUEST_CREATED',

  // Learning
  TWIN_LEARNED: 'TWIN_LEARNED',
  LEARNING_PROGRESS: 'LEARNING_PROGRESS',

  // Subscription
  SUBSCRIPTION_CHANGED: 'SUBSCRIPTION_CHANGED',

  // System
  SYSTEM_NOTIFICATION: 'SYSTEM_NOTIFICATION',
  PONG: 'PONG'
};

export default {
  createWebSocketServer,
  broadcastToChannel,
  broadcastToUser,
  sendToClient,
  notifyHireRequest,
  notifyHireResponse,
  notifyTwinLearned,
  notifyNewTwin,
  notifyTwinMetrics,
  notifySubscriptionChange,
  notifyPrivacyChange,
  notifySystem,
  getOnlineUsers,
  getUserConnectionCount,
  getTotalConnections,
  getChannelUsers,
  WS_EVENTS
};

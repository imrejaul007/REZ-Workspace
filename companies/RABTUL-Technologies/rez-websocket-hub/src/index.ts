import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { connectionManager } from './services/connectionManager.js';
import { channelService } from './services/channelService.js';
import { wsAuthenticate, JWTAuthError } from './middleware/auth.js';
import wsRoutes from './routes/ws.routes.js';
import type {
  WebSocketClient,
  IncomingWSMessage,
  OutgoingWSMessage,
  AuthenticatedUser,
} from './types/index.js';

const PORT = process.env.PORT || 4024;
const WS_PATH = process.env.WS_PATH || '/ws';
const PING_INTERVAL = parseInt(process.env.PING_INTERVAL || '30000', 10);
const PING_TIMEOUT = parseInt(process.env.PING_TIMEOUT || '10000', 10);
const MAX_MESSAGE_SIZE = parseInt(process.env.MAX_MESSAGE_SIZE || '1048576', 10);

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/ws', wsRoutes);

app.get('/', (_req, res) => {
  res.json({
    name: 'ReZ WebSocket Hub',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      websocket: `/ws?token=<JWT_TOKEN>`,
      api: '/api/ws',
      health: '/api/ws/health',
      stats: '/api/ws/stats',
    },
    timestamp: Date.now(),
  });
});

const server = createServer(app);

const wss = new WebSocketServer({
  server,
  path: WS_PATH,
  maxPayload: MAX_MESSAGE_SIZE,
});

console.log(`[WS] WebSocket server initializing on path: ${WS_PATH}`);

function sendToClient(client: WebSocketClient, message: OutgoingWSMessage): void {
  if (client.readyState === WebSocket.OPEN) {
    try {
      client.send(JSON.stringify(message));
      connectionManager.incrementMessageCount();
    } catch (error) {
      console.error(`[WS] Failed to send message to ${client.connectionId}:`, error);
    }
  }
}

function sendError(client: WebSocketClient, error: string, messageId?: string): void {
  sendToClient(client, {
    type: 'error',
    payload: { error },
    timestamp: Date.now(),
    messageId,
  });
}

function sendAck(client: WebSocketClient, messageId: string): void {
  sendToClient(client, {
    type: 'ack',
    payload: { messageId },
    timestamp: Date.now(),
    messageId,
  });
}

function handleSubscribe(client: WebSocketClient, channel: string, messageId?: string): void {
  const result = channelService.subscribe(client.connectionId, channel);

  if (!result.success) {
    sendError(client, result.error || 'Subscribe failed', messageId);
    return;
  }

  sendToClient(client, {
    type: 'subscribe',
    payload: { channel, status: 'subscribed' },
    timestamp: Date.now(),
    messageId,
  });
}

function handleUnsubscribe(client: WebSocketClient, channel: string, messageId?: string): void {
  const result = channelService.unsubscribe(client.connectionId, channel);

  if (!result.success) {
    sendError(client, result.error || 'Unsubscribe failed', messageId);
    return;
  }

  sendToClient(client, {
    type: 'unsubscribe',
    payload: { channel, status: 'unsubscribed' },
    timestamp: Date.now(),
    messageId,
  });
}

function handleBroadcast(client: WebSocketClient, channel: string, message: unknown, messageId?: string): void {
  if (!channel) {
    sendError(client, 'Channel is required for broadcast', messageId);
    return;
  }

  if (!client.subscribedChannels.has(channel)) {
    sendError(client, 'Not subscribed to this channel', messageId);
    return;
  }

  const deliveredCount = channelService.broadcast(channel, message, client.connectionId);

  sendToClient(client, {
    type: 'ack',
    payload: { messageId, deliveredCount, channel },
    timestamp: Date.now(),
    messageId,
  });
}

function handlePrivate(
  client: WebSocketClient,
  targetUserId: string,
  message: unknown,
  messageId?: string
): void {
  if (!targetUserId) {
    sendError(client, 'Target user ID is required', messageId);
    return;
  }

  const deliveredCount = channelService.sendToUser(targetUserId, message, client.connectionId);

  if (deliveredCount === 0) {
    sendError(client, 'User not found or offline', messageId);
    return;
  }

  sendToClient(client, {
    type: 'ack',
    payload: { messageId, deliveredCount },
    timestamp: Date.now(),
    messageId,
  });
}

function handleGlobalBroadcast(client: WebSocketClient, message: unknown, messageId?: string): void {
  const deliveredCount = channelService.broadcastToAll(message, client.connectionId);

  sendToClient(client, {
    type: 'ack',
    payload: { messageId, deliveredCount },
    timestamp: Date.now(),
    messageId,
  });
}

function handlePing(client: WebSocketClient, messageId?: string): void {
  sendToClient(client, {
    type: 'pong',
    payload: { timestamp: Date.now() },
    timestamp: Date.now(),
    messageId,
  });
}

function handlePresence(client: WebSocketClient, messageId?: string): void {
  const channels = Array.from(client.subscribedChannels);
  const onlineUsers = connectionManager.getOnlineUsers();

  sendToClient(client, {
    type: 'presence_update',
    payload: {
      user: {
        connectionId: client.connectionId,
        userId: client.userId,
        username: client.username,
        subscribedChannels: channels,
        connectedAt: client.connectedAt,
      },
      onlineUsers,
      timestamp: Date.now(),
    },
    timestamp: Date.now(),
    messageId,
  });
}

function processMessage(client: WebSocketClient, rawMessage: string): void {
  let parsedMessage: IncomingWSMessage;

  try {
    parsedMessage = JSON.parse(rawMessage) as IncomingWSMessage;
  } catch {
    sendError(client, 'Invalid JSON format');
    return;
  }

  const { type, channel, payload, targetUserId, messageId } = parsedMessage;

  switch (type) {
    case 'subscribe':
      if (!channel) {
        sendError(client, 'Channel is required for subscription', messageId);
        return;
      }
      handleSubscribe(client, channel, messageId);
      break;

    case 'unsubscribe':
      if (!channel) {
        sendError(client, 'Channel is required for unsubscription', messageId);
        return;
      }
      handleUnsubscribe(client, channel, messageId);
      break;

    case 'broadcast':
      handleBroadcast(client, channel || '', payload, messageId);
      break;

    case 'private':
      handlePrivate(client, targetUserId || '', payload, messageId);
      break;

    case 'ping':
      handlePing(client, messageId);
      break;

    case 'presence':
      handlePresence(client, messageId);
      break;

    default:
      if (messageId) {
        sendError(client, `Unknown message type: ${type}`, messageId);
      }
  }
}

function authenticateWebSocket(socket: WebSocket, request: { url?: string; headers: { authorization?: string } }): AuthenticatedUser | null {
  try {
    let token: string | undefined;

    const url = request.url;
    if (url) {
      const urlObj = new URL(url, `http://localhost:${PORT}`);
      token = urlObj.searchParams.get('token') || undefined;
    }

    if (!token && request.headers.authorization) {
      const parts = request.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return null;
    }

    return wsAuthenticate(token);
  } catch {
    return null;
  }
}

wss.on('connection', (socket: WebSocket, request) => {
  const client = socket as WebSocketClient;

  const user = authenticateWebSocket(socket, request);

  if (!user) {
    const errorResponse: OutgoingWSMessage = {
      type: 'error',
      payload: { error: 'Authentication required', code: 'AUTH_REQUIRED' },
      timestamp: Date.now(),
    };
    socket.send(JSON.stringify(errorResponse));
    socket.close(4001, 'Authentication required');
    console.log(`[WS] Connection rejected: No valid authentication`);
    return;
  }

  connectionManager.registerConnection(socket, user.id, user.username);

  console.log(`[WS] Client connected: ${client.connectionId} (user: ${user.username}, id: ${user.id})`);

  const welcomeMessage: OutgoingWSMessage = {
    type: 'ack',
    payload: {
      message: 'Connected to ReZ WebSocket Hub',
      connectionId: client.connectionId,
      user: {
        id: user.id,
        username: user.username,
      },
    },
    timestamp: Date.now(),
  };
  sendToClient(client, welcomeMessage);

  socket.on('message', (data: Buffer | string) => {
    const messageStr = data.toString();

    if (messageStr.length > MAX_MESSAGE_SIZE) {
      sendError(client, `Message size exceeds limit of ${MAX_MESSAGE_SIZE} bytes`);
      return;
    }

    processMessage(client, messageStr);
  });

  socket.on('close', (code: number, reason: Buffer) => {
    const channels = Array.from(client.subscribedChannels);
    channelService.unsubscribeAll(client.connectionId);
    connectionManager.removeConnection(client.connectionId);

    console.log(`[WS] Client disconnected: ${client.connectionId} (code: ${code}, reason: ${reason.toString() || 'none'})`);
    console.log(`[WS] User ${user.username} was subscribed to: ${channels.join(', ') || 'none'}`);
  });

  socket.on('error', (error: Error) => {
    console.error(`[WS] Socket error for ${client.connectionId}:`, error.message);
  });

  socket.on('pong', () => {
    client.isAlive = true;
  });

  socket.on('ping', () => {
    client.pong();
  });
});

const pingInterval = setInterval(() => {
  wss.clients.forEach((socket) => {
    const client = socket as WebSocketClient;

    if (!client.isAlive) {
      console.log(`[WS] Terminating inactive connection: ${client.connectionId}`);
      channelService.unsubscribeAll(client.connectionId);
      connectionManager.removeConnection(client.connectionId);
      client.terminate();
      return;
    }

    client.isAlive = false;
    client.ping();
  });

  const stale = connectionManager.cleanupStaleConnections();
  if (stale.length > 0) {
    console.log(`[WS] Cleaned up ${stale.length} stale connections`);
  }
}, PING_INTERVAL);

wss.on('close', () => {
  clearInterval(pingInterval);
});

server.on('error', (error: Error) => {
  console.error('[Server] Error:', error);
});



// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-websocket-hub',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('  ReZ WebSocket Hub Server');
  console.log('='.repeat(60));
  console.log(`  WebSocket: ws://localhost:${PORT}${WS_PATH}`);
  console.log(`  REST API:  http://localhost:${PORT}/api/ws`);
  console.log(`  Health:    http://localhost:${PORT}/api/ws/health`);
  console.log('='.repeat(60));
  console.log(`  Ping Interval: ${PING_INTERVAL}ms`);
  console.log(`  Ping Timeout:  ${PING_TIMEOUT}ms`);
  console.log(`  Max Message:   ${MAX_MESSAGE_SIZE} bytes`);
  console.log('='.repeat(60));
});

process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully...');

  clearInterval(pingInterval);

  wss.clients.forEach((socket) => {
    const client = socket as WebSocketClient;
    channelService.unsubscribeAll(client.connectionId);
    socket.close(1001, 'Server shutting down');
  });

  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down...');
  process.emit('SIGTERM');
});

export { app, server, wss };

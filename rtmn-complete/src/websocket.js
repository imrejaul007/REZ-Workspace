/**
 * RTMN WebSocket Manager
 * Real-time updates for twins, agents, and BOA
 */

import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

// Connected clients
const clients = new Map();

// Event subscribers
const subscribers = new Map();

// Broadcast intervals
const broadcasts = new Map();

/**
 * Initialize WebSocket server
 */
export function initWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const clientId = uuidv4();
    const clientInfo = {
      id: clientId,
      ws,
      subscriptions: new Set(),
      connectedAt: new Date().toISOString(),
      ip: req.socket.remoteAddress
    };

    clients.set(clientId, clientInfo);
    console.log(`[WS] Client connected: ${clientId} (${clients.size} total)`);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      timestamp: new Date().toISOString(),
      message: 'Connected to RTMN WebSocket'
    }));

    // Handle messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(clientId, message);
      } catch (err) {
        console.error('[WS] Invalid message:', err);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      clients.delete(clientId);
      console.log(`[WS] Client disconnected: ${clientId} (${clients.size} remaining)`);
    });

    // Handle errors
    ws.on('error', (err) => {
      console.error(`[WS] Client error: ${clientId}`, err);
      clients.delete(clientId);
    });
  });

  // Start broadcast intervals
  startBroadcasts();

  console.log('[WS] WebSocket server initialized on /ws');
  return wss;
}

/**
 * Handle incoming client messages
 */
function handleMessage(clientId, message) {
  const client = clients.get(clientId);
  if (!client) return;

  switch (message.type) {
    case 'subscribe':
      // Subscribe to specific channels
      const channels = Array.isArray(message.channels) ? message.channels : [message.channels];
      channels.forEach(ch => {
        client.subscriptions.add(ch);
        if (!subscribers.has(ch)) subscribers.set(ch, new Set());
        subscribers.get(ch).add(clientId);
      });
      client.ws.send(JSON.stringify({
        type: 'subscribed',
        channels,
        timestamp: new Date().toISOString()
      }));
      break;

    case 'unsubscribe':
      const toRemove = Array.isArray(message.channels) ? message.channels : [message.channels];
      toRemove.forEach(ch => {
        client.subscriptions.delete(ch);
        subscribers.get(ch)?.delete(clientId);
      });
      client.ws.send(JSON.stringify({
        type: 'unsubscribed',
        channels: toRemove,
        timestamp: new Date().toISOString()
      }));
      break;

    case 'ping':
      client.ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      break;

    case 'query':
      // Handle twin/agent queries via WebSocket
      handleQuery(clientId, message);
      break;

    default:
      client.ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
  }
}

/**
 * Handle query requests
 */
function handleQuery(clientId, message) {
  const { query, channel = 'default' } = message;
  const response = {
    type: 'query-result',
    queryId: uuidv4(),
    query,
    timestamp: new Date().toISOString()
  };

  // Simulate query result (in real implementation, this would query actual services)
  if (query.includes('twin')) {
    response.result = {
      twins: getMockTwins(),
      count: 5
    };
  } else if (query.includes('agent')) {
    response.result = {
      agents: getMockAgents(),
      count: 3
    };
  } else {
    response.result = {
      message: 'Query processed',
      data: { processed: true }
    };
  }

  clients.get(clientId)?.ws.send(JSON.stringify(response));
}

/**
 * Broadcast to specific channel
 */
export function broadcast(channel, data) {
  const message = JSON.stringify({
    type: 'broadcast',
    channel,
    data,
    timestamp: new Date().toISOString()
  });

  const channelSubs = subscribers.get(channel);
  if (channelSubs) {
    channelSubs.forEach(clientId => {
      const client = clients.get(clientId);
      if (client?.ws.readyState === 1) { // OPEN
        client.ws.send(message);
      }
    });
  }
}

/**
 * Broadcast to all connected clients
 */
export function broadcastAll(data) {
  const message = JSON.stringify({
    type: 'broadcast',
    channel: 'all',
    data,
    timestamp: new Date().toISOString()
  });

  clients.forEach(client => {
    if (client.ws.readyState === 1) {
      client.ws.send(message);
    }
  });
}

/**
 * Send to specific client
 */
export function sendTo(clientId, data) {
  const client = clients.get(clientId);
  if (client?.ws.readyState === 1) {
    client.ws.send(JSON.stringify(data));
  }
}

/**
 * Start periodic broadcasts
 */
function startBroadcasts() {
  // Twin status updates every 30 seconds
  broadcasts.set('twin-status', setInterval(() => {
    broadcast('twin-status', {
      totalTwins: 85,
      activeTwins: 82,
      avgHealth: 96.5,
      lastUpdate: new Date().toISOString()
    });
  }, 30000));

  // Agent activity every 15 seconds
  broadcasts.set('agent-activity', setInterval(() => {
    broadcast('agent-activity', {
      activeAgents: 5,
      tasksProcessed: Math.floor(Math.random() * 100) + 500,
      avgResponseTime: '45ms'
    });
  }, 15000));

  // System metrics every 10 seconds
  broadcasts.set('system-metrics', setInterval(() => {
    broadcast('system-metrics', {
      connections: clients.size,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    });
  }, 10000));
}

/**
 * Stop all broadcasts
 */
export function stopBroadcasts() {
  broadcasts.forEach(interval => clearInterval(interval));
  broadcasts.clear();
}

/**
 * Get connected clients count
 */
export function getClientCount() {
  return clients.size;
}

/**
 * Get subscriber count for a channel
 */
export function getSubscriberCount(channel) {
  return subscribers.get(channel)?.size || 0;
}

// Mock data generators
function getMockTwins() {
  return [
    { id: 'retail-1', name: 'Customer Twin', status: 'active', health: 98 },
    { id: 'retail-2', name: 'Product Twin', status: 'active', health: 95 },
    { id: 'retail-3', name: 'Inventory Twin', status: 'active', health: 92 },
    { id: 'rest-1', name: 'Reservation Twin', status: 'active', health: 97 },
    { id: 'health-1', name: 'Patient Twin', status: 'active', health: 99 }
  ];
}

function getMockAgents() {
  return [
    { id: 'agent-1', name: 'Sales Analysis Agent', status: 'active', tasks: 245 },
    { id: 'agent-2', name: 'Inventory Agent', status: 'active', tasks: 189 },
    { id: 'agent-3', name: 'Customer Agent', status: 'active', tasks: 156 }
  ];
}

export default {
  initWebSocket,
  broadcast,
  broadcastAll,
  sendTo,
  getClientCount,
  getSubscriberCount,
  stopBroadcasts
};

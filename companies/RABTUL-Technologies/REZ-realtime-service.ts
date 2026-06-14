/**
 * WebSocket Service - Real-time Communication
 */

import type { WebSocket, IncomingMessage } from 'ws';
import { randomBytes } from 'crypto';
import { redis } from './config/redis';

const WS_PREFIX = 'ws:';

interface WSClient {
  id: string;
  userId?: string;
  rooms: Set<string>;
}

/**
 * WebSocket message types
 */
type WSMessageType = 'join' | 'leave' | 'broadcast' | 'ping';

interface WSJoinMessage {
  type: 'join';
  room: string;
}

interface WSLeaveMessage {
  type: 'leave';
  room: string;
}

interface WSBroadcastMessage {
  type: 'broadcast';
  room: string;
  data: unknown;
}

interface WSPingMessage {
  type: 'ping';
}

type WSIncomingMessage = WSJoinMessage | WSLeaveMessage | WSBroadcastMessage | WSPingMessage;

/**
 * Handle WebSocket connection
 */
export function handleConnection(ws: WebSocket, req: IncomingMessage): void {
  const clientId = generateId();
  const client: WSClient = { id: clientId, rooms: new Set() };

  ws.on('message', (data: Buffer | string) => {
    const msgString = typeof data === 'string' ? data : data.toString();
    const msg = JSON.parse(msgString) as WSIncomingMessage;
    handleMessage(client, msg, ws);
  });

  ws.on('close', () => {
    // Cleanup
  });
}

/**
 * Handle incoming message
 */
function handleMessage(client: WSClient, msg: WSIncomingMessage, ws: WebSocket): void {
  switch (msg.type) {
    case 'join':
      client.rooms.add(msg.room);
      break;
    case 'leave':
      client.rooms.delete(msg.room);
      break;
    case 'broadcast':
      broadcast(msg.room, msg.data);
      break;
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
  }
}

/**
 * Broadcast to room
 */
export function broadcast(room: string, data: unknown): void {
  // Redis pub/sub for scaling
  redis.publish(`${WS_PREFIX}room:${room}`, JSON.stringify(data));
}

function generateId(): string {
  return `ws_${Date.now()}_${randomBytes(6).toString('hex')}`;
}

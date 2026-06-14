import { IncomingMessage } from 'http';
import WebSocket from 'ws';

export interface User {
  id: string;
  username: string;
  email?: string;
}

export interface AuthenticatedUser extends User {
  iat: number;
  exp: number;
}

export interface WebSocketClient extends WebSocket {
  userId?: string;
  username?: string;
  subscribedChannels: Set<string>;
  isAlive: boolean;
  connectionId: string;
  connectedAt: number;
}

export interface ClientInfo {
  connectionId: string;
  userId: string;
  username: string;
  subscribedChannels: string[];
  connectedAt: number;
  isAlive: boolean;
}

export interface ChannelInfo {
  name: string;
  subscribers: string[];
  createdAt: number;
}

export interface Message {
  type: MessageType;
  channel?: string;
  payload: unknown;
  timestamp: number;
  senderId?: string;
  senderUsername?: string;
}

export type MessageType =
  | 'subscribe'
  | 'unsubscribe'
  | 'broadcast'
  | 'private'
  | 'presence_update'
  | 'error'
  | 'ping'
  | 'pong'
  | 'ack';

export interface BroadcastMessage {
  channel: string;
  message: unknown;
  senderId: string;
  senderUsername: string;
  timestamp: number;
}

export interface PrivateMessage {
  targetUserId: string;
  message: unknown;
  senderId: string;
  senderUsername: string;
  timestamp: number;
}

export interface PresenceUpdate {
  userId: string;
  username: string;
  status: 'online' | 'offline' | 'away';
  channels: string[];
  timestamp: number;
}

export interface IncomingWSMessage {
  type: MessageType;
  channel?: string;
  payload?: unknown;
  targetUserId?: string;
  messageId?: string;
}

export interface OutgoingWSMessage {
  type: MessageType;
  payload: unknown;
  timestamp: number;
  messageId?: string;
}

export interface AuthenticatedRequest extends IncomingMessage {
  user?: AuthenticatedUser;
}

export interface ServerStats {
  uptime: number;
  totalConnections: number;
  totalChannels: number;
  memoryUsage: NodeJS.MemoryUsage;
  messageCount: number;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

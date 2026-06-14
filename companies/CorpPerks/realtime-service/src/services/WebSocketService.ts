import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import {
  WebSocketConnection,
  OutgoingMessage,
  PresenceUpdate,
  TypingIndicator,
  RoomType,
} from '../types';
import { Room, Message, Presence } from '../models';

// ==========================================
// WebSocket Client Interface
// ==========================================

interface WebSocketClient extends WebSocket {
  id: string;
  userId?: string;
  isAlive: boolean;
  rooms: Set<string>;
  lastPing: number;
}

// ==========================================
// WebSocket Service
// ==========================================

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocketClient> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  private roomClients: Map<string, Set<string>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private presenceInterval: NodeJS.Timeout | null = null;
  private server: HttpServer | null = null;

  // ==========================================
  // Initialize WebSocket Server
  // ==========================================

  initialize(server: HttpServer): void {
    this.server = server;

    this.wss = new WebSocketServer({
      server,
      path: '/',
      clientTracking: true,
      maxPayload: 1024 * 1024, // 1MB max payload
    });

    this.setupEventHandlers();
    this.startHeartbeat();
    this.startPresenceCleanup();

    logger.info('WebSocket server initialized');
  }

  // ==========================================
  // Event Handlers
  // ==========================================

  private setupEventHandlers(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws: WebSocket, req) => {
      this.handleConnection(ws as WebSocketClient, req);
    });

    this.wss.on('error', (error) => {
      logger.error('WebSocket server error:', error);
    });
  }

  // ==========================================
  // Handle New Connection
  // ==========================================

  private handleConnection(ws: WebSocketClient, req: { url?: string; headers?: { [key: string]: string } }): void {
    const clientId = uuidv4();
    ws.id = clientId;
    ws.isAlive = true;
    ws.rooms = new Set();
    ws.lastPing = Date.now();

    this.clients.set(clientId, ws);

    logger.info(`New WebSocket connection: ${clientId}`);

    // Handle authentication via query params
    const url = new URL(req.url || '/', `http://${req.headers?.host || 'localhost'}`);
    const token = url.searchParams.get('token');
    const userId = url.searchParams.get('userId');

    if (userId) {
      ws.userId = userId;
      this.addUserConnection(userId, clientId);
      this.updatePresence(userId, 'online');
    }

    // Send connection acknowledgment
    this.sendToClient(ws, {
      type: 'connection',
      payload: {
        clientId,
        message: 'Connected to CorpPerks Real-time Service',
        timestamp: new Date().toISOString(),
      },
    });

    // Handle messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        logger.error('Failed to parse message:', error);
        this.sendToClient(ws, {
          type: 'error',
          payload: { code: 'INVALID_MESSAGE', message: 'Failed to parse message' },
        });
      }
    });

    // Handle pong (heartbeat response)
    ws.on('pong', () => {
      ws.isAlive = true;
      ws.lastPing = Date.now();
    });

    // Handle close
    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error(`WebSocket client error (${clientId}):`, error);
    });
  }

  // ==========================================
  // Handle Incoming Messages
  // ==========================================

  private handleMessage(ws: WebSocketClient, message: Record<string, unknown>): void {
    const { action, payload } = message;

    switch (action) {
      case 'auth':
        this.handleAuth(ws, payload);
        break;
      case 'join_room':
        this.handleJoinRoom(ws, payload);
        break;
      case 'leave_room':
        this.handleLeaveRoom(ws, payload);
        break;
      case 'send_message':
        this.handleSendMessage(ws, payload);
        break;
      case 'typing':
        this.handleTyping(ws, payload);
        break;
      case 'presence':
        this.handlePresenceUpdate(ws, payload);
        break;
      case 'ping':
        this.sendToClient(ws, { type: 'pong', payload: { timestamp: Date.now() } });
        break;
      default:
        this.sendToClient(ws, {
          type: 'error',
          payload: { code: 'UNKNOWN_ACTION', message: `Unknown action: ${action}` },
        });
    }
  }

  // ==========================================
  // Authentication
  // ==========================================

  private handleAuth(ws: WebSocketClient, payload: Record<string, unknown>): void {
    const { userId, token } = payload as { userId: string; token: string };

    if (!userId) {
      this.sendToClient(ws, {
        type: 'error',
        payload: { code: 'AUTH_FAILED', message: 'User ID is required' },
      });
      return;
    }

    // Validate token (in production, verify JWT)
    if (token) {
      ws.userId = userId;
      this.addUserConnection(userId, ws.id);
      this.updatePresence(userId, 'online');

      this.sendToClient(ws, {
        type: 'connection',
        payload: {
          authenticated: true,
          userId,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      this.sendToClient(ws, {
        type: 'error',
        payload: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
      });
    }
  }

  // ==========================================
  // Join Room
  // ==========================================

  private async handleJoinRoom(ws: WebSocketClient, payload: Record<string, unknown>): Promise<void> {
    const { roomId, roomType, metadata } = payload as {
      roomId: string;
      roomType: RoomType;
      metadata?: Record<string, unknown>;
    };

    if (!roomId || !roomType) {
      this.sendToClient(ws, {
        type: 'error',
        payload: { code: 'INVALID_ROOM', message: 'Room ID and type are required' },
      });
      return;
    }

    // Add client to room
    this.joinRoom(ws, roomId);

    // Persist room membership
    try {
      await Room.findOneAndUpdate(
        { id: roomId },
        {
          $addToSet: { members: ws.userId || 'anonymous' },
          $set: { type: roomType, name: roomId, metadata },
        },
        { upsert: true, new: true }
      );

      // Update presence
      if (ws.userId) {
        await Presence.findOneAndUpdate(
          { userId: ws.userId },
          { $addToSet: { rooms: roomId } },
          { upsert: true }
        );
      }

      this.sendToClient(ws, {
        type: 'room_joined',
        payload: { roomId, roomType, timestamp: new Date().toISOString() },
      });

      // Broadcast to room members
      this.broadcastToRoom(roomId, {
        type: 'presence',
        payload: {
          action: 'joined',
          userId: ws.userId,
          roomId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Failed to join room:', error);
      this.sendToClient(ws, {
        type: 'error',
        payload: { code: 'ROOM_JOIN_FAILED', message: 'Failed to join room' },
      });
    }
  }

  // ==========================================
  // Leave Room
  // ==========================================

  private async handleLeaveRoom(ws: WebSocketClient, payload: Record<string, unknown>): Promise<void> {
    const { roomId } = payload as { roomId: string };

    if (!roomId) {
      return;
    }

    this.leaveRoom(ws, roomId);

    // Update presence
    if (ws.userId) {
      await Presence.findOneAndUpdate(
        { userId: ws.userId },
        { $pull: { rooms: roomId } }
      );
    }

    // Broadcast to room members
    this.broadcastToRoom(roomId, {
      type: 'presence',
      payload: {
        action: 'left',
        userId: ws.userId,
        roomId,
        timestamp: new Date().toISOString(),
      },
    });

    this.sendToClient(ws, {
      type: 'room_left',
      payload: { roomId, timestamp: new Date().toISOString() },
    });
  }

  // ==========================================
  // Send Message
  // ==========================================

  private async handleSendMessage(ws: WebSocketClient, payload: Record<string, unknown>): Promise<void> {
    const { roomId, type, data } = payload as {
      roomId: string;
      type: string;
      data: unknown;
    };

    if (!roomId || !type) {
      this.sendToClient(ws, {
        type: 'error',
        payload: { code: 'INVALID_MESSAGE', message: 'Room ID and type are required' },
      });
      return;
    }

    const messageId = uuidv4();
    const timestamp = new Date();

    // Save message to database
    try {
      const message = new Message({
        id: messageId,
        type,
        room: roomId,
        payload: data,
        timestamp,
        senderId: ws.userId || 'anonymous',
      });
      await message.save();

      // Broadcast to room
      this.broadcastToRoom(roomId, {
        type,
        payload: {
          id: messageId,
          data,
          senderId: ws.userId,
          timestamp: timestamp.toISOString(),
        },
      });
    } catch (error) {
      logger.error('Failed to save message:', error);
      this.sendToClient(ws, {
        type: 'error',
        payload: { code: 'MESSAGE_SEND_FAILED', message: 'Failed to send message' },
      });
    }
  }

  // ==========================================
  // Typing Indicator
  // ==========================================

  private handleTyping(ws: WebSocketClient, payload: Record<string, unknown>): void {
    const { roomId, isTyping, context } = payload as TypingIndicator;

    if (!roomId || ws.userId === undefined) {
      return;
    }

    // Broadcast to room (excluding sender)
    this.broadcastToRoom(
      roomId,
      {
        type: 'typing',
        payload: {
          userId: ws.userId,
          roomId,
          isTyping,
          context,
        },
      },
      ws.id
    );
  }

  // ==========================================
  // Presence Update
  // ==========================================

  private handlePresenceUpdate(ws: WebSocketClient, payload: Record<string, unknown>): void {
    const { status } = payload as { status: 'online' | 'offline' | 'away' | 'busy' };

    if (ws.userId && status) {
      this.updatePresence(ws.userId, status);
    }
  }

  // ==========================================
  // Handle Disconnect
  // ==========================================

  private async handleDisconnect(ws: WebSocketClient): Promise<void> {
    logger.info(`WebSocket disconnected: ${ws.id}`);

    // Remove from all rooms
    for (const roomId of ws.rooms) {
      this.leaveRoom(ws, roomId);
    }

    // Update presence
    if (ws.userId) {
      await this.updatePresence(ws.userId, 'offline');
      this.removeUserConnection(ws.userId, ws.id);

      // Check if user has other connections
      const connections = this.userConnections.get(ws.userId);
      if (!connections || connections.size === 0) {
        await Presence.findOneAndUpdate(
          { userId: ws.userId },
          { $set: { status: 'offline', lastSeen: new Date() } }
        );
      }
    }

    // Remove client
    this.clients.delete(ws.id);
  }

  // ==========================================
  // Helper Methods
  // ==========================================

  private sendToClient(ws: WebSocketClient, message: OutgoingMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private addUserConnection(userId: string, clientId: string): void {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(clientId);
  }

  private removeUserConnection(userId: string, clientId: string): void {
    const connections = this.userConnections.get(userId);
    if (connections) {
      connections.delete(clientId);
      if (connections.size === 0) {
        this.userConnections.delete(userId);
      }
    }
  }

  private joinRoom(ws: WebSocketClient, roomId: string): void {
    ws.rooms.add(roomId);

    if (!this.roomClients.has(roomId)) {
      this.roomClients.set(roomId, new Set());
    }
    this.roomClients.get(roomId)!.add(ws.id);
  }

  private leaveRoom(ws: WebSocketClient, roomId: string): void {
    ws.rooms.delete(roomId);

    const roomClients = this.roomClients.get(roomId);
    if (roomClients) {
      roomClients.delete(ws.id);
      if (roomClients.size === 0) {
        this.roomClients.delete(roomId);
      }
    }
  }

  private broadcastToRoom(roomId: string, message: OutgoingMessage, excludeClientId?: string): void {
    const roomClients = this.roomClients.get(roomId);
    if (!roomClients) return;

    const payload = JSON.stringify(message);

    for (const clientId of roomClients) {
      if (clientId === excludeClientId) continue;

      const client = this.clients.get(clientId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  private broadcastToUser(userId: string, message: OutgoingMessage): void {
    const connections = this.userConnections.get(userId);
    if (!connections) return;

    const payload = JSON.stringify(message);

    for (const clientId of connections) {
      const client = this.clients.get(clientId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  private async updatePresence(userId: string, status: 'online' | 'offline' | 'away' | 'busy'): Promise<void> {
    try {
      await Presence.findOneAndUpdate(
        { userId },
        {
          $set: {
            status,
            lastSeen: new Date(),
            socketIds: Array.from(this.userConnections.get(userId) || []),
          },
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      logger.error('Failed to update presence:', error);
    }
  }

  // ==========================================
  // Heartbeat
  // ==========================================

  private startHeartbeat(): void {
    const interval = parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10);

    this.heartbeatInterval = setInterval(() => {
      for (const [clientId, client] of this.clients) {
        if (!client.isAlive) {
          client.terminate();
          this.clients.delete(clientId);
          continue;
        }

        client.isAlive = false;
        client.ping();
      }
    }, interval);
  }

  // ==========================================
  // Presence Cleanup
  // ==========================================

  private startPresenceCleanup(): void {
    this.presenceInterval = setInterval(async () => {
      try {
        // Mark stale users as offline
        const staleThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes

        await Presence.updateMany(
          {
            status: 'online',
            lastSeen: { $lt: staleThreshold },
            socketIds: { $size: 0 },
          },
          { $set: { status: 'offline' } }
        );
      } catch (error) {
        logger.error('Presence cleanup error:', error);
      }
    }, 60000); // Every minute
  }

  // ==========================================
  // Public API for Publishing Events
  // ==========================================

  publishToRoom(roomId: string, type: string, data: unknown): void {
    this.broadcastToRoom(roomId, {
      type,
      payload: data,
      timestamp: new Date().toISOString(),
    });
  }

  publishToUser(userId: string, type: string, data: unknown): void {
    this.broadcastToUser(userId, {
      type,
      payload: data,
      timestamp: new Date().toISOString(),
    });
  }

  publishToUsers(userIds: string[], type: string, data: unknown): void {
    for (const userId of userIds) {
      this.publishToUser(userId, type, data);
    }
  }

  // ==========================================
  // Get Stats
  // ==========================================

  getStats(): {
    totalConnections: number;
    totalRooms: number;
    userCount: number;
    rooms: { roomId: string; clientCount: number }[];
  } {
    const rooms: { roomId: string; clientCount: number }[] = [];

    for (const [roomId, clients] of this.roomClients) {
      rooms.push({ roomId, clientCount: clients.size });
    }

    return {
      totalConnections: this.clients.size,
      totalRooms: this.roomClients.size,
      userCount: this.userConnections.size,
      rooms,
    };
  }

  // ==========================================
  // Shutdown
  // ==========================================

  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
    }
    if (this.wss) {
      this.wss.close();
    }
    this.clients.clear();
    this.userConnections.clear();
    this.roomClients.clear();
    logger.info('WebSocket service shut down');
  }
}

// ==========================================
// Singleton Export
// ==========================================

export const webSocketService = new WebSocketService();

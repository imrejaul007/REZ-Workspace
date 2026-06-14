import { v4 as uuidv4 } from 'uuid';
import type { WebSocketClient, ClientInfo, ServerStats } from '../types/index.js';

export class ConnectionManager {
  private connections: Map<string, WebSocketClient> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  private messageCount: number = 0;
  private startTime: number = Date.now();

  registerConnection(ws: WebSocket, userId: string, username: string): WebSocketClient {
    const connectionId = uuidv4();
    const client = ws as WebSocketClient;

    client.connectionId = connectionId;
    client.userId = userId;
    client.username = username;
    client.subscribedChannels = new Set();
    client.isAlive = true;
    client.connectedAt = Date.now();

    this.connections.set(connectionId, client);

    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);

    return client;
  }

  removeConnection(connectionId: string): { userId: string; channels: string[] } | null {
    const client = this.connections.get(connectionId);

    if (!client) {
      return null;
    }

    const userId = client.userId!;
    const channels = Array.from(client.subscribedChannels);

    this.connections.delete(connectionId);

    const userConns = this.userConnections.get(userId);
    if (userConns) {
      userConns.delete(connectionId);
      if (userConns.size === 0) {
        this.userConnections.delete(userId);
      }
    }

    return { userId, channels };
  }

  getConnection(connectionId: string): WebSocketClient | undefined {
    return this.connections.get(connectionId);
  }

  getConnectionByUserId(userId: string): WebSocketClient[] {
    const connectionIds = this.userConnections.get(userId);
    if (!connectionIds) {
      return [];
    }

    return Array.from(connectionIds)
      .map(id => this.connections.get(id))
      .filter((ws): ws is WebSocketClient => ws !== undefined);
  }

  getAllConnections(): Map<string, WebSocketClient> {
    return this.connections;
  }

  getClientInfo(connectionId: string): ClientInfo | null {
    const client = this.connections.get(connectionId);

    if (!client) {
      return null;
    }

    return {
      connectionId: client.connectionId,
      userId: client.userId!,
      username: client.username!,
      subscribedChannels: Array.from(client.subscribedChannels),
      connectedAt: client.connectedAt,
      isAlive: client.isAlive,
    };
  }

  getAllClientInfo(): ClientInfo[] {
    return Array.from(this.connections.values()).map(client => ({
      connectionId: client.connectionId,
      userId: client.userId!,
      username: client.username!,
      subscribedChannels: Array.from(client.subscribedChannels),
      connectedAt: client.connectedAt,
      isAlive: client.isAlive,
    }));
  }

  getOnlineUsers(): { userId: string; username: string; connections: number }[] {
    const users: Map<string, { userId: string; username: string; connections: number }> = new Map();

    for (const client of this.connections.values()) {
      const existing = users.get(client.userId!);
      if (existing) {
        existing.connections++;
      } else {
        users.set(client.userId!, {
          userId: client.userId!,
          username: client.username!,
          connections: 1,
        });
      }
    }

    return Array.from(users.values());
  }

  incrementMessageCount(): void {
    this.messageCount++;
  }

  getMessageCount(): number {
    return this.messageCount;
  }

  getTotalConnections(): number {
    return this.connections.size;
  }

  getUniqueUsers(): number {
    return this.userConnections.size;
  }

  getStats(): ServerStats {
    const memUsage = process.memoryUsage();

    return {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      totalConnections: this.connections.size,
      totalChannels: 0,
      memoryUsage: memUsage,
      messageCount: this.messageCount,
    };
  }

  pingAll(): void {
    for (const client of this.connections.values()) {
      if (client.readyState === 1) {
        client.isAlive = true;
        client.ping();
      }
    }
  }

  cleanupStaleConnections(): { connectionId: string; userId: string }[] {
    const stale: { connectionId: string; userId: string }[] = [];

    for (const [connectionId, client] of this.connections.entries()) {
      if (!client.isAlive || client.readyState !== 1) {
        stale.push({
          connectionId,
          userId: client.userId || 'unknown',
        });
      }
    }

    for (const { connectionId } of stale) {
      this.removeConnection(connectionId);
    }

    return stale;
  }

  resetMessageCount(): void {
    this.messageCount = 0;
  }

  isUserOnline(userId: string): boolean {
    return this.userConnections.has(userId);
  }

  getConnectionCountByUserId(userId: string): number {
    const connections = this.userConnections.get(userId);
    return connections ? connections.size : 0;
  }
}

export const connectionManager = new ConnectionManager();

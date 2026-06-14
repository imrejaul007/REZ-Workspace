import type { WebSocketClient, ChannelInfo, PresenceUpdate } from '../types/index.js';
import { connectionManager } from './connectionManager.js';

export class ChannelService {
  private channels: Map<string, Set<string>> = new Map();
  private channelMetadata: Map<string, { createdAt: number; description?: string }> = new Map();
  private maxChannels: number = 1000;
  private maxChannelNameLength: number = 100;
  private maxSubscribersPerChannel: number = 10000;

  subscribe(connectionId: string, channelName: string): { success: boolean; error?: string } {
    if (!this.isValidChannelName(channelName)) {
      return { success: false, error: 'Invalid channel name' };
    }

    const client = connectionManager.getConnection(connectionId);
    if (!client) {
      return { success: false, error: 'Connection not found' };
    }

    if (!this.channels.has(channelName)) {
      if (this.channels.size >= this.maxChannels) {
        return { success: false, error: 'Maximum number of channels reached' };
      }
      this.channels.set(channelName, new Set());
      this.channelMetadata.set(channelName, { createdAt: Date.now() });
    }

    const subscribers = this.channels.get(channelName)!;

    if (subscribers.size >= this.maxSubscribersPerChannel) {
      return { success: false, error: 'Channel is full' };
    }

    if (client.subscribedChannels.has(channelName)) {
      return { success: true };
    }

    subscribers.add(connectionId);
    client.subscribedChannels.add(channelName);

    this.broadcastPresenceUpdate(channelName, 'online');

    return { success: true };
  }

  unsubscribe(connectionId: string, channelName: string): { success: boolean; error?: string } {
    const client = connectionManager.getConnection(connectionId);
    if (!client) {
      return { success: false, error: 'Connection not found' };
    }

    if (!client.subscribedChannels.has(channelName)) {
      return { success: true };
    }

    const subscribers = this.channels.get(channelName);
    if (subscribers) {
      subscribers.delete(connectionId);

      if (subscribers.size === 0) {
        this.channels.delete(channelName);
        this.channelMetadata.delete(channelName);
      }
    }

    client.subscribedChannels.delete(channelName);

    this.broadcastPresenceUpdate(channelName, 'online');

    return { success: true };
  }

  unsubscribeAll(connectionId: string): void {
    const client = connectionManager.getConnection(connectionId);
    if (!client) {
      return;
    }

    for (const channelName of client.subscribedChannels) {
      const subscribers = this.channels.get(channelName);
      if (subscribers) {
        subscribers.delete(connectionId);
        if (subscribers.size === 0) {
          this.channels.delete(channelName);
          this.channelMetadata.delete(channelName);
        } else {
          this.broadcastPresenceUpdate(channelName, 'online');
        }
      }
    }

    client.subscribedChannels.clear();
  }

  broadcast(channelName: string, message: unknown, senderConnectionId: string): number {
    const subscribers = this.channels.get(channelName);
    if (!subscribers || subscribers.size === 0) {
      return 0;
    }

    const sender = connectionManager.getConnection(senderConnectionId);
    const timestamp = Date.now();

    const payload = {
      type: 'broadcast',
      channel: channelName,
      message,
      senderId: sender?.userId,
      senderUsername: sender?.username,
      timestamp,
    };

    let deliveredCount = 0;

    for (const connId of subscribers) {
      if (connId === senderConnectionId) {
        continue;
      }

      const client = connectionManager.getConnection(connId);
      if (client && client.readyState === 1) {
        try {
          client.send(JSON.stringify(payload));
          deliveredCount++;
          connectionManager.incrementMessageCount();
        } catch (error) {
          console.error(`Failed to send to connection ${connId}:`, error);
        }
      }
    }

    return deliveredCount;
  }

  broadcastToAll(message: unknown, senderConnectionId: string): number {
    let deliveredCount = 0;
    const sender = connectionManager.getConnection(senderConnectionId);
    const timestamp = Date.now();

    const payload = {
      type: 'broadcast',
      channel: '__global__',
      message,
      senderId: sender?.userId,
      senderUsername: sender?.username,
      timestamp,
    };

    const allClients = connectionManager.getAllConnections();

    for (const [connId, client] of allClients) {
      if (connId === senderConnectionId) {
        continue;
      }

      if (client.readyState === 1) {
        try {
          client.send(JSON.stringify(payload));
          deliveredCount++;
          connectionManager.incrementMessageCount();
        } catch (error) {
          console.error(`Failed to send to connection ${connId}:`, error);
        }
      }
    }

    return deliveredCount;
  }

  sendToUser(
    targetUserId: string,
    message: unknown,
    senderConnectionId: string
  ): number {
    const targetClients = connectionManager.getConnectionByUserId(targetUserId);
    if (targetClients.length === 0) {
      return 0;
    }

    const sender = connectionManager.getConnection(senderConnectionId);
    const timestamp = Date.now();

    const payload = {
      type: 'private',
      message,
      senderId: sender?.userId,
      senderUsername: sender?.username,
      timestamp,
    };

    let deliveredCount = 0;

    for (const client of targetClients) {
      if (client.readyState === 1) {
        try {
          client.send(JSON.stringify(payload));
          deliveredCount++;
          connectionManager.incrementMessageCount();
        } catch (error) {
          console.error(`Failed to send to user ${targetUserId}:`, error);
        }
      }
    }

    return deliveredCount;
  }

  getChannelSubscribers(channelName: string): string[] {
    const subscribers = this.channels.get(channelName);
    if (!subscribers) {
      return [];
    }

    return Array.from(subscribers)
      .map(connId => connectionManager.getConnection(connId))
      .filter((client): client is WebSocketClient => client !== undefined)
      .map(client => ({
        connectionId: client.connectionId,
        userId: client.userId!,
        username: client.username!,
      }));
  }

  getChannelInfo(channelName: string): ChannelInfo | null {
    if (!this.channels.has(channelName)) {
      return null;
    }

    const subscribers = Array.from(this.channels.get(channelName)!).map(connId => {
      const client = connectionManager.getConnection(connId);
      return client?.userId || 'unknown';
    });

    const metadata = this.channelMetadata.get(channelName);

    return {
      name: channelName,
      subscribers,
      createdAt: metadata?.createdAt || Date.now(),
    };
  }

  getAllChannels(): ChannelInfo[] {
    return Array.from(this.channels.entries()).map(([name, subscribers]) => {
      const metadata = this.channelMetadata.get(name);
      return {
        name,
        subscribers: Array.from(subscribers),
        createdAt: metadata?.createdAt || Date.now(),
      };
    });
  }

  getChannelCount(): number {
    return this.channels.size;
  }

  getTotalSubscribers(): number {
    let total = 0;
    for (const subscribers of this.channels.values()) {
      total += subscribers.size;
    }
    return total;
  }

  isSubscribed(connectionId: string, channelName: string): boolean {
    const client = connectionManager.getConnection(connectionId);
    return client?.subscribedChannels.has(channelName) || false;
  }

  getUserChannels(connectionId: string): string[] {
    const client = connectionManager.getConnection(connectionId);
    return client ? Array.from(client.subscribedChannels) : [];
  }

  private isValidChannelName(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }

    if (name.length > this.maxChannelNameLength) {
      return false;
    }

    if (name.length < 1) {
      return false;
    }

    const validPattern = /^[a-zA-Z0-9_-]+$/;
    return validPattern.test(name);
  }

  private broadcastPresenceUpdate(channelName: string, status: 'online' | 'offline' | 'away'): void {
    const subscribers = this.channels.get(channelName);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const presenceMap = new Map<string, { userId: string; username: string }>();

    for (const connId of subscribers) {
      const client = connectionManager.getConnection(connId);
      if (client && client.userId) {
        presenceMap.set(client.userId, {
          userId: client.userId,
          username: client.username!,
        });
      }
    }

    const presenceUpdate: PresenceUpdate = {
      userId: 'system',
      username: 'system',
      status,
      channels: Array.from(presenceMap.keys()),
      timestamp: Date.now(),
    };

    const presenceList = Array.from(presenceMap.values()).map(user => ({
      ...user,
      status,
    }));

    const payload = {
      type: 'presence_update',
      channel: channelName,
      data: presenceList,
      timestamp: Date.now(),
    };

    for (const connId of subscribers) {
      const client = connectionManager.getConnection(connId);
      if (client && client.readyState === 1) {
        try {
          client.send(JSON.stringify(payload));
        } catch (error) {
          console.error(`Failed to send presence update to ${connId}:`, error);
        }
      }
    }
  }

  setChannelDescription(channelName: string, description: string): boolean {
    if (!this.channels.has(channelName)) {
      return false;
    }

    const metadata = this.channelMetadata.get(channelName);
    if (metadata) {
      metadata.description = description.slice(0, 500);
    }

    return true;
  }
}

export const channelService = new ChannelService();

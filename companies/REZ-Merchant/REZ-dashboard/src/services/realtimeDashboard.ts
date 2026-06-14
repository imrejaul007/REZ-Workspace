/**
 * Real-time Dashboard Service
 * WebSocket-based live dashboard updates
 */

import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { EventEmitter } from 'events';
import mongoose from 'mongoose';

// ── Event Types ─────────────────────────────────────────────────────────────────

export interface DashboardEvent {
  type: 'order' | 'sale' | 'customer' | 'inventory' | 'alert' | 'metric';
  action: 'created' | 'updated' | 'deleted' | 'completed';
  merchantId: string;
  storeId?: string;
  data: any;
  timestamp: Date;
}

export interface LiveMetric {
  merchantId: string;
  storeId?: string;
  metrics: {
    ordersToday: number;
    salesToday: number;
    avgOrderValue: number;
    customersToday: number;
    comparedToYesterday: {
      ordersChange: number;
      salesChange: number;
    };
  };
}

// ── Redis Subscriber for Real-time Events ──────────────────────────────────────

class RealtimeDashboardService extends EventEmitter {
  private io: SocketServer | null = null;
  private connectedClients: Map<string, Set<string>> = new Map(); // merchantId -> Set<socketId>
  private metricsCache: Map<string, LiveMetric> = new Map();
  private redisSubscriber: any = null;

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });

    this.initializeRedisSubscriber();
    console.log('[Dashboard] Real-time service initialized');
  }

  /**
   * Handle new client connection
   */
  private handleConnection(socket: Socket): void {
    const merchantId = socket.handshake.query.merchantId as string;
    const storeId = socket.handshake.query.storeId as string | undefined;

    if (!merchantId) {
      socket.emit('error', { message: 'merchantId is required' });
      socket.disconnect();
      return;
    }

    // Join merchant room
    socket.join(`merchant:${merchantId}`);

    // Join store room if specified
    if (storeId) {
      socket.join(`store:${storeId}`);
    }

    // Track connection
    if (!this.connectedClients.has(merchantId)) {
      this.connectedClients.set(merchantId, new Set());
    }
    this.connectedClients.get(merchantId)!.add(socket.id);

    console.log(`[Dashboard] Client connected: ${socket.id} (merchant: ${merchantId})`);

    // Send current metrics
    const cachedMetrics = this.metricsCache.get(merchantId);
    if (cachedMetrics) {
      socket.emit('metrics:update', cachedMetrics);
    }

    // Handle subscription to specific events
    socket.on('subscribe', (data: { events: string[] }) => {
      data.events.forEach((event) => {
        socket.join(`event:${event}`);
      });
      socket.emit('subscribed', { events: data.events });
    });

    socket.on('unsubscribe', (data: { events: string[] }) => {
      data.events.forEach((event) => {
        socket.leave(`event:${event}`);
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const clients = this.connectedClients.get(merchantId);
      if (clients) {
        clients.delete(socket.id);
        if (clients.size === 0) {
          this.connectedClients.delete(merchantId);
        }
      }
      console.log(`[Dashboard] Client disconnected: ${socket.id}`);
    });
  }

  /**
   * Initialize Redis subscriber for cross-instance events
   */
  private async initializeRedisSubscriber(): Promise<void> {
    try {
      const Redis = (await import('ioredis')).default;
      this.redisSubscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

      this.redisSubscriber.subscribe('dashboard:events', 'dashboard:metrics', (err: any) => {
        if (err) {
          console.error('[Dashboard] Redis subscribe error:', err);
        } else {
          console.log('[Dashboard] Subscribed to dashboard channels');
        }
      });

      this.redisSubscriber.on('message', (channel: string, message: string) => {
        const data = JSON.parse(message);

        if (channel === 'dashboard:events') {
          this.broadcastEvent(data as DashboardEvent);
        } else if (channel === 'dashboard:metrics') {
          this.updateMetricsCache(data.merchantId, data.metrics);
        }
      });
    } catch (error) {
      console.warn('[Dashboard] Redis subscriber not available:', error);
    }
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcastEvent(event: DashboardEvent): void {
    // Update local cache
    this.updateMetricsForEvent(event);

    if (!this.io) return;

    // Emit to merchant room
    this.io.to(`merchant:${event.merchantId}`).emit('event', event);

    // Emit to store room if specified
    if (event.storeId) {
      this.io.to(`store:${event.storeId}`).emit('event', event);
    }

    // Emit to specific event type rooms
    this.io.to(`event:${event.type}`).emit('event', event);

    // Emit to general events room
    this.io.to(`merchant:${event.merchantId}`).emit(`${event.type}:${event.action}`, event.data);
  }

  /**
   * Update metrics cache based on event
   */
  private updateMetricsForEvent(event: DashboardEvent): void {
    let metrics = this.metricsCache.get(event.merchantId);

    if (!metrics) {
      metrics = this.createEmptyMetrics(event.merchantId, event.storeId);
      this.metricsCache.set(event.merchantId, metrics);
    }

    switch (event.type) {
      case 'order':
        if (event.action === 'created' || event.action === 'completed') {
          metrics.metrics.ordersToday += 1;
          metrics.metrics.salesToday += event.data.total || 0;
          metrics.metrics.avgOrderValue =
            metrics.metrics.salesToday / metrics.metrics.ordersToday;
        }
        break;
      case 'customer':
        if (event.action === 'created') {
          metrics.metrics.customersToday += 1;
        }
        break;
    }
  }

  /**
   * Update metrics cache directly
   */
  updateMetricsCache(merchantId: string, metrics: LiveMetric['metrics']): void {
    let cached = this.metricsCache.get(merchantId);

    if (!cached) {
      cached = this.createEmptyMetrics(merchantId);
      this.metricsCache.set(merchantId, cached);
    }

    cached.metrics = metrics;

    if (this.io) {
      this.io.to(`merchant:${merchantId}`).emit('metrics:update', cached);
    }
  }

  /**
   * Create empty metrics structure
   */
  private createEmptyMetrics(merchantId: string, storeId?: string): LiveMetric {
    return {
      merchantId,
      storeId,
      metrics: {
        ordersToday: 0,
        salesToday: 0,
        avgOrderValue: 0,
        customersToday: 0,
        comparedToYesterday: {
          ordersChange: 0,
          salesChange: 0,
        },
      },
    };
  }

  /**
   * Publish event to Redis for cross-instance distribution
   */
  async publishEvent(event: DashboardEvent): Promise<void> {
    if (this.redisSubscriber) {
      try {
        await (this.redisSubscriber as any).publish('dashboard:events', JSON.stringify(event));
      } catch (error) {
        console.error('[Dashboard] Failed to publish event:', error);
      }
    }

    // Also emit locally
    this.broadcastEvent(event);
  }

  /**
   * Publish metrics update to Redis
   */
  async publishMetrics(merchantId: string, metrics: LiveMetric['metrics']): Promise<void> {
    if (this.redisSubscriber) {
      try {
        await (this.redisSubscriber as any).publish(
          'dashboard:metrics',
          JSON.stringify({ merchantId, metrics })
        );
      } catch (error) {
        console.error('[Dashboard] Failed to publish metrics:', error);
      }
    }

    this.updateMetricsCache(merchantId, metrics);
  }

  /**
   * Get connected clients count
   */
  getConnectedCount(merchantId?: string): number {
    if (merchantId) {
      return this.connectedClients.get(merchantId)?.size || 0;
    }

    let total = 0;
    this.connectedClients.forEach((clients) => {
      total += clients.size;
    });
    return total;
  }

  /**
   * Get metrics for merchant
   */
  getMetrics(merchantId: string): LiveMetric | null {
    return this.metricsCache.get(merchantId) || null;
  }

  /**
   * Clear metrics cache
   */
  clearMetrics(merchantId: string): void {
    this.metricsCache.delete(merchantId);
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    if (this.redisSubscriber) {
      await this.redisSubscriber.quit();
    }
    if (this.io) {
      this.io.close();
    }
  }
}

// Singleton instance
export const realtimeDashboardService = new RealtimeDashboardService();
export default realtimeDashboardService;

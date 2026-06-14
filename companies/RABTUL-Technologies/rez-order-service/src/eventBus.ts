// Event Bus Publisher for rez-order-service
import { bullmqRedis } from './config/redis';
import { logger } from './config/logger';

export interface ReZEvent {
  type: string;
  source: string;
  timestamp: Date;
  data: Record<string, unknown>;
  correlationId?: string;
}

export class OrderEventBus {
  private streamName = process.env.EVENT_STREAM_NAME || 'rez:events';
  private isEnabled = process.env.EVENT_BUS_ENABLED !== 'false';
  private source = 'rez-order-service';

  async publish(event: Omit<ReZEvent, 'source' | 'timestamp'>): Promise<string | null> {
    if (!this.isEnabled) {
      logger.debug('[OrderEventBus] Publishing disabled, skipping event', { type: event.type });
      return null;
    }

    try {
      const fullEvent: ReZEvent = {
        ...event,
        source: this.source,
        timestamp: new Date(),
      };

      const id = await bullmqRedis.xadd(
        this.streamName,
        '*',
        'type', fullEvent.type,
        'source', fullEvent.source,
        'timestamp', fullEvent.timestamp.toISOString(),
        'data', JSON.stringify(fullEvent.data),
        'correlationId', fullEvent.correlationId || ''
      );

      logger.debug('[OrderEventBus] Published event', { type: event.type, id });
      return id;
    } catch (error) {
      logger.error('[OrderEventBus] Failed to publish event', { type: event.type, error });
      return null;
    }
  }

  // Convenience methods for common order events
  async publishOrderCreated(orderId: string, data: Record<string, unknown>, correlationId?: string) {
    return this.publish({
      type: 'order.created',
      data: { orderId, ...data },
      correlationId,
    });
  }

  async publishOrderUpdated(orderId: string, data: Record<string, unknown>, correlationId?: string) {
    return this.publish({
      type: 'order.updated',
      data: { orderId, ...data },
      correlationId,
    });
  }

  async publishOrderCancelled(orderId: string, data: Record<string, unknown>, correlationId?: string) {
    return this.publish({
      type: 'order.cancelled',
      data: { orderId, ...data },
      correlationId,
    });
  }

  async publishOrderCompleted(orderId: string, data: Record<string, unknown>, correlationId?: string) {
    return this.publish({
      type: 'order.completed',
      data: { orderId, ...data },
      correlationId,
    });
  }

  async publishOrderStatusChanged(orderId: string, status: string, data: Record<string, unknown>, correlationId?: string) {
    return this.publish({
      type: 'order.status_changed',
      data: { orderId, status, ...data },
      correlationId,
    });
  }
}

export const orderEventBus = new OrderEventBus();

// Event Bus Publisher for rez-wallet-service
import { redis } from './config/redis';
import { createServiceLogger } from './config/logger';

const logger = createServiceLogger('event-bus');

export interface ReZEvent {
  type: string;
  source: string;
  timestamp: Date;
  data: Record<string, unknown>;
  correlationId?: string;
}

export class WalletEventBus {
  private streamName = process.env.EVENT_STREAM_NAME || 'rez:events';
  private isEnabled = process.env.EVENT_BUS_ENABLED !== 'false';
  private source = 'rez-wallet-service';

  async publish(event: Omit<ReZEvent, 'source' | 'timestamp'>): Promise<string | null> {
    if (!this.isEnabled) {
      logger.debug('[WalletEventBus] Publishing disabled, skipping event', { type: event.type });
      return null;
    }

    try {
      const fullEvent: ReZEvent = {
        ...event,
        source: this.source,
        timestamp: new Date(),
      };

      const id = await redis.xadd(
        this.streamName,
        '*',
        'type', fullEvent.type,
        'source', fullEvent.source,
        'timestamp', fullEvent.timestamp.toISOString(),
        'data', JSON.stringify(fullEvent.data),
        'correlationId', fullEvent.correlationId || ''
      );

      logger.debug('[WalletEventBus] Published event', { type: event.type, id });
      return id;
    } catch (error) {
      logger.error('[WalletEventBus] Failed to publish event', { type: event.type, error });
      return null;
    }
  }

  // Convenience methods for common wallet events
  async publishWalletDebited(walletId: string, data: Record<string, unknown>, correlationId?: string) {
    return this.publish({
      type: 'wallet.debited',
      data: { walletId, ...data },
      correlationId,
    });
  }

  async publishWalletCredited(walletId: string, data: Record<string, unknown>, correlationId?: string) {
    return this.publish({
      type: 'wallet.credited',
      data: { walletId, ...data },
      correlationId,
    });
  }

  async publishWalletBalanceUpdated(walletId: string, balance: number, data: Record<string, unknown>, correlationId?: string) {
    return this.publish({
      type: 'wallet.balance_updated',
      data: { walletId, balance, ...data },
      correlationId,
    });
  }

  async publishWalletCreated(walletId: string, data: Record<string, unknown>, correlationId?: string) {
    return this.publish({
      type: 'wallet.created',
      data: { walletId, ...data },
      correlationId,
    });
  }

  async publishWalletTransferCompleted(fromWalletId: string, toWalletId: string, data: Record<string, unknown>, correlationId?: string) {
    return this.publish({
      type: 'wallet.transfer_completed',
      data: { fromWalletId, toWalletId, ...data },
      correlationId,
    });
  }
}

export const walletEventBus = new WalletEventBus();

import type IORedis from 'ioredis';
import { logger } from './config/logger';
import { bullmqRedis } from './config/redis';

const GAME_CONFIG_UPDATE_CHANNEL = 'game-config:updated';

let subscriber: IORedis | null = null;

export async function startGameConfigSubscription(): Promise<void> {
  if (subscriber) return;

  const nextSubscriber = bullmqRedis.duplicate();
  subscriber = nextSubscriber;

  nextSubscriber.on('error', (err: Error) => {
    logger.error('[GameConfigSubscription] Redis subscriber error: ' + err.message);
  });

  await nextSubscriber.subscribe(GAME_CONFIG_UPDATE_CHANNEL);
  nextSubscriber.on('message', (_channel: string, message: string) => {
    try {
      const payload = JSON.parse(message) as {
        action?: string;
        gameType?: string;
        configId?: string;
        scope?: 'single' | 'all';
      };

      logger.info('[GameConfigSubscription] Received config update', {
        action: payload.action || 'unknown',
        gameType: payload.gameType || 'all',
        configId: payload.configId,
        scope: payload.scope || 'single',
      });
    } catch (error) {
      logger.warn('[GameConfigSubscription] Ignoring malformed game config event', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  logger.info('[GameConfigSubscription] Listening for game config updates');
}

export async function stopGameConfigSubscription(): Promise<void> {
  if (!subscriber) return;

  try {
    await subscriber.unsubscribe(GAME_CONFIG_UPDATE_CHANNEL);
    await subscriber.quit();
  } finally {
    subscriber = null;
  }
}

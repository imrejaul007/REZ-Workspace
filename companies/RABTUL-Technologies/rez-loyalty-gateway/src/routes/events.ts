/**
 * Events Routes - Event subscription and sync endpoints
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { CoinSyncEngine } from '../services/CoinSyncEngine.js';
import { BalanceAggregator } from '../services/BalanceAggregator.js';
import { TierManager } from '../services/TierManager.js';
import { CoinSyncEvent } from '../types/index.js';

const router = Router();

// Initialize services
const syncEngine = new CoinSyncEngine();
const balanceAggregator = new BalanceAggregator();
const tierManager = new TierManager();

/**
 * POST /api/v1/loyalty/events/subscribe
 * Register event handler for coin sync events
 */
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const SubscribeSchema = z.object({
      eventType: z.enum([
        'loyalty:coin:earned',
        'loyalty:coin:redeemed',
        'loyalty:coin:expired',
        'loyalty:tier:changed',
        'loyalty:sync:request',
      ]),
      callback: z.string().url('callback must be a valid URL'),
      secret: z.string().optional(),
    });

    const { eventType, callback, secret } = SubscribeSchema.parse(req.body);

    // Register handler that will POST to callback URL
    const handler = async (event: CoinSyncEvent) => {
      // In a real implementation, this would POST to the callback URL
      // For now, we'll just invalidate the user's cache
      await balanceAggregator.invalidateCache(event.userId);
      await tierManager.invalidateCache(event.userId);
    };

    syncEngine.on(eventType, handler);

    res.json({
      success: true,
      data: {
        subscribed: true,
        eventType,
        callback,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to subscribe',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/v1/loyalty/events/status
 * Get sync engine status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = {
      healthy: syncEngine.isHealthy(),
      processedEvents: syncEngine.getProcessedEventCount(),
    };

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get status',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/v1/loyalty/sync/:userId
 * Force sync from all services
 */
router.post('/sync/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Invalidate caches
    await balanceAggregator.invalidateCache(userId);
    await tierManager.invalidateCache(userId);

    // Publish sync request
    const eventId = await syncEngine.publishSyncRequest(userId);

    res.json({
      success: true,
      data: {
        userId,
        eventId,
        message: 'Sync request published',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to trigger sync',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/v1/loyalty/sync/:userId/status
 * Get sync status for a user
 */
router.get('/sync/:userId/status', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const status = await syncEngine.getSyncStatus(userId);

    res.json({
      success: true,
      data: {
        userId,
        ...status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/v1/loyalty/events/test
 * Test event publishing (for debugging)
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const TestEventSchema = z.object({
      eventType: z.enum(['coin.earned', 'coin.redeemed', 'coin.expired']),
      userId: z.string().min(1),
      coinType: z.string().default('REZ'),
      amount: z.number().positive(),
    });

    const { eventType, userId, coinType, amount } = TestEventSchema.parse(req.body);

    let eventId: string;

    switch (eventType) {
      case 'coin.earned':
        eventId = await syncEngine.publishCoinEarned({
          userId,
          coinType: coinType as any,
          amount,
          transactionId: `test-${Date.now()}`,
          referenceId: `test-ref-${Date.now()}`,
          sourceApp: 'test-client',
        });
        break;

      case 'coin.redeemed':
        eventId = await syncEngine.publishCoinRedeemed({
          userId,
          coinType: coinType as any,
          amount,
          transactionId: `test-${Date.now()}`,
          referenceId: `test-ref-${Date.now()}`,
          sourceApp: 'test-client',
        });
        break;

      case 'coin.expired':
        eventId = await syncEngine.publishCoinExpired({
          userId,
          coinType: coinType as any,
          amount,
          transactionId: `test-${Date.now()}`,
          referenceId: `test-ref-${Date.now()}`,
          sourceApp: 'test-client',
        });
        break;
    }

    res.json({
      success: true,
      data: {
        eventId,
        eventType,
        userId,
        coinType,
        amount,
        publishedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to publish test event',
      message: (error as Error).message,
    });
  }
});

export default router;
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { syncService, SyncAction } from '../services/syncService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const syncActionSchema = z.object({
  sessionId: z.string().min(1),
  action: z.enum([
    'create_session',
    'add_item',
    'update_item',
    'remove_item',
    'update_quantity',
    'checkout',
    'cancel_session',
  ]),
  payload: z.record(z.unknown()),
  localTimestamp: z.string().datetime(),
});

const bulkSyncSchema = z.object({
  actions: z.array(syncActionSchema),
});

/**
 * POST /api/sync
 * Sync offline actions
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.body.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validated = bulkSyncSchema.parse(req.body);

    const actions: SyncAction[] = validated.actions.map((a) => ({
      sessionId: a.sessionId,
      action: a.action,
      payload: a.payload as Record<string, unknown>,
      localTimestamp: new Date(a.localTimestamp),
    }));

    const result = await syncService.syncActions(userId, actions);

    res.json({
      success: result.success,
      synced: result.synced,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Sync error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Sync failed' });
  }
});

/**
 * GET /api/sync/pending
 * Get pending sync items
 */
router.get('/pending', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.query.userId as string;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const items = await syncService.getPendingSyncItems(userId);

    res.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    console.error('Get pending error:', error);
    res.status(500).json({ error: 'Failed to get pending items' });
  }
});

/**
 * POST /api/sync/retry
 * Retry failed syncs
 */
router.post('/retry', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.body.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await syncService.retryFailed(userId);

    res.json({
      success: result.success,
      synced: result.synced,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Retry error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Retry failed' });
  }
});

/**
 * POST /api/sync/queue
 * Queue an offline action
 */
router.post('/queue', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub || req.body.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { sessionId, action, payload } = req.body;

    if (!sessionId || !action) {
      return res.status(400).json({ error: 'sessionId and action are required' });
    }

    const syncId = await syncService.queueAction(
      userId,
      sessionId,
      action,
      payload || {}
    );

    res.status(201).json({
      success: true,
      syncId,
    });
  } catch (error) {
    console.error('Queue action error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to queue action' });
  }
});

export default router;

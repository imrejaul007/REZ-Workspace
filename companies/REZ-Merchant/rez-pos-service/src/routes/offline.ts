import { Router, Request, Response } from 'express';
import { getOfflineService, Operation, QueuedOperation } from '../services/offlineService';
import { getConflictResolver, Sale, Stock } from '../services/syncConflictResolver';

const router = Router();

// POST /api/offline/queue - Add operation to queue
router.post('/queue', async (req: Request, res: Response) => {
  try {
    const { id, type, payload } = req.body as Operation;

    if (!id || !type || !payload) {
      res.status(400).json({
        error: 'Missing required fields: id, type, payload',
        received: { id, type, payload: !!payload },
      });
      return;
    }

    const validTypes = ['sale', 'stock_update', 'refund', 'price_update'];
    if (!validTypes.includes(type)) {
      res.status(400).json({
        error: `Invalid operation type. Must be one of: ${validTypes.join(', ')}`,
      });
      return;
    }

    const offlineService = getOfflineService();
    const queueId = await offlineService.queueOperation({ id, type, payload });

    res.status(201).json({
      success: true,
      queueId,
      queuedAt: new Date().toISOString(),
      isOnline: offlineService.isOnline(),
    });
  } catch (error) {
    console.error('Failed to queue operation:', error);
    res.status(500).json({
      error: 'Failed to queue operation',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/offline/sync - Sync queued operations
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const offlineService = getOfflineService();

    if (!offlineService.isOnline()) {
      res.status(503).json({
        error: 'Network offline',
        message: 'Cannot sync while offline',
        queueStatus: offlineService.getQueueStatus(),
      });
      return;
    }

    const result = await offlineService.syncQueue();

    res.json({
      success: true,
      syncResult: result,
      queueStatus: offlineService.getQueueStatus(),
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync failed:', error);
    res.status(500).json({
      error: 'Sync failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/offline/status - Get offline status and queue info
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const offlineService = getOfflineService();

    const failedOps = offlineService.getFailedOperations();

    res.json({
      isOnline: offlineService.isOnline(),
      queueStatus: offlineService.getQueueStatus(),
      pendingOperations: offlineService.getQueueSize(),
      failedOperations: failedOps.map((op) => ({
        id: op.id,
        type: op.type,
        retryCount: op.retryCount,
        lastError: op.lastError,
        queuedAt: op.queuedAt,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get status:', error);
    res.status(500).json({
      error: 'Failed to get offline status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/offline/queue - Get all queued operations
router.get('/queue', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const offlineService = getOfflineService();

    const queue = offlineService.getQueueStatus();

    if (status === 'failed') {
      const failedOps = offlineService.getFailedOperations();
      res.json({
        operations: failedOps,
        count: failedOps.length,
      });
    } else if (status === 'pending') {
      // Get all pending (not yet synced)
      res.json({
        pending: queue.pending,
      });
    } else {
      res.json({
        queue,
      });
    }
  } catch (error) {
    console.error('Failed to get queue:', error);
    res.status(500).json({
      error: 'Failed to get queue',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/offline/queue/:id - Remove specific operation
router.delete('/queue/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const offlineService = getOfflineService();

    const removed = await offlineService.removeOperation(id);

    if (!removed) {
      res.status(404).json({
        error: 'Operation not found',
        id,
      });
      return;
    }

    res.json({
      success: true,
      removedId: id,
      queueStatus: offlineService.getQueueStatus(),
    });
  } catch (error) {
    console.error('Failed to remove operation:', error);
    res.status(500).json({
      error: 'Failed to remove operation',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/offline/queue - Clear synced operations
router.delete('/queue', async (_req: Request, res: Response) => {
  try {
    const offlineService = getOfflineService();
    const cleared = await offlineService.clearSynced();

    res.json({
      success: true,
      clearedCount: cleared,
      queueStatus: offlineService.getQueueStatus(),
    });
  } catch (error) {
    console.error('Failed to clear queue:', error);
    res.status(500).json({
      error: 'Failed to clear queue',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/offline/conflicts/resolve - Resolve sync conflicts
router.post('/conflicts/resolve', async (req: Request, res: Response) => {
  try {
    const { local, remote, type } = req.body as {
      local: Sale[] | Stock[];
      remote: Sale[] | Stock[];
      type: 'sale' | 'stock';
    };

    if (!local || !remote || !type) {
      res.status(400).json({
        error: 'Missing required fields: local, remote, type',
      });
      return;
    }

    const conflictResolver = getConflictResolver();

    let result;
    if (type === 'sale') {
      result = conflictResolver.resolveMultipleSales(
        local as Sale[],
        remote as Sale[]
      );
    } else if (type === 'stock') {
      result = conflictResolver.resolveMultipleStocks(
        local as Stock[],
        remote as Stock[]
      );
    } else {
      res.status(400).json({
        error: 'Invalid type. Must be "sale" or "stock"',
      });
      return;
    }

    res.json({
      success: true,
      type,
      result,
      resolvedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to resolve conflicts:', error);
    res.status(500).json({
      error: 'Failed to resolve conflicts',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/offline/conflicts/manual - Set manual resolution for a conflict
router.post('/conflicts/manual', async (req: Request, res: Response) => {
  try {
    const { id, resolvedData, type } = req.body as {
      id: string;
      resolvedData: Sale | Stock;
      type: 'sale' | 'stock';
    };

    if (!id || !resolvedData || !type) {
      res.status(400).json({
        error: 'Missing required fields: id, resolvedData, type',
      });
      return;
    }

    const conflictResolver = getConflictResolver();
    conflictResolver.setManualResolution(id, resolvedData);

    res.json({
      success: true,
      id,
      type,
      message: 'Manual resolution recorded',
      resolvedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to set manual resolution:', error);
    res.status(500).json({
      error: 'Failed to set manual resolution',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/offline/conflicts - Get pending manual conflicts
router.get('/conflicts', async (_req: Request, res: Response) => {
  try {
    const conflictResolver = getConflictResolver();
    const manualConflicts = conflictResolver.getManualConflicts();

    res.json({
      count: manualConflicts.size,
      conflicts: Array.from(manualConflicts.entries()).map(([id, data]) => ({
        id,
        data,
      })),
    });
  } catch (error) {
    console.error('Failed to get conflicts:', error);
    res.status(500).json({
      error: 'Failed to get conflicts',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/offline/retry - Retry failed operations
router.post('/retry', async (_req: Request, res: Response) => {
  try {
    const offlineService = getOfflineService();

    if (!offlineService.isOnline()) {
      res.status(503).json({
        error: 'Network offline',
        message: 'Cannot retry while offline',
      });
      return;
    }

    const result = await offlineService.retryFailed();

    res.json({
      success: true,
      syncResult: result,
      queueStatus: offlineService.getQueueStatus(),
      retriedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Retry failed:', error);
    res.status(500).json({
      error: 'Retry failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

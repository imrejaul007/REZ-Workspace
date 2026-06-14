import { Router, Response } from 'express';
import syncService from '../services/SyncService.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';
    const sourceId = req.query.sourceId as string | undefined;

    const syncs = await syncService.getSyncs(orgId, sourceId);

    res.json({
      success: true,
      data: syncs,
      count: syncs.length
    });
  } catch (error: any) {
    logger.error('Error getting syncs:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/stats', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';
    const sourceId = req.query.sourceId as string | undefined;

    const stats = await syncService.getSyncStats(orgId, sourceId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Error getting sync stats:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const sync = await syncService.getSyncById(id, orgId);

    if (!sync) {
      res.status(404).json({
        success: false,
        error: 'Sync not found'
      });
      return;
    }

    res.json({
      success: true,
      data: sync
    });
  } catch (error: any) {
    logger.error(`Error getting sync ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:id/cancel', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const cancelled = await syncService.cancelSync(id, orgId);

    res.json({
      success: cancelled,
      message: cancelled ? 'Sync cancelled' : 'Sync cannot be cancelled'
    });
  } catch (error: any) {
    logger.error(`Error cancelling sync ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/source/:sourceId/history', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sourceId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    const history = await syncService.getSyncHistory(sourceId, days);

    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error: any) {
    logger.error(`Error getting sync history for source ${req.params.sourceId}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
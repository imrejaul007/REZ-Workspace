import { Router, Response } from 'express';
import { comparisonService } from '../services/ComparisonService.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await comparisonService.listComparisons(orgId, page, limit);

    res.json({
      success: true,
      data: result.comparisons,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error: any) {
    logger.error('Error listing comparisons:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/stats', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';
    const stats = await comparisonService.getComparisonStats(orgId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Error getting comparison stats:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const comparison = await comparisonService.getComparisonById(id, orgId);

    if (!comparison) {
      res.status(404).json({ success: false, error: 'Comparison not found' });
      return;
    }

    res.json({
      success: true,
      data: comparison
    });
  } catch (error: any) {
    logger.error(`Error getting comparison ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const deleted = await comparisonService.deleteComparison(id, orgId);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Comparison not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Comparison deleted successfully'
    });
  } catch (error: any) {
    logger.error(`Error deleting comparison ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
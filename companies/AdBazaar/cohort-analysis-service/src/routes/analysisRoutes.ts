import { Router, Response } from 'express';
import { analysisService } from '../services/AnalysisService.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await analysisService.listAnalyses(orgId, page, limit);

    res.json({
      success: true,
      data: result.analyses,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error: any) {
    logger.error('Error listing analyses:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/stats', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';
    const stats = await analysisService.getAnalysisStats(orgId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Error getting analysis stats:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/cohort/:cohortId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { cohortId } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const analyses = await analysisService.getAnalysisByCohort(cohortId, orgId);

    res.json({
      success: true,
      data: analyses
    });
  } catch (error: any) {
    logger.error(`Error getting analyses for cohort ${req.params.cohortId}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const analysis = await analysisService.getAnalysisById(id, orgId);

    if (!analysis) {
      res.status(404).json({ success: false, error: 'Analysis not found' });
      return;
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    logger.error(`Error getting analysis ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const deleted = await analysisService.deleteAnalysis(id, orgId);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Analysis not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Analysis deleted successfully'
    });
  } catch (error: any) {
    logger.error(`Error deleting analysis ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
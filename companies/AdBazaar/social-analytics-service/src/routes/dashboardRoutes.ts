import { Router, Response } from 'express';
import { dashboardService } from '../services';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { createChildLogger } from '../utils/logger';

const logger = createChildLogger('DashboardRoutes');
const router = Router();

// Get dashboard data
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = await dashboardService.getDashboardData(req.userId!, days);
    res.json(data);
  } catch (error) {
    logger.error('Error getting dashboard data', { error });
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Get platform-specific dashboard
router.get('/:platform', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { platform } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data = await dashboardService.getDashboardData(req.userId!, days);
    const platformData = data.platforms.find(p => p.platform === platform);

    res.json({
      ...platformData,
      trends: data.trends,
      topPosts: data.topPosts.filter(p => p.platform === platform)
    });
  } catch (error) {
    logger.error('Error getting platform dashboard', { error });
    res.status(500).json({ error: 'Failed to get platform dashboard' });
  }
});

export default router;
import { Router } from 'express';
import { analyticsController } from '../controllers';

const router = Router();

// Get overall analytics
router.get(
  '/',
  analyticsController.getAnalytics.bind(analyticsController)
);

// Get user analytics
router.get(
  '/user/:userId',
  analyticsController.getUserAnalytics.bind(analyticsController)
);

// Get channel analytics
router.get(
  '/channel/:channel',
  analyticsController.getChannelAnalytics.bind(analyticsController)
);

// Get template performance
router.get(
  '/template/:templateId',
  analyticsController.getTemplatePerformance.bind(analyticsController)
);

// Get hourly distribution
router.get(
  '/distribution/hourly',
  analyticsController.getHourlyDistribution.bind(analyticsController)
);

// Get recent activity
router.get(
  '/activity',
  analyticsController.getRecentActivity.bind(analyticsController)
);

export default router;

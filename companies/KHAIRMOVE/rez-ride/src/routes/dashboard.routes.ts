import { logger } from '../../shared/logger';
import { Router, Request, Response } from 'express';
import { ecosystemService } from '../services/ecosystem.service';
import { intelligenceService } from '../services/intelligence.service';
import { rabtulService } from '../services/rabtul.service';
import { mediaService } from '../services/media.service';
import { corporateService } from '../services/corporate.service';

const router = Router();

/**
 * @route GET /api/dashboard/user/:userId
 * @desc Get personalized user dashboard with all ecosystem data
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const experience = await ecosystemService.getPersonalizedExperience(userId);

    res.json({
      success: true,
      data: experience,
    });
  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

/**
 * @route GET /api/dashboard/driver/:driverId
 * @desc Get driver dashboard with insights
 */
router.get('/driver/:driverId', async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;

    const [insights, karma, doohContent] = await Promise.all([
      intelligenceService.getDriverInsights(driverId),
      mediaService.getKarmaPoints(driverId),
      // DOOH would need screenId
      Promise.resolve({ ads: [], campaignInfo: null }),
    ]);

    res.json({
      success: true,
      data: {
        insights,
        karma,
        earnings: {
          today: 0,
          week: 0,
          month: 0,
        },
        doohContent,
      },
    });
  } catch (error) {
    logger.error('Driver dashboard error:', error);
    res.status(500).json({ error: 'Failed to load driver dashboard' });
  }
});

/**
 * @route GET /api/dashboard/corporate/:companyId
 * @desc Get corporate admin dashboard
 */
router.get('/corporate/:companyId', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    const [policy, invoices, employees] = await Promise.all([
      corporateService.getCompanyPolicy(companyId),
      corporateService.getCompanyInvoices(companyId),
      corporateService.getCompanyEmployees(companyId),
    ]);

    res.json({
      success: true,
      data: {
        policy,
        invoices,
        employees: employees.length,
        stats: {
          totalRides: 0,
          totalSpend: invoices.reduce((sum, inv) => sum + inv.total, 0),
          pendingInvoices: invoices.filter(i => i.status === 'pending').length,
        },
      },
    });
  } catch (error) {
    logger.error('Corporate dashboard error:', error);
    res.status(500).json({ error: 'Failed to load corporate dashboard' });
  }
});

/**
 * @route GET /api/dashboard/executive
 * @desc Get executive overview dashboard
 */
router.get('/executive', async (req: Request, res: Response) => {
  try {
    const metrics = await rabtulService.getDashboardMetrics();

    res.json({
      success: true,
      data: {
        gmv: {
          today: 0,
          week: 0,
          month: 0,
        },
        rides: {
          today: 0,
          week: 0,
          month: 0,
        },
        users: {
          active: 0,
          new: 0,
          churned: 0,
        },
        drivers: {
          active: 0,
          online: 0,
        },
        karma: {
          pointsIssued: 0,
          redemptions: 0,
        },
        ads: {
          impressions: 0,
          revenue: 0,
        },
      },
    });
  } catch (error) {
    logger.error('Executive dashboard error:', error);
    res.status(500).json({ error: 'Failed to load executive dashboard' });
  }
});

/**
 * @route GET /api/dashboard/analytics
 * @desc Get analytics overview
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    res.json({
      success: true,
      data: {
        segments: {
          champions: { count: 0, percentage: 0 },
          active: { count: 0, percentage: 0 },
          atRisk: { count: 0, percentage: 0 },
          churning: { count: 0, percentage: 0 },
        },
        churnRate: 0,
        retentionRate: 0,
        ltv: {
          average: 0,
          predicted: 0,
        },
        intentAccuracy: 0,
      },
    });
  } catch (error) {
    logger.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

/**
 * @route GET /api/dashboard/recommendations/user/:userId
 * @desc Get personalized recommendations for user
 */
router.get('/recommendations/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { lat, lng } = req.query;

    const recommendations = await intelligenceService.getRecommendations(userId, {
      lat: parseFloat(lat as string) || 12.9716,
      lng: parseFloat(lng as string) || 77.5946,
      time: new Date(),
    });

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    logger.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to load recommendations' });
  }
});

export default router;

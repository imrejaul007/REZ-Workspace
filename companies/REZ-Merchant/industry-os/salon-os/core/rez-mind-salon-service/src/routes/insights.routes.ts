import { Router, Request, Response } from 'express';
import { CustomerInsights } from '../services/CustomerInsights';
import { RecommendationEngine } from '../services/RecommendationEngine';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';

// Validation schemas
const VisitRecordSchema = z.object({
  date: z.string(),
  services: z.array(z.string()),
  stylistId: z.string(),
  satisfaction: z.number().optional(),
});

const CustomerProfileSchema = z.object({
  customerId: z.string(),
  hairType: z.enum(['straight', 'wavy', 'curly', 'coily']).optional(),
  hairTexture: z.enum(['fine', 'medium', 'coarse']).optional(),
  scalpCondition: z.enum(['normal', 'oily', 'dry', 'sensitive']).optional(),
  colorHistory: z.array(z.string()).optional(),
  stylePreferences: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  lastVisits: z.array(VisitRecordSchema).default([]),
});

export function insightsRoutes(
  customerInsights: CustomerInsights,
  recommendationEngine: RecommendationEngine
): Router {
  const router = Router();

  // Apply authentication to all routes
  router.use(authenticateToken);

  // ============ CHURN PREDICTION ROUTES ============

  /**
   * GET /api/insights/churn/:customerId
   * Predict churn risk for a customer
   */
  router.get('/churn/:customerId', async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;
      const prediction = await customerInsights.predictChurn(customerId);

      res.json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      logger.error('Churn prediction error:', error);
      res.status(500).json({ success: false, error: 'Failed to predict churn' });
    }
  });

  /**
   * GET /api/insights/churn/at-risk/list
   * Get all customers at risk of churn
   */
  router.get('/churn/at-risk/list', async (_req: Request, res: Response) => {
    try {
      const predictions = await customerInsights.getChurnRiskCustomers();

      res.json({
        success: true,
        data: {
          total: predictions.length,
          highRisk: predictions.filter((p) => p.churnRisk === 'high').length,
          mediumRisk: predictions.filter((p) => p.churnRisk === 'medium').length,
          customers: predictions,
        },
      });
    } catch (error) {
      logger.error('At-risk customers error:', error);
      res.status(500).json({ success: false, error: 'Failed to get at-risk customers' });
    }
  });

  // ============ LTV ROUTES ============

  /**
   * GET /api/insights/ltv/:customerId
   * Calculate customer lifetime value
   */
  router.get('/ltv/:customerId', async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;
      const ltv = await customerInsights.calculateLTV(customerId);

      res.json({
        success: true,
        data: ltv,
      });
    } catch (error) {
      logger.error('LTV calculation error:', error);
      res.status(500).json({ success: false, error: 'Failed to calculate LTV' });
    }
  });

  /**
   * GET /api/insights/ltv/top
   * Get top customers by lifetime value
   */
  router.get('/ltv/top', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      // In production, this would query the database
      const topCustomers = [
        { customerId: 'cust-004', currentValue: 3200, predictedValue: 8500 },
        { customerId: 'cust-001', currentValue: 1250, predictedValue: 4200 },
      ];

      res.json({
        success: true,
        data: topCustomers.slice(0, limit),
      });
    } catch (error) {
      logger.error('Top LTV customers error:', error);
      res.status(500).json({ success: false, error: 'Failed to get top LTV customers' });
    }
  });

  // ============ STYLIST ANALYTICS ROUTES ============

  /**
   * GET /api/insights/stylist/:stylistId
   * Get stylist productivity metrics
   */
  router.get('/stylist/:stylistId', async (req: Request, res: Response) => {
    try {
      const { stylistId } = req.params;
      const period = (req.query.period as string) || '30d';
      const metrics = await customerInsights.getStylistProductivity(stylistId, period);

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Stylist metrics error:', error);
      res.status(500).json({ success: false, error: 'Failed to get stylist metrics' });
    }
  });

  /**
   * GET /api/insights/stylist/:stylistId/comparison
   * Compare stylist performance
   */
  router.get('/stylist/:stylistId/comparison', async (req: Request, res: Response) => {
    try {
      const { stylistId } = req.params;
      const metrics = await customerInsights.getStylistProductivity(stylistId);

      res.json({
        success: true,
        data: {
          stylist: metrics,
          benchmarks: {
            avgServiceValue: 42.5,
            avgRating: 4.6,
            avgUtilization: 0.75,
          },
        },
      });
    } catch (error) {
      logger.error('Stylist comparison error:', error);
      res.status(500).json({ success: false, error: 'Failed to compare stylists' });
    }
  });

  // ============ SEASONAL TRENDS ROUTES ============

  /**
   * GET /api/insights/seasonal
   * Get seasonal trend analysis
   */
  router.get('/seasonal', async (req: Request, res: Response) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const trends = await customerInsights.getSeasonalTrends(year);

      // Calculate summary statistics
      const totalRevenue = trends.reduce((sum, t) => sum + t.totalRevenue, 0);
      const totalCustomers = trends.reduce((sum, t) => sum + t.totalCustomers, 0);
      const peakMonth = trends.reduce((max, t) => (t.totalRevenue > max.totalRevenue ? t : max));
      const slowMonth = trends.reduce((min, t) => (t.totalRevenue < min.totalRevenue ? t : min));

      res.json({
        success: true,
        data: {
          trends,
          summary: {
            totalRevenue,
            totalCustomers,
            avgTransactionValue: Math.round((totalRevenue / totalCustomers) * 100) / 100,
            peakMonth: peakMonth.month,
            peakRevenue: peakMonth.totalRevenue,
            slowMonth: slowMonth.month,
            slowRevenue: slowMonth.totalRevenue,
          },
        },
      });
    } catch (error) {
      logger.error('Seasonal trends error:', error);
      res.status(500).json({ success: false, error: 'Failed to get seasonal trends' });
    }
  });

  // ============ RECOMMENDATION ROUTES ============

  /**
   * GET /api/insights/recommendations/:customerId
   * Get personalized service recommendations
   */
  router.get('/recommendations/:customerId', async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const recommendations = await recommendationEngine.getRecommendations(customerId, { limit });

      res.json({
        success: true,
        data: {
          customerId,
          recommendations,
        },
      });
    } catch (error) {
      logger.error('Recommendations error:', error);
      res.status(500).json({ success: false, error: 'Failed to get recommendations' });
    }
  });

  /**
   * POST /api/insights/recommendations/upsell
   * Get upsell suggestions for current booking
   */
  router.post('/recommendations/upsell', async (req: Request, res: Response) => {
    try {
      const { currentService, customerId } = req.body;
      if (!currentService) {
        res.status(400).json({ success: false, error: 'currentService is required' });
        return;
      }

      const suggestions = await recommendationEngine.getUpsellSuggestions(currentService, customerId);

      res.json({
        success: true,
        data: {
          suggestions,
          expectedConversionLift: Math.round(
            suggestions.reduce((sum, s) => sum + s.conversionProbability, 0) /
              suggestions.length *
              100
          ),
        },
      });
    } catch (error) {
      logger.error('Upsell suggestions error:', error);
      res.status(500).json({ success: false, error: 'Failed to get upsell suggestions' });
    }
  });

  // ============ CUSTOMER PROFILE ROUTES ============

  /**
   * GET /api/insights/customer/:customerId
   * Get customer profile
   */
  router.get('/customer/:customerId', async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;
      const customer = await customerInsights.getCustomer(customerId);

      if (!customer) {
        res.status(404).json({ success: false, error: 'Customer not found' });
        return;
      }

      res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      logger.error('Customer profile error:', error);
      res.status(500).json({ success: false, error: 'Failed to get customer profile' });
    }
  });

  /**
   * PUT /api/insights/customer/:customerId
   * Update customer profile
   */
  router.put('/customer/:customerId', async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;
      const profile = CustomerProfileSchema.parse(req.body);

      if (profile.customerId !== customerId) {
        res.status(400).json({ success: false, error: 'Customer ID mismatch' });
        return;
      }

      await recommendationEngine.updateCustomerProfile(profile);

      res.json({
        success: true,
        message: 'Customer profile updated',
      });
    } catch (error) {
      logger.error('Customer update error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      } else {
        res.status(500).json({ success: false, error: 'Failed to update customer' });
      }
    }
  });

  // ============ DASHBOARD SUMMARY ============

  /**
   * GET /api/insights/dashboard
   * Get overall business insights dashboard
   */
  router.get('/dashboard', async (_req: Request, res: Response) => {
    try {
      const atRisk = await customerInsights.getChurnRiskCustomers();
      const trends = await customerInsights.getSeasonalTrends();

      res.json({
        success: true,
        data: {
          churn: {
            highRiskCount: atRisk.filter((p) => p.churnRisk === 'high').length,
            mediumRiskCount: atRisk.filter((p) => p.churnRisk === 'medium').length,
            totalAtRisk: atRisk.length,
          },
          trends: {
            totalRevenue: trends.reduce((sum, t) => sum + t.totalRevenue, 0),
            peakMonth: trends.reduce((max, t) => (t.totalRevenue > max.totalRevenue ? t : max)).month,
          },
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Dashboard error:', error);
      res.status(500).json({ success: false, error: 'Failed to get dashboard data' });
    }
  });

  return router;
}

import { Router, Request, Response } from 'express';
import { PricingEngine } from '../services/PricingEngine';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';

// Validation schemas
const CalculatePriceSchema = z.object({
  serviceId: z.string(),
  stylistId: z.string().optional(),
  appointmentDate: z.string(),
  customerId: z.string().optional(),
  basePrice: z.number().positive(),
});

const UpdateCompetitorSchema = z.object({
  competitorId: z.string(),
  serviceId: z.string(),
  price: z.number().positive(),
  location: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

export function pricingRoutes(pricingEngine: PricingEngine): Router {
  const router = Router();

  // Apply authentication to all routes
  router.use(authenticateToken);

  /**
   * POST /api/pricing/calculate
   * Calculate dynamic price for a service
   */
  router.post('/calculate', async (req: Request, res: Response) => {
    try {
      const validated = CalculatePriceSchema.parse(req.body);
      const result = await pricingEngine.calculatePrice(validated);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Price calculation error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      } else {
        res.status(500).json({ success: false, error: 'Failed to calculate price' });
      }
    }
  });

  /**
   * POST /api/pricing/competitor
   * Update competitor pricing data
   */
  router.post('/competitor', async (req: Request, res: Response) => {
    try {
      const data = {
        ...UpdateCompetitorSchema.parse(req.body),
        timestamp: req.body.timestamp || new Date().toISOString(),
      };
      await pricingEngine.updateCompetitorPricing(data);

      res.json({
        success: true,
        message: 'Competitor pricing updated',
      });
    } catch (error) {
      logger.error('Competitor pricing update error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
      } else {
        res.status(500).json({ success: false, error: 'Failed to update competitor pricing' });
      }
    }
  });

  /**
   * GET /api/pricing/recommendations
   * Get price recommendations for all services
   */
  router.get('/recommendations', async (_req: Request, res: Response) => {
    try {
      const recommendations = await pricingEngine.getPriceRecommendations();

      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error) {
      logger.error('Price recommendations error:', error);
      res.status(500).json({ success: false, error: 'Failed to get recommendations' });
    }
  });

  /**
   * GET /api/pricing/competitor/:serviceId
   * Get competitor analysis for a specific service
   */
  router.get('/competitor/:serviceId', async (req: Request, res: Response) => {
    try {
      const { serviceId } = req.params;
      const analysis = await pricingEngine.analyzeCompetitorPricing(serviceId);

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      logger.error('Competitor analysis error:', error);
      res.status(500).json({ success: false, error: 'Failed to analyze competitor pricing' });
    }
  });

  /**
   * GET /api/pricing/batch
   * Calculate prices for multiple services at once
   */
  router.post('/batch', async (req: Request, res: Response) => {
    try {
      const { services, appointmentDate, stylistId, customerId } = req.body;

      if (!Array.isArray(services)) {
        res.status(400).json({ success: false, error: 'Services must be an array' });
        return;
      }

      const results = await Promise.all(
        services.map(async (service: { serviceId: string; basePrice: number }) => {
          const result = await pricingEngine.calculatePrice({
            serviceId: service.serviceId,
            basePrice: service.basePrice,
            appointmentDate,
            stylistId,
            customerId,
          });
          return {
            serviceId: service.serviceId,
            ...result,
          };
        })
      );

      const totalOriginal = results.reduce((sum, r) => sum + r.originalPrice, 0);
      const totalFinal = results.reduce((sum, r) => sum + r.finalPrice, 0);

      res.json({
        success: true,
        data: {
          services: results,
          summary: {
            totalOriginalPrice: totalOriginal,
            totalFinalPrice: totalFinal,
            savings: totalOriginal - totalFinal,
            averageMultiplier:
              results.reduce((sum, r) => sum + r.finalPrice / r.originalPrice, 0) / results.length,
          },
        },
      });
    } catch (error) {
      logger.error('Batch pricing error:', error);
      res.status(500).json({ success: false, error: 'Failed to calculate batch prices' });
    }
  });

  return router;
}

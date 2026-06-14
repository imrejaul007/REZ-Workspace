import { Router, Response } from 'express';
import { z } from 'zod';
import { metricService } from '../services/MetricService.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

const CreateMetricSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['performance', 'financial', 'engagement', 'conversion']),
  calculation: z.object({
    type: z.enum(['sum', 'avg', 'count', 'percentage', 'custom']),
    formula: z.string().optional(),
    sources: z.array(z.string())
  }),
  unit: z.string().optional(),
  format: z.string().optional(),
  aggregation: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('daily')
});

const UpdateMetricSchema = CreateMetricSchema.partial();

const CalculateMetricSchema = z.object({
  sources: z.array(z.string()),
  dateRange: z.object({
    start: z.string().transform(s => new Date(s)),
    end: z.string().transform(s => new Date(s))
  })
});

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';
    const category = req.query.category as string | undefined;

    const metrics = await metricService.getMetrics(orgId, category);

    res.json({
      success: true,
      data: metrics,
      count: metrics.length
    });
  } catch (error: any) {
    logger.error('Error getting metrics:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/categories', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId || 'default';
    const categories = await metricService.getMetricCategories(orgId);

    res.json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    logger.error('Error getting categories:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validated = CreateMetricSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const metric = await metricService.createMetric({
      ...validated,
      organizationId: orgId
    });

    res.status(201).json({
      success: true,
      data: metric
    });
  } catch (error: any) {
    logger.error('Error creating metric:', error);
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

    const metric = await metricService.getMetricById(id, orgId);

    if (!metric) {
      res.status(404).json({
        success: false,
        error: 'Metric not found'
      });
      return;
    }

    res.json({
      success: true,
      data: metric
    });
  } catch (error: any) {
    logger.error(`Error getting metric ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validated = UpdateMetricSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const metric = await metricService.updateMetric(id, validated, orgId);

    if (!metric) {
      res.status(404).json({
        success: false,
        error: 'Metric not found'
      });
      return;
    }

    res.json({
      success: true,
      data: metric
    });
  } catch (error: any) {
    logger.error(`Error updating metric ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.organizationId || 'default';

    const deleted = await metricService.deleteMetric(id, orgId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Metric not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Metric deleted successfully'
    });
  } catch (error: any) {
    logger.error(`Error deleting metric ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:key/calculate', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { key } = req.params;
    const validated = CalculateMetricSchema.parse(req.body);
    const orgId = req.user?.organizationId || 'default';

    const result = await metricService.calculateMetric(
      key,
      validated.sources,
      validated.dateRange,
      orgId
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error(`Error calculating metric ${req.params.key}:`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { experimentService } from '../services/experiment.service';
import { Experiment } from '../models/experiment.model';
import { Assignment } from '../models/assignment.model';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Validation schemas
const createExperimentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(['ab', 'multivariate', 'feature_flag', 'canary', 'champion_challenger']).optional(),
  owner: z.string().min(1),
  team: z.string().optional(),
  tags: z.array(z.string()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  trafficPercentage: z.number().min(0).max(100).optional(),
  targeting: z.object({
    userIds: z.array(z.string()).optional(),
    segments: z.array(z.string()).optional(),
    countries: z.array(z.string()).optional(),
    platforms: z.array(z.string()).optional(),
    userTypes: z.array(z.string()).optional()
  }).optional(),
  variants: z.array(z.object({
    name: z.string().min(1).max(100),
    weight: z.number().min(0).max(1000),
    description: z.string().max(500).optional()
  })).min(1),
  metrics: z.array(z.object({
    name: z.string().min(1).max(100),
    type: z.enum(['conversion', 'revenue', 'engagement', 'retention', 'custom']),
    unit: z.string().min(1),
    higherIsBetter: z.boolean().optional()
  })).min(1),
  guardrails: z.array(z.object({
    metricName: z.string(),
    minValue: z.number(),
    maxValue: z.number()
  })).optional(),
  hypothesis: z.string().max(500).optional()
});

function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.issues
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

// POST /api/experiments - Create experiment
router.post('/', authMiddleware, validateBody(createExperimentSchema), async (req: Request, res: Response) => {
  try {
    const experiment = await experimentService.create(req.body);

    res.status(201).json({
      success: true,
      data: experiment
    });
  } catch (error) {
    logger.error('Create experiment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create experiment'
    });
  }
});

// GET /api/experiments - List experiments
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      type: req.query.type as string,
      owner: req.query.owner as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    const result = await experimentService.list(filters);

    res.json({
      success: true,
      data: result.experiments,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        pages: Math.ceil(result.total / filters.limit)
      }
    });
  } catch (error) {
    logger.error('List experiments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list experiments'
    });
  }
});

// GET /api/experiments/:id - Get experiment by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const experiment = await experimentService.findById(req.params.id);

    if (!experiment) {
      res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
      return;
    }

    // Get variant stats
    const stats = await Assignment.aggregate([
      { $match: { experimentId: req.params.id } },
      {
        $group: {
          _id: '$variantId',
          assignments: { $sum: 1 },
          conversions: { $sum: { $cond: ['$converted', 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        ...experiment.toObject(),
        stats: stats.reduce((acc, s) => {
          acc[s._id] = s;
          return acc;
        }, {} as Record<string, unknown>)
      }
    });
  } catch (error) {
    logger.error('Get experiment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get experiment'
    });
  }
});

// POST /api/experiments/:id/activate - Activate experiment
router.post('/:id/activate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const experiment = await experimentService.activate(req.params.id);

    if (!experiment) {
      res.status(404).json({
        success: false,
        error: 'Experiment not found or cannot be activated'
      });
      return;
    }

    res.json({
      success: true,
      data: experiment
    });
  } catch (error) {
    logger.error('Activate experiment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate experiment'
    });
  }
});

// POST /api/experiments/:id/pause - Pause experiment
router.post('/:id/pause', authMiddleware, async (req: Request, res: Response) => {
  try {
    const experiment = await experimentService.pause(req.params.id);

    if (!experiment) {
      res.status(404).json({
        success: false,
        error: 'Experiment not found or cannot be paused'
      });
      return;
    }

    res.json({
      success: true,
      data: experiment
    });
  } catch (error) {
    logger.error('Pause experiment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause experiment'
    });
  }
});

// POST /api/experiments/:id/complete - Complete experiment
router.post('/:id/complete', authMiddleware, async (req: Request, res: Response) => {
  try {
    const experiment = await experimentService.complete(req.params.id);

    if (!experiment) {
      res.status(404).json({
        success: false,
        error: 'Experiment not found or cannot be completed'
      });
      return;
    }

    res.json({
      success: true,
      data: experiment
    });
  } catch (error) {
    logger.error('Complete experiment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete experiment'
    });
  }
});

// POST /api/experiments/:id/enroll - Enroll user
router.post('/:id/enroll', async (req: Request, res: Response) => {
  try {
    const { userId, metadata } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required'
      });
      return;
    }

    const result = await experimentService.enrollUser(req.params.id, userId, metadata);

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Experiment not found or not active'
      });
      return;
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Enroll user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enroll user'
    });
  }
});

// POST /api/experiments/:id/convert - Record conversion
router.post('/:id/convert', async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.body;

    if (!assignmentId) {
      res.status(400).json({
        success: false,
        error: 'assignmentId is required'
      });
      return;
    }

    const success = await experimentService.recordConversion(assignmentId);

    res.json({
      success: true,
      data: { recorded: success }
    });
  } catch (error) {
    logger.error('Record conversion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record conversion'
    });
  }
});

// POST /api/experiments/:id/metric - Record metric
router.post('/:id/metric', async (req: Request, res: Response) => {
  try {
    const { variantId, metricName, value, sampleSize } = req.body;

    if (!variantId || !metricName || value === undefined) {
      res.status(400).json({
        success: false,
        error: 'variantId, metricName, and value are required'
      });
      return;
    }

    await experimentService.recordMetric(req.params.id, variantId, metricName, value, sampleSize);

    res.json({
      success: true,
      data: { recorded: true }
    });
  } catch (error) {
    logger.error('Record metric error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record metric'
    });
  }
});

// GET /api/experiments/:id/analytics - Get analytics
router.get('/:id/analytics', authMiddleware, async (req: Request, res: Response) => {
  try {
    const analytics = await experimentService.getAnalytics(req.params.id);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics'
    });
  }
});

// DELETE /api/experiments/:id - Archive experiment
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const deleted = await experimentService.delete(req.params.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Experiment not found'
      });
      return;
    }

    res.json({
      success: true,
      data: { archived: true }
    });
  } catch (error) {
    logger.error('Delete experiment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete experiment'
    });
  }
});

export default router;
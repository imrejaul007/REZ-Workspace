import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { testService, CreateTestInput, UpdateTestInput } from '../services/test.service';
import { Variant } from '../models/variant.model';
import { authMiddleware } from '../middleware/auth';
import { variantImpressions, variantConversions } from '../utils/metrics';
import { v4 as uuidv4 } from 'uuid';
import { Result } from '../models/result.model';

const router = Router();

// Validation schemas
const createTestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  hypothesis: z.string().max(500).optional(),
  type: z.enum(['ab', 'multivariate', 'bandit']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  trafficAllocation: z.number().min(1).max(100).optional(),
  targetAudience: z.object({
    segments: z.array(z.string()).optional(),
    countries: z.array(z.string()).optional(),
    platforms: z.array(z.string()).optional()
  }).optional(),
  primaryMetric: z.enum(['ctr', 'conversion', 'revenue', 'engagement', 'custom']).optional(),
  secondaryMetrics: z.array(z.string()).optional(),
  minimumSampleSize: z.number().int().positive().optional(),
  confidenceLevel: z.number().min(0.5).max(0.99).optional(),
  variants: z.array(z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    isControl: z.boolean().optional(),
    trafficWeight: z.number().min(0).max(100).optional(),
    configuration: z.record(z.unknown()).optional()
  })).optional()
});

const updateTestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  hypothesis: z.string().max(500).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  trafficAllocation: z.number().min(1).max(100).optional(),
  targetAudience: z.object({
    segments: z.array(z.string()).optional(),
    countries: z.array(z.string()).optional(),
    platforms: z.array(z.string()).optional()
  }).optional(),
  primaryMetric: z.enum(['ctr', 'conversion', 'revenue', 'engagement', 'custom']).optional(),
  secondaryMetrics: z.array(z.string()).optional(),
  minimumSampleSize: z.number().int().positive().optional(),
  confidenceLevel: z.number().min(0.5).max(0.99).optional()
});

// Validation middleware
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

// POST /api/tests - Create a new test
router.post('/', authMiddleware, validateBody(createTestSchema), async (req: Request, res: Response) => {
  try {
    const input: CreateTestInput = req.body;
    const test = await testService.create(input, req.user!.userId);

    res.status(201).json({
      success: true,
      data: test
    });
  } catch (error) {
    logger.error('Create test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test'
    });
  }
});

// GET /api/tests/:id - Get test by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const test = await testService.findById(req.params.id);
    if (!test) {
      res.status(404).json({
        success: false,
        error: 'Test not found'
      });
      return;
    }

    // Get variants
    const variants = await Variant.find({ testId: test.testId, status: 'active' });

    res.json({
      success: true,
      data: {
        ...test.toObject(),
        variants
      }
    });
  } catch (error) {
    logger.error('Get test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test'
    });
  }
});

// PUT /api/tests/:id - Update test
router.put('/:id', authMiddleware, validateBody(updateTestSchema), async (req: Request, res: Response) => {
  try {
    const input: UpdateTestInput = req.body;
    const test = await testService.update(req.params.id, input);

    if (!test) {
      res.status(404).json({
        success: false,
        error: 'Test not found'
      });
      return;
    }

    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    logger.error('Update test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update test'
    });
  }
});

// POST /api/tests/:id/start - Start test
router.post('/:id/start', authMiddleware, async (req: Request, res: Response) => {
  try {
    const test = await testService.start(req.params.id);

    if (!test) {
      res.status(404).json({
        success: false,
        error: 'Test not found or cannot be started'
      });
      return;
    }

    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    logger.error('Start test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start test'
    });
  }
});

// POST /api/tests/:id/pause - Pause test
router.post('/:id/pause', authMiddleware, async (req: Request, res: Response) => {
  try {
    const test = await testService.pause(req.params.id);

    if (!test) {
      res.status(404).json({
        success: false,
        error: 'Test not found or cannot be paused'
      });
      return;
    }

    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    logger.error('Pause test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause test'
    });
  }
});

// POST /api/tests/:id/complete - Complete test
router.post('/:id/complete', authMiddleware, async (req: Request, res: Response) => {
  try {
    const test = await testService.complete(req.params.id);

    if (!test) {
      res.status(404).json({
        success: false,
        error: 'Test not found or cannot be completed'
      });
      return;
    }

    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    logger.error('Complete test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete test'
    });
  }
});

// GET /api/tests/:id/results - Get test results
router.get('/:id/results', authMiddleware, async (req: Request, res: Response) => {
  try {
    const granularity = req.query.granularity as 'hourly' | 'daily' | 'weekly' | undefined;
    const results = await testService.getResults(req.params.id, granularity);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Get results error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test results'
    });
  }
});

// POST /api/tests/:id/impression - Track impression
router.post('/:id/impression', async (req: Request, res: Response) => {
  try {
    const { variantId, userId } = req.body;

    await Variant.findOneAndUpdate(
      { variantId, testId: req.params.id },
      { $inc: { impressions: 1 } }
    );

    variantImpressions.inc({ test_id: req.params.id, variant_id: variantId });

    // Create result record
    const result = new Result({
      resultId: `res-${uuidv4().slice(0, 8)}`,
      testId: req.params.id,
      variantId,
      timestamp: new Date(),
      impressions: 1,
      uniqueUsers: userId ? 1 : 0
    });
    await result.save();

    res.json({
      success: true,
      data: { tracked: true }
    });
  } catch (error) {
    logger.error('Track impression error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track impression'
    });
  }
});

// POST /api/tests/:id/conversion - Track conversion
router.post('/:id/conversion', async (req: Request, res: Response) => {
  try {
    const { variantId, revenue, engagement, metrics } = req.body;

    await Variant.findOneAndUpdate(
      { variantId, testId: req.params.id },
      {
        $inc: {
          conversions: 1,
          revenue: revenue || 0,
          engagement: engagement || 0
        }
      }
    );

    variantConversions.inc({ test_id: req.params.id, variant_id: variantId });

    // Update result record
    await Result.findOneAndUpdate(
      { testId: req.params.id, variantId },
      {
        $inc: {
          conversions: 1,
          revenue: revenue || 0,
          engagement: engagement || 0
        },
        $set: { timestamp: new Date() }
      },
      { sort: { timestamp: -1 } }
    );

    res.json({
      success: true,
      data: { tracked: true }
    });
  } catch (error) {
    logger.error('Track conversion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track conversion'
    });
  }
});

// DELETE /api/tests/:id - Archive test
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const deleted = await testService.delete(req.params.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Test not found'
      });
      return;
    }

    res.json({
      success: true,
      data: { archived: true }
    });
  } catch (error) {
    logger.error('Delete test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete test'
    });
  }
});

export default router;
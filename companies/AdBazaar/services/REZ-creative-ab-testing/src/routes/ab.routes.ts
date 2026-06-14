import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { abTestingService } from '../services/ab-testing.service';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('ABRoutes');

// Validation schemas
const CreateTestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  campaignId: z.string(),
  variants: z.array(z.object({
    name: z.string().min(1).max(100),
    creativeId: z.string(),
    trafficPercentage: z.number().min(5).max(95).optional(),
  })).min(2).max(10),
  primaryMetric: z.enum(['ctr', 'conversion_rate', 'engagement', 'revenue', 'roas']),
  secondaryMetrics: z.array(z.enum(['ctr', 'conversion_rate', 'engagement', 'revenue', 'roas', 'impressions', 'clicks'])).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  targetAudience: z.object({
    ageMin: z.number().min(13).optional(),
    ageMax: z.number().max(120).optional(),
    genders: z.array(z.enum(['male', 'female', 'other'])).optional(),
    countries: z.array(z.string()).optional(),
  }).optional(),
});

const RecordImpressionSchema = z.object({
  testId: z.string().uuid(),
  variantId: z.string().uuid(),
  sessionId: z.string().uuid(),
  userId: z.string().optional(),
});

const RecordClickSchema = z.object({
  testId: z.string().uuid(),
  variantId: z.string().uuid(),
  sessionId: z.string().uuid(),
  userId: z.string().optional(),
});

const RecordConversionSchema = z.object({
  testId: z.string().uuid(),
  variantId: z.string().uuid(),
  sessionId: z.string().uuid(),
  userId: z.string().optional(),
  value: z.number().min(0).optional(),
});

// Create test
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreateTestSchema.parse(req.body);

    const test = abTestingService.createTest({
      name: data.name,
      description: data.description,
      campaignId: data.campaignId,
      variants: data.variants,
      primaryMetric: data.primaryMetric,
      secondaryMetrics: data.secondaryMetrics,
      startDate: data.startDate,
      endDate: data.endDate,
      targetAudience: data.targetAudience,
    });

    res.status(201).json({
      success: true,
      data: test,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(error);
  }
});

// List tests
router.get('/', (req: Request, res: Response) => {
  const { campaignId, status } = req.query;

  const tests = abTestingService.getTests({
    campaignId: campaignId as string,
    status: status as any,
  });

  res.json({
    success: true,
    data: tests,
    timestamp: new Date().toISOString(),
  });
});

// Get test
router.get('/:testId', (req: Request, res: Response) => {
  const { testId } = req.params;

  const test = abTestingService.getTest(testId);

  if (!test) {
    res.status(404).json({
      success: false,
      error: 'Test not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    success: true,
    data: test,
    timestamp: new Date().toISOString(),
  });
});

// Start test
router.post('/:testId/start', (req: Request, res: Response) => {
  const { testId } = req.params;

  const test = abTestingService.startTest(testId);

  if (!test) {
    res.status(404).json({
      success: false,
      error: 'Test not found or already started',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    success: true,
    data: test,
    message: 'Test started',
    timestamp: new Date().toISOString(),
  });
});

// Pause test
router.post('/:testId/pause', (req: Request, res: Response) => {
  const { testId } = req.params;

  const test = abTestingService.pauseTest(testId);

  if (!test) {
    res.status(404).json({
      success: false,
      error: 'Test not found or not running',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    success: true,
    data: test,
    message: 'Test paused',
    timestamp: new Date().toISOString(),
  });
});

// Resume test
router.post('/:testId/resume', (req: Request, res: Response) => {
  const { testId } = req.params;

  const test = abTestingService.resumeTest(testId);

  if (!test) {
    res.status(404).json({
      success: false,
      error: 'Test not found or not paused',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    success: true,
    data: test,
    message: 'Test resumed',
    timestamp: new Date().toISOString(),
  });
});

// Complete test
router.post('/:testId/complete', (req: Request, res: Response) => {
  const { testId } = req.params;

  const test = abTestingService.completeTest(testId);

  if (!test) {
    res.status(404).json({
      success: false,
      error: 'Test not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    success: true,
    data: test,
    message: 'Test completed',
    timestamp: new Date().toISOString(),
  });
});

// Archive test
router.delete('/:testId', (req: Request, res: Response) => {
  const { testId } = req.params;

  const archived = abTestingService.archiveTest(testId);

  if (!archived) {
    res.status(404).json({
      success: false,
      error: 'Test not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    success: true,
    message: 'Test archived',
    timestamp: new Date().toISOString(),
  });
});

// Get test results
router.get('/:testId/results', (req: Request, res: Response) => {
  const { testId } = req.params;

  const results = abTestingService.getResults(testId);

  if (!results) {
    res.status(404).json({
      success: false,
      error: 'Test not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    success: true,
    data: results,
    timestamp: new Date().toISOString(),
  });
});

// Assign variant
router.post('/:testId/assign', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { testId } = req.params;
    const { sessionId, userId } = z.object({
      sessionId: z.string().uuid(),
      userId: z.string().optional(),
    }).parse(req.body);

    const result = abTestingService.assignVariant(testId, sessionId, userId);

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Test not found or not running',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(error);
  }
});

// Record impression
router.post('/events/impression', (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = RecordImpressionSchema.parse(req.body);

    const recorded = abTestingService.recordImpression(
      data.testId,
      data.variantId,
      data.sessionId
    );

    if (!recorded) {
      res.status(404).json({
        success: false,
        error: 'Test or variant not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(error);
  }
});

// Record click
router.post('/events/click', (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = RecordClickSchema.parse(req.body);

    const recorded = abTestingService.recordClick(
      data.testId,
      data.variantId,
      data.sessionId
    );

    if (!recorded) {
      res.status(404).json({
        success: false,
        error: 'Test or variant not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(error);
  }
});

// Record conversion
router.post('/events/conversion', (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = RecordConversionSchema.parse(req.body);

    const recorded = abTestingService.recordConversion(
      data.testId,
      data.variantId,
      data.sessionId,
      data.value
    );

    if (!recorded) {
      res.status(404).json({
        success: false,
        error: 'Test or variant not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(error);
  }
});

// Get service stats
router.get('/stats/service', (req: Request, res: Response) => {
  const stats = abTestingService.getStats();

  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
  });
});

export default router;

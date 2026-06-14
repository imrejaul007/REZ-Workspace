import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { creativeService } from '../services/creativeService';
import { generationService } from '../services/generationService';
import { predictionService } from '../services/predictionService';
import { variationService } from '../services/variationService';
import { optimizationService } from '../services/optimizationService';
import { CreativeTemplate } from '../models/CreativeTemplate';
import { asyncHandler } from '../middleware/auth';
import { logger } from 'utils/logger.js';
import { metrics } from '../utils/metrics';

const router = Router();

// Validation schemas
const createCreativeSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['banner', 'video', 'native', 'text', 'carousel', 'interactive']),
  content: z.object({
    headline: z.string().optional(),
    body: z.string().optional(),
    cta: z.string().optional(),
    imageUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
    assets: z.array(z.any()).optional(),
    metadata: z.record(z.any()).optional()
  }),
  campaignId: z.string().min(1),
  advertiserId: z.string().min(1),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive()
  }).optional(),
  targetAudience: z.object({
    ageRange: z.tuple([z.number(), z.number()]).optional(),
    gender: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional()
  }).optional(),
  tags: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional()
});

const updateCreativeSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  content: z.object({
    headline: z.string().optional(),
    body: z.string().optional(),
    cta: z.string().optional(),
    imageUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
    assets: z.array(z.any()).optional(),
    metadata: z.record(z.any()).optional()
  }).optional(),
  status: z.enum(['draft', 'pending_review', 'approved', 'rejected', 'active', 'paused', 'archived']).optional(),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive()
  }).optional(),
  targetAudience: z.object({
    ageRange: z.tuple([z.number(), z.number()]).optional(),
    gender: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional()
  }).optional(),
  tags: z.array(z.string()).optional(),
  reviewNotes: z.string().optional(),
  expiresAt: z.string().datetime().optional()
});

const generateCreativeSchema = z.object({
  type: z.enum(['banner', 'video', 'native', 'text', 'carousel']),
  campaignId: z.string().min(1),
  advertiserId: z.string().min(1),
  productName: z.string().optional(),
  productDescription: z.string().optional(),
  targetAudience: z.object({
    ageRange: z.tuple([z.number(), z.number()]).optional(),
    gender: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional()
  }).optional(),
  industry: z.string().optional(),
  platform: z.string().optional(),
  tone: z.string().optional(),
  keyMessage: z.string().optional(),
  ctaText: z.string().optional(),
  brandGuidelines: z.object({
    colors: z.array(z.string()).optional(),
    fonts: z.array(z.string()).optional(),
    logo: z.string().url().optional()
  }).optional()
});

const createVariationSchema = z.object({
  testName: z.string().min(1).max(200),
  testType: z.enum(['ab', 'multivariate', 'bandit']),
  hypothesis: z.string().optional(),
  variations: z.array(z.object({
    name: z.string().min(1),
    content: z.object({
      headline: z.string().optional(),
      body: z.string().optional(),
      cta: z.string().optional(),
      imageUrl: z.string().url().optional()
    }),
    weight: z.number().min(0).max(100).optional()
  })).min(2),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional()
});

const optimizeCreativeSchema = z.object({
  goal: z.enum(['ctr', 'conversions', 'cpa', 'roas', 'engagement']),
  budget: z.number().positive().optional(),
  constraints: z.object({
    maxChanges: z.number().positive().optional(),
    preserveElements: z.array(z.string()).optional(),
    minCTR: z.number().min(0).max(100).optional(),
    maxCPA: z.number().positive().optional()
  }).optional()
});

// Helper for error responses
const errorResponse = (res: Response, statusCode: number, message: string, code: string, details?: any) => {
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      ...(details && { details })
    }
  });
};

// POST /api/creatives - Create creative
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedData = createCreativeSchema.parse(req.body);
    const creative = await creativeService.create({
      ...validatedData,
      createdBy: req.serviceId || 'unknown'
    });

    metrics.creativeOperationsTotal.inc({ operation: 'create', status: 'success' });
    logger.info(`Creative created: ${creative._id}`);

    res.status(201).json({
      success: true,
      data: creative
    });
  } catch (error: any) {
    metrics.creativeOperationsTotal.inc({ operation: 'create', status: 'error' });
    if (error instanceof z.ZodError) {
      return errorResponse(res, 400, 'Validation error', 'VALIDATION_ERROR', error.errors);
    }
    logger.error('Failed to create creative:', error);
    errorResponse(res, 500, 'Failed to create creative', 'CREATE_ERROR');
  }
}));

// GET /api/creatives - List creatives
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      campaignId,
      advertiserId,
      status,
      type,
      tags,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const result = await creativeService.list({
      campaignId: campaignId as string,
      advertiserId: advertiserId as string,
      status: status as any,
      type: type as any,
      tags: tags ? (tags as string).split(',') : undefined,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    });

    res.json({
      success: true,
      data: result.creatives,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        total: result.total
      }
    });
  } catch (error) {
    logger.error('Failed to list creatives:', error);
    errorResponse(res, 500, 'Failed to list creatives', 'LIST_ERROR');
  }
}));

// GET /api/creatives/:id - Get creative
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const creative = await creativeService.findById(req.params.id);

    if (!creative) {
      return errorResponse(res, 404, 'Creative not found', 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: creative
    });
  } catch (error) {
    logger.error('Failed to get creative:', error);
    errorResponse(res, 500, 'Failed to get creative', 'GET_ERROR');
  }
}));

// PUT /api/creatives/:id - Update creative
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedData = updateCreativeSchema.parse(req.body);
    const creative = await creativeService.update(req.params.id, {
      ...validatedData,
      updatedBy: req.serviceId || 'unknown'
    });

    if (!creative) {
      return errorResponse(res, 404, 'Creative not found', 'NOT_FOUND');
    }

    metrics.creativeOperationsTotal.inc({ operation: 'update', status: 'success' });
    res.json({
      success: true,
      data: creative
    });
  } catch (error: any) {
    metrics.creativeOperationsTotal.inc({ operation: 'update', status: 'error' });
    if (error instanceof z.ZodError) {
      return errorResponse(res, 400, 'Validation error', 'VALIDATION_ERROR', error.errors);
    }
    logger.error('Failed to update creative:', error);
    errorResponse(res, 500, 'Failed to update creative', 'UPDATE_ERROR');
  }
}));

// POST /api/creatives/generate - AI generation
router.post('/generate', asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedData = generateCreativeSchema.parse(req.body);
    const startTime = Date.now();

    const content = await generationService.generateCreative(validatedData);

    const duration = (Date.now() - startTime) / 1000;
    metrics.creativeGenerationDuration.labels(validatedData.type).observe(duration);
    metrics.creativeOperationsTotal.inc({ operation: 'generate', status: 'success' });

    res.status(201).json({
      success: true,
      data: content
    });
  } catch (error: any) {
    metrics.creativeOperationsTotal.inc({ operation: 'generate', status: 'error' });
    if (error instanceof z.ZodError) {
      return errorResponse(res, 400, 'Validation error', 'VALIDATION_ERROR', error.errors);
    }
    logger.error('Failed to generate creative:', error);
    errorResponse(res, 500, 'Failed to generate creative', 'GENERATE_ERROR');
  }
}));

// GET /api/creatives/:id/predict - Performance prediction
router.get('/:id/predict', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { placement, bidAmount } = req.query;

    const prediction = await predictionService.predict({
      creativeId: req.params.id,
      placement: placement as string,
      bidAmount: bidAmount ? parseFloat(bidAmount as string) : undefined
    });

    metrics.predictionRequestsTotal.inc({ model_version: prediction.modelVersion, status: 'success' });
    metrics.predictionConfidence.labels('all').set(prediction.confidence.overallConfidence);

    res.json({
      success: true,
      data: prediction
    });
  } catch (error: any) {
    metrics.predictionRequestsTotal.inc({ model_version: 'unknown', status: 'error' });
    if (error.message === 'Creative not found') {
      return errorResponse(res, 404, 'Creative not found', 'NOT_FOUND');
    }
    logger.error('Failed to predict performance:', error);
    errorResponse(res, 500, 'Failed to predict performance', 'PREDICT_ERROR');
  }
}));

// POST /api/creatives/:id/variations - Create variations
router.post('/:id/variations', asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedData = createVariationSchema.parse(req.body);

    const test = await variationService.createTest({
      ...validatedData,
      creativeId: req.params.id,
      createdBy: req.serviceId || 'unknown'
    });

    metrics.variationTestsTotal.labels(validatedData.testType, 'draft').inc();
    res.status(201).json({
      success: true,
      data: test
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(res, 400, 'Validation error', 'VALIDATION_ERROR', error.errors);
    }
    if (error.message === 'Creative not found') {
      return errorResponse(res, 404, 'Creative not found', 'NOT_FOUND');
    }
    logger.error('Failed to create variation test:', error);
    errorResponse(res, 500, 'Failed to create variation test', 'VARIATION_ERROR');
  }
}));

// GET /api/creatives/:id/analytics - Creative analytics
router.get('/:id/analytics', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    const dateRange = start && end ? {
      start: new Date(start as string),
      end: new Date(end as string)
    } : undefined;

    const analytics = await creativeService.getAnalytics(req.params.id, dateRange);

    if (!analytics) {
      return errorResponse(res, 404, 'Creative not found', 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Failed to get analytics:', error);
    errorResponse(res, 500, 'Failed to get analytics', 'ANALYTICS_ERROR');
  }
}));

// POST /api/creatives/:id/optimize - AI optimization
router.post('/:id/optimize', asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedData = optimizeCreativeSchema.parse(req.body);

    const result = await optimizationService.optimizeCreative(req.params.id, validatedData);

    metrics.optimizationImprovements.labels(validatedData.goal).set(
      result.optimized.predictedImprovement.ctr
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse(res, 400, 'Validation error', 'VALIDATION_ERROR', error.errors);
    }
    if (error.message === 'Creative not found') {
      return errorResponse(res, 404, 'Creative not found', 'NOT_FOUND');
    }
    logger.error('Failed to optimize creative:', error);
    errorResponse(res, 500, 'Failed to optimize creative', 'OPTIMIZE_ERROR');
  }
}));

// GET /api/creatives/templates - Creative templates
router.get('/templates', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { type, category, isPublic, page = '1', limit = '20' } = req.query;

    const query: Record<string, any> = { isActive: true };
    if (type) query.type = type;
    if (category) query.category = category;
    if (isPublic !== undefined) query.isPublic = isPublic === 'true';

    const templates = await CreativeTemplate.find(query)
      .sort({ usageCount: -1 })
      .skip((parseInt(page as string, 10) - 1) * parseInt(limit as string, 10))
      .limit(parseInt(limit as string, 10))
      .exec();

    const total = await CreativeTemplate.countDocuments(query);

    res.json({
      success: true,
      data: templates,
      pagination: {
        page: parseInt(page as string, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string, 10))
      }
    });
  } catch (error) {
    logger.error('Failed to list templates:', error);
    errorResponse(res, 500, 'Failed to list templates', 'TEMPLATE_ERROR');
  }
}));

// Additional utility routes

// POST /api/creatives/:id/submit-review - Submit for review
router.post('/:id/submit-review', asyncHandler(async (req: Request, res: Response) => {
  try {
    const creative = await creativeService.submitForReview(req.params.id, req.serviceId || 'unknown');

    if (!creative) {
      return errorResponse(res, 404, 'Creative not found', 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: creative
    });
  } catch (error) {
    logger.error('Failed to submit for review:', error);
    errorResponse(res, 500, 'Failed to submit for review', 'REVIEW_ERROR');
  }
}));

// POST /api/creatives/:id/approve - Approve creative
router.post('/:id/approve', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { notes } = req.body;
    const creative = await creativeService.approve(req.params.id, req.serviceId || 'unknown', notes);

    if (!creative) {
      return errorResponse(res, 404, 'Creative not found', 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: creative
    });
  } catch (error) {
    logger.error('Failed to approve creative:', error);
    errorResponse(res, 500, 'Failed to approve creative', 'APPROVE_ERROR');
  }
}));

// POST /api/creatives/:id/reject - Reject creative
router.post('/:id/reject', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { notes } = req.body;
    if (!notes) {
      return errorResponse(res, 400, 'Review notes are required', 'VALIDATION_ERROR');
    }

    const creative = await creativeService.reject(req.params.id, req.serviceId || 'unknown', notes);

    if (!creative) {
      return errorResponse(res, 404, 'Creative not found', 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: creative
    });
  } catch (error) {
    logger.error('Failed to reject creative:', error);
    errorResponse(res, 500, 'Failed to reject creative', 'REJECT_ERROR');
  }
}));

// POST /api/creatives/:id/activate - Activate creative
router.post('/:id/activate', asyncHandler(async (req: Request, res: Response) => {
  try {
    const creative = await creativeService.activate(req.params.id);

    if (!creative) {
      return errorResponse(res, 404, 'Creative not found', 'NOT_FOUND');
    }

    metrics.creativeOperationsTotal.inc({ operation: 'activate', status: 'success' });
    res.json({
      success: true,
      data: creative
    });
  } catch (error) {
    logger.error('Failed to activate creative:', error);
    errorResponse(res, 500, 'Failed to activate creative', 'ACTIVATE_ERROR');
  }
}));

// POST /api/creatives/:id/pause - Pause creative
router.post('/:id/pause', asyncHandler(async (req: Request, res: Response) => {
  try {
    const creative = await creativeService.pause(req.params.id);

    if (!creative) {
      return errorResponse(res, 404, 'Creative not found', 'NOT_FOUND');
    }

    metrics.creativeOperationsTotal.inc({ operation: 'pause', status: 'success' });
    res.json({
      success: true,
      data: creative
    });
  } catch (error) {
    logger.error('Failed to pause creative:', error);
    errorResponse(res, 500, 'Failed to pause creative', 'PAUSE_ERROR');
  }
}));

// POST /api/creatives/:id/duplicate - Duplicate creative
router.post('/:id/duplicate', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { newName } = req.body;
    if (!newName) {
      return errorResponse(res, 400, 'New name is required', 'VALIDATION_ERROR');
    }

    const creative = await creativeService.duplicate(req.params.id, newName, req.serviceId || 'unknown');

    if (!creative) {
      return errorResponse(res, 404, 'Creative not found', 'NOT_FOUND');
    }

    metrics.creativeOperationsTotal.inc({ operation: 'duplicate', status: 'success' });
    res.status(201).json({
      success: true,
      data: creative
    });
  } catch (error) {
    logger.error('Failed to duplicate creative:', error);
    errorResponse(res, 500, 'Failed to duplicate creative', 'DUPLICATE_ERROR');
  }
}));

// GET /api/creatives/:id/variations - Get all variations for a creative
router.get('/:id/variations', asyncHandler(async (req: Request, res: Response) => {
  try {
    const tests = await variationService.getActiveTestsForCreative(req.params.id);

    res.json({
      success: true,
      data: tests
    });
  } catch (error) {
    logger.error('Failed to get variations:', error);
    errorResponse(res, 500, 'Failed to get variations', 'VARIATION_ERROR');
  }
}));

// GET /api/creatives/top-performers - Get top performing creatives
router.get('/stats/top-performers', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { advertiserId, limit = '10' } = req.query;

    if (!advertiserId) {
      return errorResponse(res, 400, 'advertiserId is required', 'VALIDATION_ERROR');
    }

    const creatives = await creativeService.getTopPerformers(
      advertiserId as string,
      parseInt(limit as string, 10)
    );

    res.json({
      success: true,
      data: creatives
    });
  } catch (error) {
    logger.error('Failed to get top performers:', error);
    errorResponse(res, 500, 'Failed to get top performers', 'STATS_ERROR');
  }
}));

export { router as creativeRoutes };
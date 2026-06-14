import { Router, Response } from 'express';
import { z } from 'zod';
import { healthBenefitService } from '../services';
import { authMiddleware, internalOnlyMiddleware, asyncHandler, ApiResponse } from '../middleware';
import { AuthenticatedRequest } from '../middleware/auth';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

const router = Router();

const UpsertBenefitSchema = z.object({
  benefitId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  coverageType: z.enum(['individual', 'family', 'corporate']),
  coverageAmount: z.number().positive(),
  deductible: z.number().optional(),
  premium: z.number().positive(),
  provider: z.string().min(1),
  features: z.array(z.string()),
  waitingPeriod: z.number().optional(),
  exclusions: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'pending']).default('active'),
});

const UpdateStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'pending']),
});

// GET /api/health/benefits - Get all benefits
router.get('/health/benefits',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { coverageType, status, minCoverage, maxCoverage, limit, offset } = req.query;

    const result = await healthBenefitService.getAllBenefits({
      coverageType: coverageType as string,
      status: status as string,
      minCoverage: minCoverage ? parseFloat(minCoverage as string) : undefined,
      maxCoverage: maxCoverage ? parseFloat(maxCoverage as string) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/health/benefits/:benefitId - Get benefit by ID
router.get('/health/benefits/:benefitId',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { benefitId } = req.params;
    const benefit = await healthBenefitService.getBenefit(benefitId);

    if (!benefit) {
      throw new NotFoundError('Health benefit', benefitId);
    }

    res.status(200).json({
      success: true,
      data: benefit,
      timestamp: new Date().toISOString(),
    });
  })
);

// POST /api/health/benefits - Create or update benefit
router.post('/health/benefits',
  internalOnlyMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const parsed = UpsertBenefitSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
    }

    const benefit = await healthBenefitService.upsertBenefit(parsed.data);

    res.status(200).json({
      success: true,
      data: benefit,
      message: 'Health benefit saved',
      timestamp: new Date().toISOString(),
    });
  })
);

// PATCH /api/health/benefits/:benefitId/status - Update status
router.patch('/health/benefits/:benefitId/status',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { benefitId } = req.params;
    const parsed = UpdateStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
    }

    const benefit = await healthBenefitService.updateStatus(benefitId, parsed.data.status);

    if (!benefit) {
      throw new NotFoundError('Health benefit', benefitId);
    }

    res.status(200).json({
      success: true,
      data: benefit,
      message: 'Status updated',
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/health/benefits/provider/:provider - Get by provider
router.get('/health/benefits/provider/:provider',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { provider } = req.params;
    const benefits = await healthBenefitService.getByProvider(provider);

    res.status(200).json({
      success: true,
      data: { benefits, count: benefits.length },
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/stats/benefits - Get benefit statistics
router.get('/stats/benefits',
  authMiddleware,
  asyncHandler(async (_req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const stats = await healthBenefitService.getStats();

    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;

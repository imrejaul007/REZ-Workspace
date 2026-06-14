/**
 * Application Routes
 */

import { Router, Response } from 'express';
import { applicationService } from '../services';
import { verifyAuth, AuthenticatedRequest, asyncHandler, AppError } from '../middleware';
import { validateBody } from '../middleware';
import { applicationCreateSchema } from '../utils/validation';
import logger from 'utils/logger.js';

const router = Router();

/**
 * GET /api/applications
 * List applications
 */
router.get('/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page, limit, campaignId, influencerId, status } = req.query as any;
    const result = await applicationService.listApplications({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      campaignId,
      influencerId,
      status
    });

    res.json({
      success: true,
      data: result.applications,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages
      }
    });
  })
);

/**
 * POST /api/applications
 * Submit application
 */
router.post('/',
  verifyAuth,
  validateBody(applicationCreateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const application = await applicationService.createApplication(req.body);
    res.status(201).json({
      success: true,
      data: application
    });
  })
);

/**
 * GET /api/applications/:id
 * Get application by ID
 */
router.get('/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const application = await applicationService.getApplicationById(req.params.id);
    if (!application) {
      throw new AppError('Application not found', 404);
    }
    res.json({
      success: true,
      data: application
    });
  })
);

/**
 * PATCH /api/applications/:id/status
 * Update application status
 */
router.patch('/:id/status',
  verifyAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { status, notes } = req.body;
    const application = await applicationService.updateApplicationStatus(req.params.id, status, notes);
    if (!application) {
      throw new AppError('Application not found', 404);
    }
    res.json({
      success: true,
      data: application
    });
  })
);

/**
 * GET /api/applications/campaign/:campaignId
 * Get applications by campaign ID
 */
router.get('/campaign/:campaignId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const applications = await applicationService.getApplicationsByCampaignId(req.params.campaignId);
    res.json({
      success: true,
      data: applications
    });
  })
);

/**
 * GET /api/applications/influencer/:influencerId
 * Get applications by influencer ID
 */
router.get('/influencer/:influencerId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const applications = await applicationService.getApplicationsByInfluencerId(req.params.influencerId);
    res.json({
      success: true,
      data: applications
    });
  })
);

export default router;
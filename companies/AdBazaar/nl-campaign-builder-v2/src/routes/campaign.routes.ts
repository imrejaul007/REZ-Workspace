import { Router, Request, Response } from 'express';
import { campaignBuilderService, BuildResult } from '../services/campaign-builder.service';
import { nlpParserService } from '../services/nlp-parser.service';
import { campaignGeneratorService } from '../services/campaign-generator.service';
import { validateBody } from '../middleware/validation.middleware';
import { BuildCampaignRequestSchema, ValidateCampaignRequestSchema, AdjustCampaignRequestSchema } from '../types/schemas';
import { asyncHandler, ApiError } from '../middleware/error-handler.middleware';
import { optionalAuth } from '../middleware/auth.middleware';
import { recordBuild, recordNLPParse, recordCampaignGenerate } from '../middleware/metrics.middleware';
import { logger } from 'utils/logger.js';

const router = Router();

/**
 * POST /api/nl/build
 * Build campaign from natural language input
 */
router.post(
  '/build',
  optionalAuth,
  validateBody(BuildCampaignRequestSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    try {
      const { naturalLanguage, advertiserId, context } = req.body;

      // Use authenticated advertiserId if available, otherwise use body
      const effectiveAdvertiserId = req.advertiserId || advertiserId;

      if (!effectiveAdvertiserId) {
        throw ApiError.badRequest('Advertiser ID is required');
      }

      logger.info('Building campaign', { advertiserId: effectiveAdvertiserId });

      // Build campaign
      const result = await campaignBuilderService.build({
        naturalLanguage,
        advertiserId: effectiveAdvertiserId,
        context
      });

      const duration = (Date.now() - startTime) / 1000;

      // Record metrics
      if (result.success) {
        recordBuild('success', result.campaign?.objective || 'unknown', duration, result.confidence);
      } else {
        recordBuild('failure', 'unknown', duration);
      }

      if (!result.success) {
        res.status(400).json({
          success: false,
          buildId: result.buildId,
          error: result.errors?.[0] || 'Build failed',
          processingTime: result.processingTime
        });
        return;
      }

      res.status(201).json({
        success: true,
        buildId: result.buildId,
        campaign: result.campaign,
        parsed: result.parsed,
        confidence: result.confidence,
        suggestions: result.suggestions,
        warnings: result.warnings,
        processingTime: result.processingTime
      });

    } catch (error) {
      logger.error('Build failed:', error);
      throw error;
    }
  })
);

/**
 * GET /api/nl/campaigns/:id
 * Get a converted campaign by build ID
 */
router.get(
  '/campaigns/:id',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const advertiserId = req.advertiserId;

    if (!id) {
      throw ApiError.badRequest('Build ID is required');
    }

    const campaign = await campaignBuilderService.getCampaign(id, advertiserId);

    if (!campaign) {
      throw ApiError.notFound(`Campaign ${id} not found`);
    }

    res.json({
      success: true,
      campaign
    });
  })
);

/**
 * GET /api/nl/builds/:id
 * Get build details by ID
 */
router.get(
  '/builds/:id',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const advertiserId = req.advertiserId;

    if (!id) {
      throw ApiError.badRequest('Build ID is required');
    }

    const build = await campaignBuilderService.getBuild(id, advertiserId);

    if (!build) {
      throw ApiError.notFound(`Build ${id} not found`);
    }

    res.json({
      success: true,
      build
    });
  })
);

/**
 * POST /api/nl/validate
 * Validate campaign setup
 */
router.post(
  '/validate',
  optionalAuth,
  validateBody(ValidateCampaignRequestSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { campaign, strict = false } = req.body;

    const validation = await campaignBuilderService.validate(campaign, strict);

    res.json({
      success: true,
      ...validation
    });
  })
);

/**
 * PUT /api/nl/campaigns/:id/adjust
 * Adjust campaign based on feedback
 */
router.put(
  '/campaigns/:id/adjust',
  optionalAuth,
  validateBody(AdjustCampaignRequestSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { feedback, changes } = req.body;
    const advertiserId = req.advertiserId;

    if (!id) {
      throw ApiError.badRequest('Campaign ID is required');
    }

    if (!feedback) {
      throw ApiError.badRequest('Feedback is required');
    }

    // Verify campaign ownership if authenticated
    const existingBuild = await campaignBuilderService.getBuild(id, advertiserId);
    if (!existingBuild) {
      throw ApiError.notFound(`Campaign ${id} not found`);
    }

    const result = await campaignBuilderService.adjust(id, feedback, changes);

    res.json({
      success: result.success,
      campaign: result.updatedCampaign,
      confidence: result.confidence,
      appliedChanges: result.appliedChanges
    });
  })
);

/**
 * GET /api/nl/builds
 * Get builds for the authenticated advertiser
 */
router.get(
  '/builds',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const advertiserId = req.advertiserId;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!advertiserId) {
      throw ApiError.unauthorized('Authentication required');
    }

    const builds = await campaignBuilderService.getBuildsByAdvertiser(advertiserId, limit);

    res.json({
      success: true,
      builds,
      count: builds.length
    });
  })
);

/**
 * POST /api/nl/parse
 * Parse natural language without building campaign
 */
router.post(
  '/parse',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { naturalLanguage, context } = req.body;
    const startTime = Date.now();

    if (!naturalLanguage || naturalLanguage.length < 10) {
      throw ApiError.badRequest('Please provide more detailed input (at least 10 characters)');
    }

    const result = await nlpParserService.parse(naturalLanguage, context);

    const duration = (Date.now() - startTime) / 1000;
    recordNLPParse(duration);

    res.json({
      success: true,
      parsed: result.parsed,
      confidence: result.confidence,
      warnings: result.warnings
    });
  })
);

/**
 * POST /api/nl/generate
 * Generate campaign without parsing (use pre-parsed intent)
 */
router.post(
  '/generate',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { parsed, advertiserId } = req.body;
    const startTime = Date.now();

    if (!parsed) {
      throw ApiError.badRequest('Parsed intent is required');
    }

    const effectiveAdvertiserId = req.advertiserId || advertiserId;

    if (!effectiveAdvertiserId) {
      throw ApiError.badRequest('Advertiser ID is required');
    }

    const { campaign, suggestions, warnings } = await campaignGeneratorService.generate(
      parsed,
      effectiveAdvertiserId
    );

    const duration = (Date.now() - startTime) / 1000;
    recordCampaignGenerate(duration);

    res.json({
      success: true,
      campaign,
      suggestions,
      warnings
    });
  })
);

/**
 * GET /api/nl/stats
 * Get build statistics
 */
router.get(
  '/stats',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const recentBuilds = await campaignBuilderService.getRecentBuilds(undefined, 100);

    const stats = {
      totalBuilds: recentBuilds.length,
      byStatus: {} as Record<string, number>,
      byGoalType: {} as Record<string, number>,
      averageConfidence: 0,
      recentBuilds: recentBuilds.slice(0, 10).map(b => ({
        buildId: b.buildId,
        confidence: b.confidence,
        status: b.status,
        objective: b.generatedCampaign?.objective,
        createdAt: b.createdAt
      }))
    };

    // Calculate stats
    for (const build of recentBuilds) {
      stats.byStatus[build.status] = (stats.byStatus[build.status] || 0) + 1;
      if (build.generatedCampaign?.objective) {
        stats.byGoalType[build.generatedCampaign.objective] =
          (stats.byGoalType[build.generatedCampaign.objective] || 0) + 1;
      }
    }

    // Calculate average confidence
    const completedBuilds = recentBuilds.filter(b => b.status === 'completed');
    if (completedBuilds.length > 0) {
      stats.averageConfidence = completedBuilds.reduce((sum, b) => sum + b.confidence, 0) / completedBuilds.length;
    }

    res.json({
      success: true,
      stats
    });
  })
);

export default router;
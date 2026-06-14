import { Router, Request, Response } from 'express';
import { activationService } from '../services';
import { ActivationRequestSchema, ApiResponse } from '../types';
import { validateRequest, asyncHandler } from '../middleware';
import logger from '../config/logger';

const router = Router();

/**
 * POST /api/activate
 * Push matched audience to ad platform
 */
router.post(
  '/',
  validateRequest(ActivationRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Activation request received', {
      matchId: req.body.matchId,
      target: req.body.target,
    });

    const result = await activationService.activateAudience(req.body);

    const response: ApiResponse = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.status(201).json(response);
  })
);

/**
 * GET /api/activate/:activationId
 * Get activation status
 */
router.get(
  '/:activationId',
  asyncHandler(async (req: Request, res: Response) => {
    const { activationId } = req.params;

    const activation = await activationService.getActivation(activationId);

    if (!activation) {
      res.status(404).json({
        success: false,
        error: 'Activation not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: {
        activationId: activation.activationId,
        matchId: activation.matchId,
        target: activation.target,
        status: activation.status,
        recordsActivated: activation.recordsActivated,
        targetAudienceId: activation.targetAudienceId,
        createdAt: activation.createdAt,
        completedAt: activation.completedAt,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

/**
 * GET /api/activate/match/:matchId
 * Get all activations for a match
 */
router.get(
  '/match/:matchId',
  asyncHandler(async (req: Request, res: Response) => {
    const { matchId } = req.params;

    const activations = await activationService.getActivationsByMatch(matchId);

    const response: ApiResponse = {
      success: true,
      data: activations.map(a => ({
        activationId: a.activationId,
        target: a.target,
        status: a.status,
        recordsActivated: a.recordsActivated,
        targetAudienceId: a.targetAudienceId,
        createdAt: a.createdAt,
        completedAt: a.completedAt,
      })),
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

/**
 * GET /api/activate/brand/:brandId
 * Get all activations for a brand
 */
router.get(
  '/brand/:brandId',
  asyncHandler(async (req: Request, res: Response) => {
    const { brandId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const activations = await activationService.getActivationsByBrand(brandId, limit);

    const response: ApiResponse = {
      success: true,
      data: activations.map(a => ({
        activationId: a.activationId,
        matchId: a.matchId,
        target: a.target,
        status: a.status,
        recordsActivated: a.recordsActivated,
        targetAudienceId: a.targetAudienceId,
        createdAt: a.createdAt,
        completedAt: a.completedAt,
      })),
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

export default router;
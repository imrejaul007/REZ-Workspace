import { Router, Request, Response } from 'express';
import { twinService } from '../services';
import {
  authMiddleware,
  validateBody,
  validateParams,
  asyncHandler,
  recordTwinOperation,
  recordPredictionDuration,
  NotFoundError,
  ConflictError,
} from '../middleware';
import { schemas } from '../middleware/validation.middleware';

const router = Router();

/**
 * POST /api/twin/create
 * Create a new user twin
 */
router.post(
  '/create',
  authMiddleware,
  validateBody(schemas.createTwin),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, profile } = req.body;

    // Check if twin already exists
    const existingTwin = await twinService.getTwinByUserId(userId);
    if (existingTwin) {
      throw new ConflictError('User twin');
    }

    const twin = await twinService.createTwin({ userId, profile });
    recordTwinOperation('create', 'success');

    res.status(201).json({
      success: true,
      data: twin,
      message: 'User twin created successfully',
    });
  })
);

/**
 * GET /api/twin/:userId
 * Get user twin by userId
 */
router.get(
  '/:userId',
  authMiddleware,
  validateParams(schemas.userIdParam),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const twin = await twinService.getTwinByUserId(userId);
    if (!twin) {
      throw new NotFoundError('User twin');
    }
    recordTwinOperation('get', 'success');

    res.json({
      success: true,
      data: twin,
    });
  })
);

/**
 * PUT /api/twin/:userId
 * Update user twin
 */
router.put(
  '/:userId',
  authMiddleware,
  validateParams(schemas.userIdParam),
  validateBody(schemas.updateTwin),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const updates = req.body;

    const twin = await twinService.updateTwin(userId, updates);
    if (!twin) {
      throw new NotFoundError('User twin');
    }
    recordTwinOperation('update', 'success');

    res.json({
      success: true,
      data: twin,
      message: 'User twin updated successfully',
    });
  })
);

/**
 * POST /api/twin/:userId/predict
 * Predict behavior for user
 */
router.post(
  '/:userId/predict',
  authMiddleware,
  validateParams(schemas.userIdParam),
  validateBody(schemas.predict),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { scenario, context } = req.body;

    const startTime = Date.now();
    const predictions = await twinService.predictBehavior(userId, scenario);
    const duration = Date.now() - startTime;

    recordPredictionDuration(scenario || 'default', duration);
    recordTwinOperation('predict', 'success');

    res.json({
      success: true,
      data: predictions,
    });
  })
);

/**
 * GET /api/twin/:userId/affinity
 * Get brand affinities
 */
router.get(
  '/:userId/affinity',
  authMiddleware,
  validateParams(schemas.userIdParam),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const affinities = await twinService.getAffinities(userId);
    recordTwinOperation('affinity', 'success');

    res.json({
      success: true,
      data: affinities,
    });
  })
);

/**
 * POST /api/twin/:userId/refresh
 * Refresh twin data
 */
router.post(
  '/:userId/refresh',
  authMiddleware,
  validateParams(schemas.userIdParam),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const refreshResult = await twinService.refreshTwin(userId);
    recordTwinOperation('refresh', 'success');

    res.json({
      success: true,
      data: refreshResult,
      message: `Twin refreshed. Updated ${refreshResult.updatedFields.length} fields.`,
    });
  })
);

export default router;
import { Router, Request, Response } from 'express';
import { targetingService } from '../services/index.js';
import {
  authenticate,
  authorize,
  asyncHandler,
} from '../middleware/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/targeting/sync/buzzlocal - Sync from BuzzLocal
router.post(
  '/sync/buzzlocal',
  authorize('admin'),
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await targetingService.syncFromBuzzLocal();

    res.json({
      success: true,
      data: result,
      message: `Synced ${result.synced} apartments from BuzzLocal`,
    });
  })
);

// GET /api/targeting/match - Find matching apartments for criteria
router.get(
  '/match',
  asyncHandler(async (req: Request, res: Response) => {
    const { incomeLevel, minResidents, amenities, interests } = req.query;

    const apartments = await targetingService.findMatchingApartments(
      {
        incomeLevel: incomeLevel as string | undefined,
        minResidents: minResidents ? parseInt(minResidents as string, 10) : undefined,
        amenities: amenities ? (amenities as string).split(',') : undefined,
        interests: interests ? (interests as string).split(',') : undefined,
      },
      100
    );

    res.json({
      success: true,
      data: apartments,
      count: apartments.length,
    });
  })
);

// POST /api/targeting/check-match - Check if user matches targeting
router.post(
  '/check-match',
  asyncHandler(async (req: Request, res: Response) => {
    const { apartmentId, age, income, interests } = req.body;

    if (!apartmentId) {
      res.status(400).json({
        success: false,
        error: 'apartmentId is required',
      });
      return;
    }

    const isMatch = await targetingService.isTargetMatch(apartmentId, {
      age,
      income,
      interests,
    });

    res.json({
      success: true,
      data: { isMatch },
    });
  })
);

// GET /api/targeting/configs - List all targeting configs
router.get(
  '/configs',
  authorize('admin', 'advertiser'),
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string, 10) || 100;
    const offset = parseInt(req.query.offset as string, 10) || 0;

    const configs = await targetingService.getAllConfigs(limit, offset);

    res.json({
      success: true,
      data: configs,
      count: configs.length,
    });
  })
);

export default router;
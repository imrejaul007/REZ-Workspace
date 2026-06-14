/**
 * REZ Memory Cloud - Profile Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { profileService } from '../services/profileService.js';
import { UpdatePreferenceSchema, AddFactSchema, UpdateProfileSchema } from '../models/Profile.js';
import { AppError } from '../middleware/errorHandler.js';
import type { IProfile } from '../models/Profile.js';

const router = Router();

function formatProfile(profile: IProfile) {
  return {
    profileId: profile.profileId,
    userId: profile.userId,
    preferences: profile.preferences,
    behavioralPatterns: profile.behavioralPatterns,
    facts: profile.facts,
    interests: profile.interests,
    dislikes: profile.dislikes,
    tags: profile.tags,
    segments: profile.segments,
    memoryCount: profile.memoryCount,
    lastMemoryAt: profile.lastMemoryAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

/**
 * GET /api/profile/:userId - Get user profile
 */
router.get('/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await profileService.get(req.params.userId);

    if (!profile) {
      // Create profile if it doesn't exist
      const newProfile = await profileService.getOrCreate(req.params.userId);
      res.json({
        success: true,
        data: formatProfile(newProfile),
      });
      return;
    }

    res.json({
      success: true,
      data: formatProfile(profile),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/profile/:userId - Update user profile
 */
router.put('/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = UpdateProfileSchema.parse(req.body);
    const profile = await profileService.update(req.params.userId, input);

    if (!profile) {
      throw new AppError('Profile not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: formatProfile(profile),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', error.errors));
    } else {
      next(error);
    }
  }
});

/**
 * POST /api/profile/:userId/preferences - Set a preference
 */
router.post('/:userId/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = UpdatePreferenceSchema.parse(req.body);
    await profileService.setPreference(req.params.userId, input);

    res.json({
      success: true,
      data: {
        key: input.key,
        value: input.value,
        confidence: input.confidence,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', error.errors));
    } else {
      next(error);
    }
  }
});

/**
 * GET /api/profile/:userId/preferences - Get preferences
 */
router.get('/:userId/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keyPrefix = req.query.keyPrefix as string | undefined;
    const preferences = await profileService.getPreferences(req.params.userId, keyPrefix);

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/profile/:userId/facts - Add a fact
 */
router.post('/:userId/facts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = AddFactSchema.parse(req.body);
    await profileService.addFact(req.params.userId, input);

    res.json({
      success: true,
      message: 'Fact added',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', error.errors));
    } else {
      next(error);
    }
  }
});

/**
 * GET /api/profile/:userId/interests - Get top interests
 */
router.get('/:userId/interests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const interests = await profileService.getTopInterests(req.params.userId, limit);

    res.json({
      success: true,
      data: interests,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/profile/:userId/pattern - Record a behavioral pattern
 */
router.post('/:userId/pattern', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pattern, context } = req.body;

    if (!pattern) {
      throw new AppError('pattern is required', 400, 'MISSING_PARAMETER');
    }

    await profileService.recordPattern(req.params.userId, pattern, context);

    res.json({
      success: true,
      message: 'Pattern recorded',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/profile/segment/:segment - Get profiles by segment
 */
router.get('/segment/:segment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const profiles = await profileService.getBySegment(req.params.segment, limit);

    res.json({
      success: true,
      data: profiles.map((p) => formatProfile(p)),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/profile/tag/:tag - Get profiles by tag
 */
router.get('/tag/:tag', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const profiles = await profileService.getByTag(req.params.tag, limit);

    res.json({
      success: true,
      data: profiles.map((p) => formatProfile(p)),
    });
  } catch (error) {
    next(error);
  }
});

export default router;

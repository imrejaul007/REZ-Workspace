/**
 * REZ Unified Hub - Profile Routes
 * Unified customer profile across all ecosystem services
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { apiClient } from '../services/apiClient';
import { logger } from '../utils/logger';

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const IdentifySchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  device_id: z.string().optional(),
  cookie_id: z.string().optional(),
});

const EnrichSchema = z.object({
  user_id: z.string().min(1, 'user_id is required'),
});

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/v1/profile/:userId
 * Get complete customer profile across all companies
 */
router.get('/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    // Parallel fetch from all services
    const [cdpProfile, userProfile, rfmScore, segments] = await Promise.allSettled([
      apiClient.getCDPProfile(userId),
      apiClient.call('PROFILE', '/api/v1/profile', 'POST', { user_id: userId }),
      apiClient.getRFMScore(userId),
      apiClient.getCDPSegments(userId),
    ]);

    const profile = {
      user_id: userId,
      cdp: cdpProfile.status === 'fulfilled' ? cdpProfile.value : null,
      profile: userProfile.status === 'fulfilled' ? userProfile.value : null,
      rfm: rfmScore.status === 'fulfilled' ? rfmScore.value : null,
      segments: segments.status === 'fulfilled' ? (segments.value as { segments?: string[] })?.segments || [] : [],
    };

    // Extract companies from profile
    const profileData = userProfile.status === 'fulfilled' ? userProfile.value as Record<string, unknown> : {};
    const companies: string[] = [];
    if (profileData?.consumer_id) companies.push('REZ-Consumer');
    if (profileData?.merchant_id) companies.push('REZ-Merchant');
    if (profileData?.employee_id) companies.push('CorpPerks');
    if (profileData?.guest_id) companies.push('StayOwn');

    res.json({
      success: true,
      data: {
        ...profile,
        companies,
      },
    });
  } catch (error) {
    logger.error('Error fetching unified profile:', error);
    next(error);
  }
});

/**
 * POST /api/v1/profile/identify
 * Identify user across devices/identifiers
 */
router.post('/identify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = IdentifySchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      });
      return;
    }

    const result = await apiClient.call('IDENTITY', '/api/v1/resolve', 'POST', validation.data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error identifying user:', error);
    next(error);
  }
});

/**
 * POST /api/v1/profile/:userId/enrich
 * Enrich profile with intelligence data
 */
router.post('/:userId/enrich', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    // Parallel fetch intelligence data
    const [churn, ltv, intent, fraud] = await Promise.allSettled([
      apiClient.call('PREDICT', '/api/v1/churn', 'POST', { user_id: userId }),
      apiClient.call('PREDICT', '/api/v1/ltv', 'POST', { user_id: userId }),
      apiClient.predictIntent(userId),
      apiClient.checkFraud(userId, 'profile_enrichment'),
    ]);

    res.json({
      success: true,
      data: {
        churn: churn.status === 'fulfilled' ? churn.value : null,
        ltv: ltv.status === 'fulfilled' ? ltv.value : null,
        intent: intent.status === 'fulfilled' ? intent.value : null,
        fraud: fraud.status === 'fulfilled' ? fraud.value : null,
      },
    });
  } catch (error) {
    logger.error('Error enriching profile:', error);
    next(error);
  }
});

/**
 * POST /api/v1/profile/merge
 * Merge two user profiles
 */
router.post('/merge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      primary_id: z.string().min(1, 'primary_id is required'),
      secondary_id: z.string().min(1, 'secondary_id is required'),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      });
      return;
    }

    const result = await apiClient.getCDPProfile(validation.data.primary_id);

    // Record merge event
    await apiClient.collectSignal('unified-hub', 'profile_merged', validation.data.primary_id, {
      secondary_id: validation.data.secondary_id,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error merging profiles:', error);
    next(error);
  }
});

export default router;

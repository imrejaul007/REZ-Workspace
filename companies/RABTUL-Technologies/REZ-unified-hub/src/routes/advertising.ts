/**
 * REZ Unified Hub - Advertising Routes
 * Ad tracking and campaign management
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { apiClient } from '../services/apiClient';
import { logger } from '../utils/logger';

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const TrackConversionSchema = z.object({
  user_id: z.string().min(1, 'user_id is required'),
  campaign_id: z.string().min(1, 'campaign_id is required'),
  channel: z.string().min(1, 'channel is required'),
  event: z.enum(['view', 'click', 'conversion']),
  value: z.number().optional(),
});

const CreateCampaignSchema = z.object({
  name: z.string().min(1, 'name is required'),
  targeting: z.object({
    segments: z.array(z.string()).optional(),
    rfm_tiers: z.array(z.string()).optional(),
    behaviors: z.array(z.string()).optional(),
  }).optional(),
  budget: z.number().positive('budget must be positive'),
  channels: z.array(z.string()).min(1, 'At least one channel is required'),
});

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/v1/ads/track
 * Track ad conversion across channels
 */
router.post('/track', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = TrackConversionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      });
      return;
    }

    const { user_id, campaign_id, channel, event, value } = validation.data;

    // Record in attribution
    await apiClient.trackAttribution(event, user_id, value, {
      campaign_id,
      channel,
    });

    // Update signal for intelligence
    await apiClient.collectSignal('advertising', `${channel}_${event}`, user_id, {
      campaign_id,
      value,
    });

    // Award karma if conversion
    if (event === 'conversion' && value && value > 0) {
      const karmaPoints = Math.floor(value * 0.01);
      await apiClient.awardKarma(user_id, karmaPoints, 'REZ-Media', 'ad_conversion');
    }

    res.json({
      success: true,
      data: {
        tracked: true,
        event,
        channel,
        karma_awarded: event === 'conversion' ? Math.floor((value || 0) * 0.01) : 0,
      },
    });
  } catch (error) {
    logger.error('Error tracking conversion:', error);
    next(error);
  }
});

/**
 * POST /api/v1/ads/campaigns
 * Create targeted campaign for segment
 */
router.post('/campaigns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = CreateCampaignSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      });
      return;
    }

    const { name, targeting, budget, channels } = validation.data;

    // Get segment members if targeting specified
    let audienceSize = 0;
    if (targeting?.segments?.length || targeting?.rfm_tiers?.length) {
      const members = await apiClient.call('SEGMENTS', '/api/v1/segment-members', 'POST', {
        segments: targeting.segments,
        rfm_tiers: targeting.rfm_tiers,
        limit: 10000,
      });
      audienceSize = (members as { count?: number })?.count || 0;
    }

    // Create campaign in ads platform
    const campaign = await apiClient.call('ADS', '/api/v1/campaigns', 'POST', {
      name,
      targeting,
      budget,
      channels,
      audience_size: audienceSize,
    });

    res.json({
      success: true,
      data: {
        campaign,
        audience_size: audienceSize,
        estimated_reach: Math.floor(audienceSize * 0.3),
      },
    });
  } catch (error) {
    logger.error('Error creating campaign:', error);
    next(error);
  }
});

/**
 * GET /api/v1/ads/attribution/:userId/:conversionId
 * Get multi-touch attribution for user journey
 */
router.get('/attribution/:userId/:conversionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, conversionId } = req.params;

    const result = await apiClient.call('ATTRIBUTION', '/api/v1/journey', 'POST', {
      user_id: userId,
      conversion_id: conversionId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error fetching attribution:', error);
    next(error);
  }
});

/**
 * GET /api/v1/ads/campaigns/:campaignId/stats
 * Get campaign statistics
 */
router.get('/campaigns/:campaignId/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { campaignId } = req.params;

    // Fetch from ads platform
    const [campaign, signals] = await Promise.allSettled([
      apiClient.call('ADS', `/api/v1/campaigns/${campaignId}`, 'GET'),
      apiClient.call('SIGNAL', '/api/v1/aggregate', 'POST', {
        event: 'advertising_conversion',
        entity_id: campaignId,
        period: '30d',
      }),
    ]);

    res.json({
      success: true,
      data: {
        campaign: campaign.status === 'fulfilled' ? campaign.value : null,
        stats: signals.status === 'fulfilled' ? signals.value : null,
      },
    });
  } catch (error) {
    logger.error('Error fetching campaign stats:', error);
    next(error);
  }
});

/**
 * POST /api/v1/ads/retarget
 * Retarget users based on behavior
 */
router.post('/retarget', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      behavior: z.enum(['abandoned_cart', 'viewed_product', 'purchased', 'dormant']),
      segments: z.array(z.string()).optional(),
      exclude_recent_buyers: z.boolean().default(true),
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

    const { behavior, segments, exclude_recent_buyers } = validation.data;

    // Get segment members
    const members = await apiClient.call('SEGMENTS', '/api/v1/segment-members', 'POST', {
      segments: segments || [behavior],
      exclude_recent_buyers,
      limit: 10000,
    });

    res.json({
      success: true,
      data: {
        behavior,
        audience_size: (members as { count?: number })?.count || 0,
        members: (members as { users?: unknown[] })?.users || [],
      },
    });
  } catch (error) {
    logger.error('Error retargeting:', error);
    next(error);
  }
});

export default router;

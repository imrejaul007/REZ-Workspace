/**
 * Hotel Marketing Routes
 * Integration with StayOwn Hotel OS for targeted guest marketing
 */

import { Router, Request, Response } from 'express';
import stayOwnClient from '../integrations/stayOwnClient';
import { logger } from '../config/logger';

const router = Router();

/**
 * GET /api/v1/hotels/:hotelId/guests
 * Get hotel guests for marketing segmentation
 */
router.get('/hotels/:hotelId/guests', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { checkIn, checkOut, segment } = req.query;

    const guests = await stayOwnClient.getHotelGuests({
      hotelId,
      checkIn: checkIn as string,
      checkOut: checkOut as string,
      segment: segment as string,
    });

    res.json({ success: true, data: guests });
  } catch (error) {
    logger.error('Get hotel guests error:', error);
    res.status(500).json({ success: false, error: 'Failed to get hotel guests' });
  }
});

/**
 * POST /api/v1/hotels/:hotelId/campaigns
 * Create hotel-specific marketing campaign
 */
router.post('/hotels/:hotelId/campaigns', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { name, type, targetSegments, content, targeting } = req.body;

    if (!name || !type || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, content',
      });
    }

    const campaign = await stayOwnClient.createHotelCampaign({
      hotelId,
      name,
      type,
      targetSegments: targetSegments || ['all'],
      content,
      targeting: targeting || {},
    });

    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    logger.error('Create hotel campaign error:', error);
    res.status(500).json({ success: false, error: 'Failed to create campaign' });
  }
});

/**
 * GET /api/v1/campaigns/:campaignId/performance
 * Get campaign performance metrics
 */
router.get('/campaigns/:campaignId/performance', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;

    const performance = await stayOwnClient.getCampaignPerformance(campaignId);
    res.json({ success: true, data: performance });
  } catch (error) {
    logger.error('Get campaign performance error:', error);
    res.status(500).json({ success: false, error: 'Failed to get performance' });
  }
});

/**
 * POST /api/v1/campaigns/:campaignId/track
 * Track campaign conversion
 */
router.post('/campaigns/:campaignId/track', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const { guestId, action, value, metadata } = req.body;

    if (!guestId || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: guestId, action',
      });
    }

    const result = await stayOwnClient.trackConversion({
      campaignId,
      guestId,
      action,
      value,
      metadata,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Track conversion error:', error);
    res.status(500).json({ success: false, error: 'Failed to track conversion' });
  }
});

/**
 * GET /api/v1/guests/:guestId/preferences
 * Get guest preferences for personalization
 */
router.get('/guests/:guestId/preferences', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;

    const preferences = await stayOwnClient.getGuestPreferences(guestId);
    res.json({ success: true, data: preferences });
  } catch (error) {
    logger.error('Get guest preferences error:', error);
    res.status(500).json({ success: false, error: 'Failed to get preferences' });
  }
});

/**
 * GET /api/v1/hotels/:hotelId/loyalty/members
 * Get hotel loyalty program members
 */
router.get('/hotels/:hotelId/loyalty/members', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { tier } = req.query;

    const members = await stayOwnClient.getLoyaltyMembers(hotelId, tier as string);
    res.json({ success: true, data: members });
  } catch (error) {
    logger.error('Get loyalty members error:', error);
    res.status(500).json({ success: false, error: 'Failed to get members' });
  }
});

/**
 * POST /api/v1/guests/:guestId/offers
 * Send targeted offer to guest
 */
router.post('/guests/:guestId/offers', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const { hotelId, offerType, offerValue, validUntil } = req.body;

    if (!hotelId || !offerType || !offerValue || !validUntil) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: hotelId, offerType, offerValue, validUntil',
      });
    }

    const result = await stayOwnClient.sendGuestOffer({
      hotelId,
      guestId,
      offerType,
      offerValue,
      validUntil,
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    logger.error('Send guest offer error:', error);
    res.status(500).json({ success: false, error: 'Failed to send offer' });
  }
});

/**
 * GET /api/v1/integration/stayown/status
 * Check StayOwn integration health
 */
router.get('/integration/stayown/status', async (_req: Request, res: Response) => {
  try {
    const health = await stayOwnClient.checkHealth();
    res.json({
      success: true,
      data: {
        stayOwnConnected: health.connected,
        capabilities: [
          'hotel_guest_targeting',
          'campaign_creation',
          'performance_tracking',
          'personalization',
          'loyalty_marketing',
          'targeted_offers',
        ],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check integration' });
  }
});

export default router;
import { Router, Request, Response } from 'express';
import { AdBazaarTrackingService } from '../services/adbazaar/AdBazaarTrackingService';
import { logger } from '../services/utils/logger';

const router = Router();
const adService = new AdBazaarTrackingService();

// Track ad click
router.post('/track/click', async (req: Request, res: Response) => {
  try {
    const { campaignId, userId, deviceId, clickId } = req.body;
    if (!campaignId || !deviceId) {
      return res.status(400).json({ error: 'campaignId and deviceId required' });
    }
    const attribution = await adService.trackClick({
      campaignId,
      userId,
      deviceId,
      clickId
    });
    res.json({ success: true, data: attribution });
  } catch (error) {
    logger.error('Track click failed', { error });
    res.status(500).json({ error: 'Failed to track click' });
  }
});

// Track ad view
router.post('/track/view', async (req: Request, res: Response) => {
  try {
    const { campaignId, userId, deviceId, viewId } = req.body;
    if (!campaignId || !deviceId) {
      return res.status(400).json({ error: 'campaignId and deviceId required' });
    }
    const attribution = await adService.trackView({
      campaignId,
      userId,
      deviceId,
      viewId
    });
    res.json({ success: true, data: attribution });
  } catch (error) {
    logger.error('Track view failed', { error });
    res.status(500).json({ error: 'Failed to track view' });
  }
});

// Track conversion
router.post('/track/conversion', async (req: Request, res: Response) => {
  try {
    const { orderId, userId, campaignId, amount, currency } = req.body;
    if (!orderId || !userId) {
      return res.status(400).json({ error: 'orderId and userId required' });
    }
    const result = await adService.trackConversion({
      orderId,
      userId,
      campaignId,
      amount,
      currency: currency || 'INR'
    });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Track conversion failed', { error });
    res.status(500).json({ error: 'Failed to track conversion' });
  }
});

// Get campaign ROI
router.get('/campaign/:id/roi', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const roi = await adService.getCampaignROI(req.params.id, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });
    res.json({ success: true, data: roi });
  } catch (error) {
    logger.error('Get campaign ROI failed', { error });
    res.status(500).json({ error: 'Failed to get ROI' });
  }
});

// Get merchant performance
router.get('/merchant/:id/performance', async (req: Request, res: Response) => {
  try {
    const { period } = req.query;
    const performance = await adService.getMerchantPerformance(req.params.id, {
      period: period as string || '30d'
    });
    res.json({ success: true, data: performance });
  } catch (error) {
    logger.error('Get merchant performance failed', { error });
    res.status(500).json({ error: 'Failed to get performance' });
  }
});

// Sync campaigns
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const result = await adService.syncCampaigns();
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Sync campaigns failed', { error });
    res.status(500).json({ error: 'Failed to sync campaigns' });
  }
});

export default router;

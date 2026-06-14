import { Router, Request, Response } from 'express';
import frequencyService from '../services/frequencyService';
import { ApiResponse, CreativeFatigue } from '../types';
import logger from '../utils/logger';

const router = Router();

// Analyze fatigue for creative
router.post('/analyze/:creativeId', async (req: Request, res: Response) => {
  try {
    const campaignId = req.query.campaignId as string | undefined;

    const fatigue = frequencyService.analyzeFatigue(req.params.creativeId, campaignId);

    const response: ApiResponse<CreativeFatigue> = {
      success: true,
      data: fatigue
    };
    res.json(response);
  } catch (error) {
    logger.error('Error analyzing fatigue:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get fatigue for creative
router.get('/:creativeId', async (req: Request, res: Response) => {
  try {
    const fatigue = frequencyService.getFatigue(req.params.creativeId);

    if (!fatigue) {
      return res.status(404).json({ success: false, error: 'Fatigue data not found' });
    }

    const response: ApiResponse<CreativeFatigue> = {
      success: true,
      data: fatigue
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching fatigue:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get fatigues for campaign
router.get('/campaign/:campaignId', async (req: Request, res: Response) => {
  try {
    const fatigues = frequencyService.getFatiguesForCampaign(req.params.campaignId);

    const response: ApiResponse<CreativeFatigue[]> = {
      success: true,
      data: fatigues
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching campaign fatigues:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;

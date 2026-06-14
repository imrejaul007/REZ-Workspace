import { Router, Request, Response } from 'express';
import { z } from 'zod';
import frequencyService from '../services/frequencyService';
import { ApiResponse, FrequencyCheckResult } from '../types';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const recordImpressionSchema = z.object({
  userId: z.string().min(1),
  deviceId: z.string().optional(),
  campaignId: z.string().optional(),
  adGroupId: z.string().optional(),
  creativeId: z.string().optional(),
  timestamp: z.string().datetime().optional()
});

const checkFrequencySchema = z.object({
  userId: z.string().min(1),
  deviceId: z.string().optional(),
  campaignId: z.string().optional(),
  adGroupId: z.string().optional(),
  creativeId: z.string().optional()
});

// Record impression
router.post('/impression', async (req: Request, res: Response) => {
  try {
    const validatedData = recordImpressionSchema.parse(req.body);

    const record = frequencyService.recordImpression({
      ...validatedData,
      timestamp: validatedData.timestamp ? new Date(validatedData.timestamp) : new Date()
    });

    const response: ApiResponse<typeof record> = {
      success: true,
      data: record,
      message: 'Impression recorded'
    };
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    logger.error('Error recording impression:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Check frequency
router.post('/check', async (req: Request, res: Response) => {
  try {
    const validatedData = checkFrequencySchema.parse(req.body);

    const result = frequencyService.checkFrequency(validatedData);

    const response: ApiResponse<FrequencyCheckResult> = {
      success: true,
      data: result
    };
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    logger.error('Error checking frequency:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get user frequency records
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const records = frequencyService.getUserRecords(req.params.userId);

    const response: ApiResponse<typeof records> = {
      success: true,
      data: records
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching user records:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get specific record
router.get('/record', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const campaignId = req.query.campaignId as string | undefined;
    const adGroupId = req.query.adGroupId as string | undefined;
    const creativeId = req.query.creativeId as string | undefined;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const record = frequencyService.getRecord(userId, campaignId, adGroupId, creativeId);

    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    const response: ApiResponse<typeof record> = {
      success: true,
      data: record
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching record:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import frequencyService from '../services/frequencyService';
import { CappingScope, CappingLevel, TimeWindow, ApiResponse, FrequencyCap } from '../types';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createCapSchema = z.object({
  campaignId: z.string().optional(),
  adGroupId: z.string().optional(),
  creativeId: z.string().optional(),
  scope: z.nativeEnum(CappingScope),
  level: z.nativeEnum(CappingLevel).optional(),
  timeWindow: z.nativeEnum(TimeWindow).optional(),
  maxFrequency: z.number().int().min(1)
});

const updateCapSchema = z.object({
  maxFrequency: z.number().int().min(1).optional(),
  timeWindow: z.nativeEnum(TimeWindow).optional(),
  isActive: z.boolean().optional()
});

// Create frequency cap
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createCapSchema.parse(req.body);

    const cap = frequencyService.createCap(validatedData);

    const response: ApiResponse<FrequencyCap> = {
      success: true,
      data: cap,
      message: 'Frequency cap created successfully'
    };
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    logger.error('Error creating cap:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get cap
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const cap = frequencyService.getCap(req.params.id);

    if (!cap) {
      return res.status(404).json({ success: false, error: 'Cap not found' });
    }

    const response: ApiResponse<FrequencyCap> = {
      success: true,
      data: cap
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching cap:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// List caps
router.get('/', async (req: Request, res: Response) => {
  try {
    const campaignId = req.query.campaignId as string | undefined;
    const adGroupId = req.query.adGroupId as string | undefined;
    const scope = req.query.scope as CappingScope | undefined;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const caps = frequencyService.getCaps({ campaignId, adGroupId, scope, isActive });

    const response: ApiResponse<FrequencyCap[]> = {
      success: true,
      data: caps
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching caps:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update cap
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = updateCapSchema.parse(req.body);

    const cap = frequencyService.updateCap(req.params.id, validatedData);

    if (!cap) {
      return res.status(404).json({ success: false, error: 'Cap not found' });
    }

    const response: ApiResponse<FrequencyCap> = {
      success: true,
      data: cap,
      message: 'Frequency cap updated successfully'
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
    logger.error('Error updating cap:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete cap
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = frequencyService.deleteCap(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Cap not found' });
    }

    res.json({ success: true, message: 'Frequency cap deleted successfully' });
  } catch (error) {
    logger.error('Error deleting cap:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;

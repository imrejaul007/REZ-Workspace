import { Router, Request, Response } from 'express';
import { z } from 'zod';
import rotationService from '../services/rotationService';
import { CreativeStatus, ApiResponse, PaginatedResponse, Creative } from '../types';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createCreativeSchema = z.object({
  adSetId: z.string().min(1),
  name: z.string().min(1).max(200),
  creativeUrl: z.string().url().optional(),
  creativeHash: z.string().optional(),
  weight: z.number().min(0).default(1)
});

const updateCreativeSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  creativeUrl: z.string().url().optional(),
  creativeHash: z.string().optional(),
  status: z.nativeEnum(CreativeStatus).optional(),
  weight: z.number().min(0).optional()
});

const recordImpressionSchema = z.object({
  creativeId: z.string().uuid(),
  userId: z.string().optional(),
  sessionId: z.string().optional()
});

const recordClickSchema = z.object({
  creativeId: z.string().uuid(),
  userId: z.string().optional(),
  sessionId: z.string().optional()
});

const recordConversionSchema = z.object({
  creativeId: z.string().uuid(),
  userId: z.string().optional(),
  revenue: z.number().min(0).default(0),
  conversionValue: z.number().min(0).optional()
});

// Create creative
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createCreativeSchema.parse(req.body);

    const creative = rotationService.createCreative(validatedData);

    const response: ApiResponse<Creative> = {
      success: true,
      data: creative,
      message: 'Creative created successfully'
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
    logger.error('Error creating creative:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get creative
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const creative = rotationService.getCreative(req.params.id);

    if (!creative) {
      return res.status(404).json({ success: false, error: 'Creative not found' });
    }

    const response: ApiResponse<Creative> = {
      success: true,
      data: creative
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching creative:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get creatives for ad set
router.get('/adset/:adSetId', async (req: Request, res: Response) => {
  try {
    const creatives = rotationService.getCreativesForAdSet(req.params.adSetId);

    const response: ApiResponse<Creative[]> = {
      success: true,
      data: creatives
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching creatives:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update creative
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = updateCreativeSchema.parse(req.body);

    const creative = rotationService.updateCreative(req.params.id, validatedData);

    if (!creative) {
      return res.status(404).json({ success: false, error: 'Creative not found' });
    }

    const response: ApiResponse<Creative> = {
      success: true,
      data: creative,
      message: 'Creative updated successfully'
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
    logger.error('Error updating creative:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete creative
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = rotationService.deleteCreative(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Creative not found' });
    }

    res.json({ success: true, message: 'Creative deleted successfully' });
  } catch (error) {
    logger.error('Error deleting creative:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Record impression
router.post('/impression', async (req: Request, res: Response) => {
  try {
    const validatedData = recordImpressionSchema.parse(req.body);

    rotationService.recordImpression(validatedData.creativeId);

    res.json({ success: true, message: 'Impression recorded' });
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

// Record click
router.post('/click', async (req: Request, res: Response) => {
  try {
    const validatedData = recordClickSchema.parse(req.body);

    rotationService.recordClick(validatedData.creativeId);

    res.json({ success: true, message: 'Click recorded' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    logger.error('Error recording click:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Record conversion
router.post('/conversion', async (req: Request, res: Response) => {
  try {
    const validatedData = recordConversionSchema.parse(req.body);

    rotationService.recordConversion(validatedData.creativeId, validatedData.revenue);

    res.json({ success: true, message: 'Conversion recorded' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }
    logger.error('Error recording conversion:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;

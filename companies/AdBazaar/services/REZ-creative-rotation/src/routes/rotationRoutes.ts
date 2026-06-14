import { Router, Request, Response } from 'express';
import { z } from 'zod';
import rotationService from '../services/rotationService';
import { RotationMode, ApiResponse, RotationConfig, RotationDecision } from '../types';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createConfigSchema = z.object({
  adSetId: z.string().min(1),
  name: z.string().min(1).max(100),
  mode: z.nativeEnum(RotationMode),
  epsilon: z.number().min(0).max(1).default(0.1),
  minImpressionsPerCreative: z.number().int().min(100).default(1000),
  explorationRatio: z.number().min(0).max(1).default(0.2),
  abTestDistribution: z.record(z.number()).optional(),
  rotationEndDate: z.string().datetime().optional()
});

const updateConfigSchema = createConfigSchema.partial();

const selectCreativeSchema = z.object({
  adSetId: z.string().min(1),
  userId: z.string().optional()
});

// Create rotation config
router.post('/configs', async (req: Request, res: Response) => {
  try {
    const validatedData = createConfigSchema.parse(req.body);

    const config = rotationService.createConfig({
      ...validatedData,
      rotationStartDate: new Date(),
      isActive: true
    });

    const response: ApiResponse<RotationConfig> = {
      success: true,
      data: config,
      message: 'Rotation config created successfully'
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
    logger.error('Error creating config:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get config
router.get('/configs/:id', async (req: Request, res: Response) => {
  try {
    const config = rotationService.getConfig(req.params.id);

    if (!config) {
      return res.status(404).json({ success: false, error: 'Config not found' });
    }

    const response: ApiResponse<RotationConfig> = {
      success: true,
      data: config
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching config:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get config for ad set
router.get('/configs/adset/:adSetId', async (req: Request, res: Response) => {
  try {
    const config = rotationService.getConfigForAdSet(req.params.adSetId);

    if (!config) {
      return res.status(404).json({ success: false, error: 'No active config for this ad set' });
    }

    const response: ApiResponse<RotationConfig> = {
      success: true,
      data: config
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching config:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update config
router.put('/configs/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = updateConfigSchema.parse(req.body);

    const config = rotationService.updateConfig(req.params.id, validatedData);

    if (!config) {
      return res.status(404).json({ success: false, error: 'Config not found' });
    }

    const response: ApiResponse<RotationConfig> = {
      success: true,
      data: config,
      message: 'Config updated successfully'
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
    logger.error('Error updating config:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete config
router.delete('/configs/:id', async (req: Request, res: Response) => {
  try {
    const deleted = rotationService.deleteConfig(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Config not found' });
    }

    res.json({ success: true, message: 'Config deleted successfully' });
  } catch (error) {
    logger.error('Error deleting config:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Select creative for rotation
router.post('/select', async (req: Request, res: Response) => {
  try {
    const validatedData = selectCreativeSchema.parse(req.body);

    const decision = rotationService.selectCreative(validatedData.adSetId, validatedData.userId);

    const response: ApiResponse<RotationDecision> = {
      success: true,
      data: decision
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
    logger.error('Error selecting creative:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get rotation performance
router.get('/performance/:adSetId', async (req: Request, res: Response) => {
  try {
    const performance = rotationService.getRotationPerformance(req.params.adSetId);

    const response: ApiResponse<typeof performance> = {
      success: true,
      data: performance
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching performance:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;

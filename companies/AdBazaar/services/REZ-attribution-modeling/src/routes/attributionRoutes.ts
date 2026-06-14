import { Router, Request, Response } from 'express';
import { z } from 'zod';
import attributionService from '../services/attributionService';
import {
  AttributionModel,
  ApiResponse,
  AttributionResult,
  ChannelPerformance,
  AttributionConfig
} from '../types';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const attributionRequestSchema = z.object({
  userId: z.string().min(1),
  conversionId: z.string().uuid(),
  model: z.nativeEnum(AttributionModel).optional(),
  configId: z.string().uuid().optional()
});

const bulkAttributionRequestSchema = z.object({
  conversionIds: z.array(z.string().uuid()),
  model: z.nativeEnum(AttributionModel).optional(),
  configId: z.string().uuid().optional()
});

const createConfigSchema = z.object({
  name: z.string().min(1).max(100),
  model: z.nativeEnum(AttributionModel),
  lookbackWindowDays: z.number().int().min(1).max(90).default(30),
  positionBasedSettings: z.object({
    firstTouchWeight: z.number().min(0).max(1),
    lastTouchWeight: z.number().min(0).max(1),
    middleWeight: z.number().min(0).max(1)
  }).optional(),
  timeDecaySettings: z.object({
    halfLifeDays: z.number().min(1).default(7)
  }).optional(),
  dataDrivenSettings: z.object({
    minSampleSize: z.number().int().min(100).default(1000),
    algorithm: z.enum(['markov', 'shapley', 'linear_regression']).default('markov')
  }).optional(),
  excludedChannels: z.array(z.string()).default([]),
  isActive: z.boolean().default(true)
});

// Calculate attribution for a conversion
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const validatedData = attributionRequestSchema.parse(req.body);
    const { conversionId, model, configId } = validatedData;

    const result = attributionService.calculateAttribution(
      conversionId,
      model ?? AttributionModel.LINEAR,
      configId ? attributionService.getConfig(configId) : undefined
    );

    if (!result) {
      return res.status(404).json({ success: false, error: 'Conversion or touchpoints not found' });
    }

    const response: ApiResponse<AttributionResult> = {
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
    logger.error('Error calculating attribution:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Bulk calculate attribution
router.post('/calculate/bulk', async (req: Request, res: Response) => {
  try {
    const validatedData = bulkAttributionRequestSchema.parse(req.body);
    const { conversionIds, model, configId } = validatedData;

    const results = attributionService.bulkCalculateAttribution(
      conversionIds,
      model ?? AttributionModel.LINEAR,
      configId
    );

    const response: ApiResponse<AttributionResult[]> = {
      success: true,
      data: results,
      message: `Calculated attribution for ${results.length} conversions`
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
    logger.error('Error bulk calculating attribution:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Compare all models for a conversion
router.get('/compare/:conversionId', async (req: Request, res: Response) => {
  try {
    const results = attributionService.compareModels(req.params.conversionId);

    const response: ApiResponse<Record<AttributionModel, AttributionResult | null>> = {
      success: true,
      data: results
    };
    res.json(response);
  } catch (error) {
    logger.error('Error comparing models:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get channel performance
router.get('/channels/performance', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const performance = attributionService.getChannelPerformance(startDate, endDate);

    const response: ApiResponse<ChannelPerformance[]> = {
      success: true,
      data: performance
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching channel performance:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Config management
router.post('/configs', async (req: Request, res: Response) => {
  try {
    const validatedData = createConfigSchema.parse(req.body);

    const config = attributionService.createConfig(validatedData);

    const response: ApiResponse<AttributionConfig> = {
      success: true,
      data: config,
      message: 'Attribution config created successfully'
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

router.get('/configs', async (req: Request, res: Response) => {
  try {
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const configs = attributionService.getConfigs(isActive);

    const response: ApiResponse<AttributionConfig[]> = {
      success: true,
      data: configs
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching configs:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/configs/:id', async (req: Request, res: Response) => {
  try {
    const config = attributionService.getConfig(req.params.id);

    if (!config) {
      return res.status(404).json({ success: false, error: 'Config not found' });
    }

    const response: ApiResponse<AttributionConfig> = {
      success: true,
      data: config
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching config:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/configs/:id', async (req: Request, res: Response) => {
  try {
    const config = attributionService.updateConfig(req.params.id, req.body);

    if (!config) {
      return res.status(404).json({ success: false, error: 'Config not found' });
    }

    const response: ApiResponse<AttributionConfig> = {
      success: true,
      data: config,
      message: 'Config updated successfully'
    };
    res.json(response);
  } catch (error) {
    logger.error('Error updating config:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/configs/:id', async (req: Request, res: Response) => {
  try {
    const deleted = attributionService.deleteConfig(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Config not found' });
    }

    res.json({ success: true, message: 'Config deleted successfully' });
  } catch (error) {
    logger.error('Error deleting config:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;

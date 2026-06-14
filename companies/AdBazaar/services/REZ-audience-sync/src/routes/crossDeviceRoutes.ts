import { Router, Request, Response } from 'express';
import { z } from 'zod';
import audienceService from '../services/audienceService';
import { IdentifierType, ApiResponse, CrossDeviceMapping } from '../types';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createMappingSchema = z.object({
  userId: z.string().min(1),
  deviceIds: z.array(z.string()),
  identifiers: z.record(z.array(z.string()))
});

const matchSchema = z.object({
  sourceId: z.string().min(1),
  sourceType: z.nativeEnum(IdentifierType),
  targetType: z.nativeEnum(IdentifierType),
  threshold: z.number().min(0).max(1).optional()
});

// Middleware
const getTenantId = (req: Request): string => {
  return req.headers['x-tenant-id'] as string || 'default';
};

// Create cross-device mapping
router.post('/mappings', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const validatedData = createMappingSchema.parse(req.body);

    const mapping = audienceService.createCrossDeviceMapping(
      validatedData.userId,
      validatedData.deviceIds,
      validatedData.identifiers,
      tenantId
    );

    const response: ApiResponse<CrossDeviceMapping> = {
      success: true,
      data: mapping,
      message: 'Cross-device mapping created'
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
    logger.error('Error creating mapping:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Match cross-device
router.post('/match', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const validatedData = matchSchema.parse(req.body);

    const mapping = audienceService.matchCrossDevice({
      sourceId: validatedData.sourceId,
      sourceType: validatedData.sourceType,
      targetType: validatedData.targetType,
      threshold: validatedData.threshold
    }, tenantId);

    if (!mapping) {
      return res.status(404).json({ success: false, error: 'No matching device found' });
    }

    const response: ApiResponse<CrossDeviceMapping> = {
      success: true,
      data: mapping
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
    logger.error('Error matching cross-device:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get mappings for user
router.get('/mappings/user/:userId', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const mappings = audienceService.getCrossDeviceMappings(req.params.userId, tenantId);

    const response: ApiResponse<CrossDeviceMapping[]> = {
      success: true,
      data: mappings
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching mappings:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;

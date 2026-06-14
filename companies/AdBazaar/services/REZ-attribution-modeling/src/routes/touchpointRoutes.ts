import { Router, Request, Response } from 'express';
import { z } from 'zod';
import attributionService from '../services/attributionService';
import {
  TouchpointChannel,
  TouchpointStatus,
  ApiResponse,
  Touchpoint
} from '../types';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createTouchpointSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string(),
  channel: z.nativeEnum(TouchpointChannel),
  source: z.string(),
  campaignId: z.string().optional(),
  adGroupId: z.string().optional(),
  creativeId: z.string().optional(),
  keyword: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  interactionType: z.enum(['click', 'view', 'impression']).default('click'),
  value: z.number().min(0).default(0),
  metadata: z.record(z.any()).optional()
});

// Middleware
const getTenantId = (req: Request): string => {
  return req.headers['x-tenant-id'] as string || 'default';
};

// Create touchpoint
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createTouchpointSchema.parse(req.body);

    const touchpoint = attributionService.addTouchpoint({
      ...validatedData,
      timestamp: validatedData.timestamp ? new Date(validatedData.timestamp) : new Date(),
      metadata: validatedData.metadata ?? {}
    });

    const response: ApiResponse<Touchpoint> = {
      success: true,
      data: touchpoint,
      message: 'Touchpoint recorded successfully'
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
    logger.error('Error creating touchpoint:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get touchpoints for user
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const touchpoints = attributionService.getTouchpoints(req.params.userId);

    const response: ApiResponse<Touchpoint[]> = {
      success: true,
      data: touchpoints
    };
    res.json(response);
  } catch (error) {
    logger.error('Error fetching touchpoints:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Batch create touchpoints
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const schema = z.array(createTouchpointSchema);
    const validatedData = schema.parse(req.body);

    const touchpoints = validatedData.map(data =>
      attributionService.addTouchpoint({
        ...data,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        metadata: data.metadata ?? {}
      })
    );

    const response: ApiResponse<Touchpoint[]> = {
      success: true,
      data: touchpoints,
      message: `Created ${touchpoints.length} touchpoints`
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
    logger.error('Error batch creating touchpoints:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;

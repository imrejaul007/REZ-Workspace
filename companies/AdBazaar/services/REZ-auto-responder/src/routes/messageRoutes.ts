import { Router, Request, Response } from 'express';
import { z } from 'zod';
import responderService from '../services/responderService';
import { ResponsePlatform, ResponseChannel, ProcessMessageInput, ApiResponse } from '../types';
import logger from '../utils/logger';

const router = Router();

const getTenantId = (req: Request): string => {
  return req.headers['x-tenant-id'] as string || 'default';
};

const processMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  platform: z.nativeEnum(ResponsePlatform),
  channel: z.nativeEnum(ResponseChannel),
  authorHandle: z.string().min(1).max(100),
  authorId: z.string().min(1),
  messageId: z.string().min(1),
  postId: z.string().optional(),
  hashtags: z.array(z.string().max(100)).optional()
});

router.post('/process', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const validatedData = processMessageSchema.parse(req.body);

    const result = responderService.processMessage(validatedData, tenantId);

    const response: ApiResponse<typeof result> = {
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
    logger.error('Error processing message:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;

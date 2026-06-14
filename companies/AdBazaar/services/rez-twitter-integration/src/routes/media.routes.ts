import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import twitterService from '../services/twitter.service';
import logger from '../utils/logger';
import { ApiResponse } from '../types';
import { mediaUploadSchema } from '../utils/validation';
import { ZodError } from 'zod';

const router = Router();

// Middleware to extract tenant ID
const extractTenantId = (req: Request): string | null => {
  return req.headers['x-tenant-id'] as string || null;
};

// POST /media/upload - Upload media to Twitter
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const tenantId = extractTenantId(req);

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_ID',
          message: 'X-Tenant-ID header is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const { mediaData, mimeType, altText } = req.body;

    // Validate request
    try {
      mediaUploadSchema.parse({ mediaData, mimeType, altText });
    } catch (e) {
      const zodError = e as ZodError;
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: zodError.errors[0]?.message || 'Invalid media data',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    // Convert base64 to Buffer if needed
    let buffer: Buffer;
    if (typeof mediaData === 'string') {
      // Remove data URL prefix if present
      const base64Data = mediaData.replace(/^data:\w+\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } else if (Buffer.isBuffer(mediaData)) {
      buffer = mediaData;
    } else {
      throw new Error('Invalid media data format');
    }

    const result = await twitterService.uploadMedia(tenantId, buffer, mimeType, altText);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to upload media', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error instanceof Error ? error.message : 'Failed to upload media',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

export default router;

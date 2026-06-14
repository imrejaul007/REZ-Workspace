import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import twitterService from '../services/twitter.service';
import logger from '../utils/logger';
import { ApiResponse } from '../types';

const router = Router();

// Middleware to extract tenant ID
const extractTenantId = (req: Request): string | null => {
  return req.headers['x-tenant-id'] as string || null;
};

// POST /schedule - Schedule a tweet
router.post('/', async (req: Request, res: Response) => {
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

    const { content, scheduledAt, mediaIds, replyToId, threadTweets } = req.body;

    if (!content || !scheduledAt) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'content and scheduledAt are required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'scheduledAt must be a valid date',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    if (scheduledDate <= new Date()) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'DATE_IN_PAST',
          message: 'scheduledAt must be in the future',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const scheduledTweet = twitterService.scheduleTweet(tenantId, content, scheduledDate, {
      mediaIds,
      replyToId,
      threadTweets,
    });

    const response: ApiResponse<typeof scheduledTweet> = {
      success: true,
      data: scheduledTweet,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Failed to schedule tweet', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'SCHEDULE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to schedule tweet',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// GET /schedule - Get scheduled tweets
router.get('/', async (req: Request, res: Response) => {
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

    const scheduledTweets = twitterService.getScheduledTweets(tenantId);

    const response: ApiResponse<typeof scheduledTweets> = {
      success: true,
      data: scheduledTweets,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get scheduled tweets', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_SCHEDULED_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get scheduled tweets',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// DELETE /schedule/:id - Cancel a scheduled tweet
router.delete('/:id', async (req: Request, res: Response) => {
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

    const { id } = req.params;
    const cancelled = twitterService.cancelScheduledTweet(tenantId, id);

    if (!cancelled) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Scheduled tweet not found',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<{ cancelled: boolean }> = {
      success: true,
      data: { cancelled: true },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to cancel scheduled tweet', { scheduleId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'CANCEL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to cancel scheduled tweet',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// GET /schedule/:id - Get a specific scheduled tweet
router.get('/:id', async (req: Request, res: Response) => {
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

    const { id } = req.params;
    const scheduledTweet = twitterService.getScheduledTweet(tenantId, id);

    if (!scheduledTweet) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Scheduled tweet not found',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof scheduledTweet> = {
      success: true,
      data: scheduledTweet,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get scheduled tweet', { scheduleId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'GET_SCHEDULED_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get scheduled tweet',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// PUT /schedule/:id - Update a scheduled tweet
router.put('/:id', async (req: Request, res: Response) => {
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

    const { id } = req.params;
    const { content, scheduledAt, mediaIds } = req.body;

    const updates: { content?: string; scheduledAt?: Date; mediaIds?: string[] } = {};

    if (content !== undefined) {
      if (typeof content !== 'string' || content.length === 0 || content.length > 280) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Content must be a non-empty string up to 280 characters',
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: uuidv4(),
          },
        };
        return res.status(400).json(response);
      }
      updates.content = content;
    }

    if (scheduledAt !== undefined) {
      const date = new Date(scheduledAt);
      if (isNaN(date.getTime())) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'INVALID_DATE',
            message: 'scheduledAt must be a valid date',
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: uuidv4(),
          },
        };
        return res.status(400).json(response);
      }
      if (date <= new Date()) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'DATE_IN_PAST',
            message: 'scheduledAt must be in the future',
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: uuidv4(),
          },
        };
        return res.status(400).json(response);
      }
      updates.scheduledAt = date;
    }

    if (mediaIds !== undefined) {
      if (!Array.isArray(mediaIds)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'mediaIds must be an array of strings',
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: uuidv4(),
          },
        };
        return res.status(400).json(response);
      }
      updates.mediaIds = mediaIds;
    }

    if (Object.keys(updates).length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NO_UPDATES',
          message: 'At least one field must be provided for update',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    const updatedTweet = twitterService.updateScheduledTweet(tenantId, id, updates);

    if (!updatedTweet) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Scheduled tweet not found or cannot be updated',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof updatedTweet> = {
      success: true,
      data: updatedTweet,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to update scheduled tweet', { scheduleId: req.params.id, error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update scheduled tweet',
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

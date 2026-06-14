import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import redditService from '../services/reddit.service';
import logger from '../utils/logger';
import { ApiResponse } from '../types';

const router = Router();

const extractTenantId = (req: Request): string | null => {
  return req.headers['x-tenant-id'] as string || null;
};

// GET /messages/inbox - Get inbox messages
router.get('/inbox', async (req: Request, res: Response) => {
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

    const { limit } = req.query;

    const messages = await redditService.getInbox(tenantId, {
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    const response: ApiResponse<typeof messages> = {
      success: true,
      data: messages,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get inbox', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INBOX_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get inbox',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// GET /messages/unread/count - Get unread messages count
router.get('/unread/count', async (req: Request, res: Response) => {
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

    const count = await redditService.getUnreadCount(tenantId);

    const response: ApiResponse<{ unreadCount: number }> = {
      success: true,
      data: { unreadCount: count },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to get unread count', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'UNREAD_COUNT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get unread count',
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

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import twitterService from '../services/twitter.service';
import logger from '../utils/logger';
import { ApiResponse } from '../types';

const router = Router();

// GET /auth/url - Generate OAuth URL for Twitter
router.get('/url', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

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

    const redirectUri = req.query.redirect_uri as string | undefined;
    const authUrl = twitterService.generateOAuthUrl(tenantId, redirectUri);

    const response: ApiResponse<{ authUrl: string }> = {
      success: true,
      data: { authUrl },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to generate auth URL', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'AUTH_URL_ERROR',
        message: 'Failed to generate authentication URL',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// GET /auth/callback - OAuth callback
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      logger.error('OAuth error', { error, error_description });
      return res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/oauth/error?message=${encodeURIComponent(error_description as string || 'Authentication failed')}`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/oauth/error?message=Missing code or state parameter`);
    }

    const token = await twitterService.exchangeCodeForToken(code as string, state as string);

    logger.info('OAuth successful', { state });

    // Redirect to success page with token info
    res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/oauth/success?token=${token.access_token}`);
  } catch (error) {
    logger.error('OAuth callback error', { error });
    res.redirect(`${process.env.APP_URL || 'http://localhost:3000'}/oauth/error?message=Authentication failed`);
  }
});

// POST /auth/token - Set access token directly (for testing or manual token entry)
router.post('/token', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

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

    const { accessToken, refreshToken } = req.body;

    if (!accessToken) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };
      return res.status(400).json(response);
    }

    twitterService.setAccessToken(tenantId, accessToken, refreshToken);

    const response: ApiResponse<{ connected: boolean }> = {
      success: true,
      data: { connected: true },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to set token', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'TOKEN_ERROR',
        message: 'Failed to set access token',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// DELETE /auth/disconnect - Disconnect Twitter integration
router.delete('/disconnect', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

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

    twitterService.disconnectTenant(tenantId);

    const response: ApiResponse<{ disconnected: boolean }> = {
      success: true,
      data: { disconnected: true },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to disconnect', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DISCONNECT_ERROR',
        message: 'Failed to disconnect Twitter integration',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };
    res.status(500).json(response);
  }
});

// GET /auth/status - Check connection status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

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

    const isConnected = twitterService.isConnected(tenantId);
    const rateLimitStatus = twitterService.getRateLimitStatus(tenantId);

    const response: ApiResponse<{
      connected: boolean;
      rateLimit: {
        remaining: number;
        resetAt: string;
        limit: number;
      };
    }> = {
      success: true,
      data: {
        connected: isConnected,
        rateLimit: {
          remaining: rateLimitStatus.remaining,
          resetAt: rateLimitStatus.resetAt.toISOString(),
          limit: rateLimitStatus.limit,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to check status', { error });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'STATUS_ERROR',
        message: 'Failed to check connection status',
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

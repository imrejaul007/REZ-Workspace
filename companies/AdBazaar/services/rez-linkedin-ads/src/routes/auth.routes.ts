import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import linkedInService from '../services/linkedin.service';
import logger from '../utils/logger';
import { validateBody, requireTenantId } from '../middleware/validation.middleware';
import { AccessTokenRequestSchema } from '../validators/linkedin.schemas';
import { ApiResponse } from '../types';

const router = Router();

/**
 * GET /auth/url - Generate OAuth URL for LinkedIn authorization
 */
router.get('/url', async (req: Request, res: Response) => {
  const requestId = uuidv4();

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
          requestId,
        },
      };
      return res.status(400).json(response);
    }

    const authUrl = linkedInService.generateAuthUrl(tenantId);

    logger.info('Auth URL generated', { tenantId, requestId });

    const response: ApiResponse<{ authUrl: string }> = {
      success: true,
      data: { authUrl },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to generate auth URL', {
      error: error instanceof Error ? error.message : String(error),
      requestId,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'AUTH_URL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate authentication URL',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
    res.status(500).json(response);
  }
});

/**
 * GET /auth/callback - OAuth callback from LinkedIn
 */
router.get('/callback', async (req: Request, res: Response) => {
  const requestId = uuidv4();

  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      logger.error('OAuth error from LinkedIn', {
        error,
        error_description,
        requestId,
      });
      return res.redirect(
        `${process.env.APP_URL || 'http://localhost:3000'}/oauth/error?message=${encodeURIComponent(error_description as string || 'Authentication failed')}`
      );
    }

    if (!code || !state) {
      logger.warn('Missing code or state in OAuth callback', { requestId });
      return res.redirect(
        `${process.env.APP_URL || 'http://localhost:3000'}/oauth/error?message=Missing code or state parameter`
      );
    }

    const tokenData = await linkedInService.exchangeCodeForToken(String(code), String(state));

    // Parse state to get tenant ID for redirect
    const stateData = linkedInService.parseOAuthState(state as string);
    const tenantId = stateData?.tenantId || String(state);

    logger.info('OAuth successful', { tenantId, requestId });

    // Redirect to success page with tenant info
    res.redirect(
      `${process.env.APP_URL || 'http://localhost:3000'}/oauth/success?tenantId=${encodeURIComponent(tenantId)}`
    );
  } catch (error) {
    logger.error('OAuth callback error', {
      error: error instanceof Error ? error.message : String(error),
      requestId,
    });
    res.redirect(
      `${process.env.APP_URL || 'http://localhost:3000'}/oauth/error?message=${encodeURIComponent(error instanceof Error ? error.message : 'Authentication failed')}`
    );
  }
});

/**
 * POST /auth/token - Set access token directly (for testing or manual setup)
 */
router.post(
  '/token',
  validateBody(AccessTokenRequestSchema),
  async (req: Request, res: Response) => {
    const requestId = uuidv4();

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
            requestId,
          },
        };
        return res.status(400).json(response);
      }

      const { accessToken, refreshToken } = req.body;

      linkedInService.setAccessToken(tenantId, accessToken, refreshToken);

      logger.info('Access token set', { tenantId, hasRefreshToken: !!refreshToken, requestId });

      const response: ApiResponse<{ connected: boolean }> = {
        success: true,
        data: { connected: true },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to set token', {
        error: error instanceof Error ? error.message : String(error),
        requestId,
      });

      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TOKEN_ERROR',
          message: error instanceof Error ? error.message : 'Failed to set access token',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      res.status(500).json(response);
    }
  }
);

/**
 * POST /auth/refresh - Refresh the access token
 */
router.post('/refresh', requireTenantId(), async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    const tokenData = await linkedInService.refreshToken(tenantId);

    logger.info('Token refreshed', { tenantId, requestId });

    const response: ApiResponse<typeof tokenData> = {
      success: true,
      data: tokenData,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to refresh token', {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
      requestId,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'REFRESH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to refresh token',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    const statusCode = error instanceof Error && error.message.includes('refresh token') ? 400 : 500;
    res.status(statusCode).json(response);
  }
});

/**
 * DELETE /auth/disconnect - Disconnect LinkedIn integration
 */
router.delete('/disconnect', requireTenantId(), async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    linkedInService.disconnectTenant(tenantId);

    logger.info('Tenant disconnected', { tenantId, requestId });

    const response: ApiResponse<{ disconnected: boolean }> = {
      success: true,
      data: { disconnected: true },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to disconnect', {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
      requestId,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'DISCONNECT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to disconnect LinkedIn integration',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
    res.status(500).json(response);
  }
});

/**
 * GET /auth/status - Check connection status
 */
router.get('/status', requireTenantId(), async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    const status = linkedInService.getConnectionStatus(tenantId);

    const response: ApiResponse<typeof status> = {
      success: true,
      data: status,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Failed to check status', {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
      requestId,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'STATUS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to check connection status',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
    res.status(500).json(response);
  }
});

export default router;

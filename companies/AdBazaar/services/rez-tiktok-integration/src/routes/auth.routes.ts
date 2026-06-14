import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ZodError } from 'zod';
import tiktokService from '../services/tiktok.service';
import logger from '../utils/logger';
import { ApiResponse, SetTokenSchema } from '../types';

const router = Router();

// Helper to extract tenant ID
const extractTenantId = (req: Request): string | null => {
  return req.headers['x-tenant-id'] as string || null;
};

// Helper to create error response
const createErrorResponse = (
  code: string,
  message: string,
  requestId: string,
  details?: unknown
): ApiResponse => ({
  success: false,
  error: { code, message, details },
  meta: {
    timestamp: new Date().toISOString(),
    requestId,
  },
});

// Helper to create success response
const createSuccessResponse = <T>(
  data: T,
  requestId: string
): ApiResponse<T> => ({
  success: true,
  data,
  meta: {
    timestamp: new Date().toISOString(),
    requestId,
  },
});

// ==========================================
// OAuth Routes
// ==========================================

/**
 * GET /auth/url
 * Generate OAuth authorization URL for TikTok Login Kit
 */
router.get('/url', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = extractTenantId(req);

  if (!tenantId) {
    return res.status(400).json(
      createErrorResponse('MISSING_TENANT_ID', 'X-Tenant-ID header is required', requestId)
    );
  }

  try {
    // Validate client key is configured
    if (!process.env.TIKTOK_CLIENT_KEY) {
      logger.error('TikTok client key not configured');
      return res.status(500).json(
        createErrorResponse(
          'CONFIGURATION_ERROR',
          'TikTok integration not configured',
          requestId
        )
      );
    }

    const authUrl = tiktokService.generateAuthUrl(tenantId);

    logger.info('Generated auth URL', { tenantId, requestId });

    res.json(createSuccessResponse({ authUrl }, requestId));
  } catch (error) {
    logger.error('Failed to generate auth URL', { error, tenantId, requestId });
    res.status(500).json(
      createErrorResponse(
        'AUTH_URL_ERROR',
        'Failed to generate authentication URL',
        requestId
      )
    );
  }
});

/**
 * GET /auth/callback
 * OAuth callback endpoint - handles TikTok Login Kit redirect
 */
router.get('/callback', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const { code, state, error, error_description } = req.query;

  // Handle OAuth errors from TikTok
  if (error) {
    logger.error('TikTok OAuth error', {
      error,
      error_description,
      requestId,
    });
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    return res.redirect(
      `${appUrl}/oauth/error?message=${encodeURIComponent(error_description as string || 'Authentication failed')}&code=${error}`
    );
  }

  // Validate required params
  if (!code || !state) {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    return res.redirect(
      `${appUrl}/oauth/error?message=${encodeURIComponent('Missing code or state parameter')}`
    );
  }

  // Decode state to get tenantId
  let tenantId: string;
  try {
    const stateData = JSON.parse(Buffer.from(state as string, 'base64url').toString('utf-8'));
    tenantId = stateData.tenantId;
  } catch {
    logger.error('Failed to decode OAuth state', { state, requestId });
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    return res.redirect(
      `${appUrl}/oauth/error?message=${encodeURIComponent('Invalid state parameter')}`
    );
  }

  try {
    await tiktokService.exchangeCodeForToken(code as string, tenantId);

    logger.info('OAuth successful', { tenantId, requestId });

    // Redirect to success page
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    res.redirect(`${appUrl}/oauth/success?tenantId=${encodeURIComponent(tenantId)}`);
  } catch (error) {
    logger.error('OAuth callback failed', { error, tenantId, requestId });
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    res.redirect(
      `${appUrl}/oauth/error?message=${encodeURIComponent('Authentication failed')}`
    );
  }
});

/**
 * POST /auth/token
 * Set access token directly (for manual configuration or testing)
 */
router.post('/token', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = extractTenantId(req);

  if (!tenantId) {
    return res.status(400).json(
      createErrorResponse('MISSING_TENANT_ID', 'X-Tenant-ID header is required', requestId)
    );
  }

  try {
    // Validate request body with Zod
    const validatedData = SetTokenSchema.parse(req.body);

    tiktokService.setAccessToken(tenantId, validatedData.accessToken, validatedData.openId);

    logger.info('Access token set', { tenantId, requestId });

    res.json(createSuccessResponse({ connected: true }, requestId));
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn('Invalid token request', { errors: error.errors, tenantId, requestId });
      return res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Invalid request data',
          requestId,
          error.errors
        )
      );
    }

    logger.error('Failed to set token', { error, tenantId, requestId });
    res.status(500).json(
      createErrorResponse('TOKEN_ERROR', 'Failed to set access token', requestId)
    );
  }
});

/**
 * DELETE /auth/disconnect
 * Disconnect TikTok integration for a tenant
 */
router.delete('/disconnect', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = extractTenantId(req);

  if (!tenantId) {
    return res.status(400).json(
      createErrorResponse('MISSING_TENANT_ID', 'X-Tenant-ID header is required', requestId)
    );
  }

  try {
    tiktokService.disconnectTenant(tenantId);

    logger.info('Tenant disconnected', { tenantId, requestId });

    res.json(createSuccessResponse({ disconnected: true }, requestId));
  } catch (error) {
    logger.error('Failed to disconnect', { error, tenantId, requestId });
    res.status(500).json(
      createErrorResponse(
        'DISCONNECT_ERROR',
        'Failed to disconnect TikTok integration',
        requestId
      )
    );
  }
});

/**
 * GET /auth/status
 * Check connection status for a tenant
 */
router.get('/status', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = extractTenantId(req);

  if (!tenantId) {
    return res.status(400).json(
      createErrorResponse('MISSING_TENANT_ID', 'X-Tenant-ID header is required', requestId)
    );
  }

  try {
    const connectionInfo = tiktokService.getConnectionInfo(tenantId);

    res.json(createSuccessResponse(connectionInfo, requestId));
  } catch (error) {
    logger.error('Failed to check status', { error, tenantId, requestId });
    res.status(500).json(
      createErrorResponse('STATUS_ERROR', 'Failed to check connection status', requestId)
    );
  }
});

/**
 * POST /auth/refresh
 * Refresh the access token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  const requestId = uuidv4();
  const tenantId = extractTenantId(req);

  if (!tenantId) {
    return res.status(400).json(
      createErrorResponse('MISSING_TENANT_ID', 'X-Tenant-ID header is required', requestId)
    );
  }

  try {
    const connectionInfo = tiktokService.getConnectionInfo(tenantId);

    if (!connectionInfo.hasToken) {
      return res.status(400).json(
        createErrorResponse(
          'NO_TOKEN',
          'No token available to refresh. Please authenticate first.',
          requestId
        )
      );
    }

    // Note: For full refresh, you would need to store and use the refresh_token
    // This is a placeholder for the refresh flow
    res.json(createSuccessResponse({
      message: 'Token refresh not implemented - requires refresh_token storage',
      connected: connectionInfo.connected
    }, requestId));
  } catch (error) {
    logger.error('Failed to refresh token', { error, tenantId, requestId });
    res.status(500).json(
      createErrorResponse('REFRESH_ERROR', 'Failed to refresh token', requestId)
    );
  }
});

export default router;

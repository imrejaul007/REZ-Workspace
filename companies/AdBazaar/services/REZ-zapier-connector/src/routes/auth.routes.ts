import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { ApiResponse, ApiKey, Permission } from '../types';

const router = Router();

const getTenantId = (req: Request): string => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }
  return tenantId;
};

// Create API key
router.post('/api-keys', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { name, permissions, expiresAt } = req.body;

    if (!name || !permissions || !Array.isArray(permissions)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'name and permissions are required',
      };
      return res.status(400).json(response);
    }

    const apiKey = await authService.createApiKey(
      tenantId,
      name,
      permissions as Permission[],
      expiresAt ? new Date(expiresAt) : undefined
    );

    const response: ApiResponse<ApiKey> = {
      success: true,
      data: apiKey,
      message: 'API key created successfully. Store it securely - it will not be shown again.',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create API key',
    };
    res.status(400).json(response);
  }
});

// Get all API keys
router.get('/api-keys', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const apiKeys = await authService.getAllApiKeys(tenantId);
    const response: ApiResponse<ApiKey[]> = {
      success: true,
      data: apiKeys,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch API keys',
    };
    res.status(500).json(response);
  }
});

// Delete API key
router.delete('/api-keys/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const deleted = await authService.deleteApiKey(tenantId, req.params.id);
    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'API key not found',
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<null> = {
      success: true,
      message: 'API key deleted successfully',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete API key',
    };
    res.status(500).json(response);
  }
});

// OAuth initiation
router.get('/oauth/authorize', async (req: Request, res: Response) => {
  try {
    const { tenantId, redirectUri, clientId } = req.query;

    if (!tenantId || !redirectUri) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'tenantId and redirectUri are required',
      };
      return res.status(400).json(response);
    }

    const state = authService.createOAuthState(
      tenantId as string,
      redirectUri as string
    );

    const authUrl = `${process.env.REZ_API_BASE_URL}/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(`${process.env.OAUTH_REDIRECT_URI}?state=${state.state}`)}&response_type=code`;

    const response: ApiResponse<{ authUrl: string; state: string }> = {
      success: true,
      data: { authUrl, state: state.state },
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate OAuth',
    };
    res.status(500).json(response);
  }
});

// OAuth callback
router.get('/oauth/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${req.query.redirect_uri || '/'}?error=${error}`);
    }

    if (!code || !state) {
      return res.redirect(`${req.query.redirect_uri || '/'}?error=missing_params`);
    }

    const oauthState = authService.consumeOAuthState(state as string);
    if (!oauthState) {
      return res.redirect(`${oauthState?.redirectUri || '/'}?error=invalid_state`);
    }

    // In production, exchange code for tokens with the OAuth provider
    const tokens = {
      accessToken: `access_${Date.now()}`,
      refreshToken: `refresh_${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };

    const redirectUrl = new URL(oauthState.redirectUri);
    redirectUrl.searchParams.set('code', code);
    redirectUrl.searchParams.set('access_token', tokens.accessToken);
    redirectUrl.searchParams.set('refresh_token', tokens.refreshToken);

    res.redirect(redirectUrl.toString());
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'OAuth callback failed',
    };
    res.status(500).json(response);
  }
});

export default router;

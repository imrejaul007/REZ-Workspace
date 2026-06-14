import { Router, Request, Response, NextFunction } from 'express';
import { PinterestApiClient } from '../services/pinterestApi.service';
import { PinterestService } from '../services/pinterest.service';
import config from '../config';
import logger from 'utils/logger.js';
import { AppError } from '../middleware';

const router = Router();
const pinterestService = new PinterestService();

/**
 * @route GET /api/auth/oauth
 * @description Initiate Pinterest OAuth flow
 */
router.get('/oauth', (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = Math.random().toString(36).substring(2, 15);
    const oauthUrl = `https://www.pinterest.com/oauth/?response_type=code&client_id=${config.pinterest.appId}&redirect_uri=${encodeURIComponent(config.pinterest.redirectUri)}&scope=boards:read%20boards:write%20pins:read%20pins:write%20user_accounts:read&state=${state}`;

    logger.info('Initiating Pinterest OAuth flow', { state });

    res.json({
      success: true,
      data: {
        oauthUrl,
        state,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/auth/callback
 * @description Handle Pinterest OAuth callback
 */
router.get('/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      logger.error('Pinterest OAuth error:', { error });
      throw new AppError(400, `Pinterest OAuth error: ${error}`);
    }

    if (!code) {
      throw new AppError(400, 'Authorization code is required');
    }

    // Exchange code for access token
    const apiClient = new PinterestApiClient();
    const tokenResponse = await apiClient.exchangeCodeForToken(code as string);

    // Connect account using the access token
    const account = await pinterestService.connectAccount(
      '', // pinterestUserId will be fetched from API
      tokenResponse.access_token,
      tokenResponse.refresh_token
    );

    logger.info('Pinterest OAuth callback successful', { accountId: account.id });

    res.json({
      success: true,
      data: {
        accountId: account.id,
        username: account.username,
        accessToken: tokenResponse.access_token,
        expiresIn: tokenResponse.expires_in,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/refresh
 * @description Refresh access token
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      throw new AppError(400, 'Account ID is required');
    }

    const account = await pinterestService.getAccountById(accountId);
    if (!account) {
      throw new AppError(404, 'Account not found');
    }

    if (!account.refreshToken) {
      throw new AppError(400, 'No refresh token available');
    }

    const apiClient = new PinterestApiClient();
    const tokenResponse = await apiClient.refreshAccessToken(account.refreshToken);

    // Update account tokens
    account.accessToken = tokenResponse.access_token;
    if (tokenResponse.refresh_token) {
      account.refreshToken = tokenResponse.refresh_token;
    }
    await account.save();

    logger.info('Token refreshed for account', { accountId });

    res.json({
      success: true,
      data: {
        accessToken: tokenResponse.access_token,
        expiresIn: tokenResponse.expires_in,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/verify
 * @description Verify access token validity
 */
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      throw new AppError(400, 'Access token is required');
    }

    const apiClient = new PinterestApiClient(accessToken);
    const user = await apiClient.getCurrentUser();

    res.json({
      success: true,
      data: {
        valid: true,
        userId: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      data: {
        valid: false,
        error: 'Invalid or expired access token',
      },
    });
  }
});

export default router;
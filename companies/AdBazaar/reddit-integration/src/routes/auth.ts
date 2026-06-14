import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { redditApi } from '../services/redditApi';
import { RedditAccount } from '../models';
import { asyncHandler, oauthRequestSchema, tokenExchangeSchema } from '../middleware';
import { logger } from '../config/logger';

const router = Router();

/**
 * POST /api/auth/oauth
 * Initiate Reddit OAuth flow
 */
router.post(
  '/oauth',
  asyncHandler(async (req: Request, res: Response) => {
    const { state } = oauthRequestSchema.parse(req.body);

    // Generate state if not provided
    const oauthState = state || uuidv4();

    // Store state for validation (in production, use Redis or similar)
    logger.info('Initiating Reddit OAuth', { state: oauthState });

    const authUrl = await redditApi.getAuthorizationUrl(oauthState);

    res.json({
      success: true,
      data: {
        authUrl,
        state: oauthState,
      },
    });
  })
);

/**
 * GET /api/auth/callback
 * OAuth callback handler
 */
router.get(
  '/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const { code, state, error } = req.query;

    // Handle OAuth error
    if (error) {
      logger.error('Reddit OAuth error', { error });
      res.status(400).json({
        success: false,
        error: `OAuth error: ${error}`,
        code: 'OAUTH_ERROR',
      });
      return;
    }

    if (!code || typeof code !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Authorization code is required',
        code: 'MISSING_CODE',
      });
      return;
    }

    try {
      // Exchange code for tokens
      const tokenData = await redditApi.exchangeCodeForToken(code);

      // Get Reddit user info
      const redditUser = await redditApi.getMe(tokenData.access_token);

      // Find or create account
      let account = await RedditAccount.findOne({
        redditUserId: redditUser.id,
      });

      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      if (account) {
        // Update existing account
        account.accessToken = tokenData.access_token;
        account.refreshToken = tokenData.refresh_token;
        account.tokenExpiresAt = expiresAt;
        account.username = redditUser.name;
        account.karma = redditUser.total_karma;
        account.linked = true;
        await account.save();

        logger.info('Reddit account updated', {
          accountId: account._id,
          username: account.username,
        });
      } else {
        // Create new account
        account = await RedditAccount.create({
          redditUserId: redditUser.id,
          username: redditUser.name,
          karma: redditUser.total_karma,
          linked: true,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt: expiresAt,
        });

        logger.info('Reddit account created', {
          accountId: account._id,
          username: account.username,
        });
      }

      res.json({
        success: true,
        data: {
          accountId: account._id,
          username: account.username,
          karma: account.karma,
        },
      });
    } catch (error) {
      logger.error('Token exchange failed', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to complete OAuth flow',
        code: 'TOKEN_EXCHANGE_FAILED',
      });
    }
  })
);

/**
 * GET /api/auth/accounts
 * List linked Reddit accounts
 */
router.get(
  '/accounts',
  asyncHandler(async (req: Request, res: Response) => {
    const accounts = await RedditAccount.find({ linked: true }).select(
      '-accessToken -refreshToken -tokenExpiresAt'
    );

    res.json({
      success: true,
      data: {
        accounts,
        count: accounts.length,
      },
    });
  })
);

/**
 * DELETE /api/auth/accounts/:id
 * Unlink a Reddit account
 */
router.delete(
  '/accounts/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const account = await RedditAccount.findById(req.params.id);

    if (!account) {
      res.status(404).json({
        success: false,
        error: 'Account not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    account.linked = false;
    await account.save();

    logger.info('Reddit account unlinked', {
      accountId: account._id,
      username: account.username,
    });

    res.json({
      success: true,
      data: {
        message: 'Account unlinked successfully',
        accountId: account._id,
      },
    });
  })
);

/**
 * POST /api/auth/refresh
 * Refresh account tokens
 */
router.post(
  '/refresh/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const account = await RedditAccount.findById(req.params.id);

    if (!account) {
      res.status(404).json({
        success: false,
        error: 'Account not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    try {
      const tokenData = await redditApi.exchangeCodeForToken(account.refreshToken);

      account.accessToken = tokenData.access_token;
      if (tokenData.refresh_token) {
        account.refreshToken = tokenData.refresh_token;
      }
      account.tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      await account.save();

      logger.info('Token refreshed', { accountId: account._id });

      res.json({
        success: true,
        data: {
          message: 'Token refreshed successfully',
        },
      });
    } catch (error) {
      logger.error('Token refresh failed', { error, accountId: account._id });
      res.status(500).json({
        success: false,
        error: 'Failed to refresh token',
        code: 'REFRESH_FAILED',
      });
    }
  })
);

export default router;
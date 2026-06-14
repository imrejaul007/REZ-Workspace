import { Router, Request, Response } from 'express';
import { youtubeService } from '../services/YouTubeService.js';
import { channelService } from '../services/ChannelService.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

const router = Router();

// GET /api/auth/oauth - Initiate OAuth flow
router.get('/oauth', asyncHandler(async (req: Request, res: Response) => {
  const state = req.query.state as string || undefined;
  const authUrl = youtubeService.getAuthUrl(state);

  logger.info('OAuth flow initiated', { state });

  res.json({
    success: true,
    data: {
      authUrl,
    },
  });
}));

// GET /api/auth/callback - OAuth callback handler
router.get('/callback', asyncHandler(async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    logger.error('OAuth error', { error });
    throw createError('OAuth authentication failed', 401, 'OAUTH_ERROR');
  }

  if (!code) {
    throw createError('Authorization code not provided', 400, 'MISSING_CODE');
  }

  try {
    // Exchange code for tokens
    const tokens = await youtubeService.getTokenFromCode(code as string);

    // Get channel ID from user info
    // In production, you would get the user's channel ID here
    // For now, we'll return the tokens
    logger.info('OAuth callback successful', { state });

    // Redirect back to frontend with success
    // In production, this would redirect to your frontend app
    res.json({
      success: true,
      message: 'OAuth authentication successful',
      data: {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
      },
    });
  } catch (err) {
    logger.error('Token exchange failed', { error: (err as Error).message });
    throw createError('Failed to exchange authorization code', 500, 'TOKEN_EXCHANGE_ERROR');
  }
}));

// POST /api/auth/connect - Connect a YouTube channel
router.post('/connect', asyncHandler(async (req: Request, res: Response) => {
  const { youtubeChannelId, accessToken, refreshToken } = req.body;

  if (!youtubeChannelId) {
    throw createError('YouTube channel ID is required', 400, 'MISSING_CHANNEL_ID');
  }

  if (!accessToken) {
    throw createError('Access token is required', 400, 'MISSING_ACCESS_TOKEN');
  }

  const channel = await channelService.connectChannel({
    youtubeChannelId,
    accessToken,
    refreshToken,
  });

  logger.info('YouTube channel connected', {
    channelId: channel.id,
    youtubeChannelId: channel.youtubeChannelId,
  });

  res.status(201).json({
    success: true,
    data: channel,
  });
}));

export default router;
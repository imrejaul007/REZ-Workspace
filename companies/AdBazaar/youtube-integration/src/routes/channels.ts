import { Router, Request, Response } from 'express';
import { channelService } from '../services/ChannelService.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

const router = Router();

// GET /api/channels - List connected channels
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

  const result = await channelService.getChannels({ page, limit });

  res.json({
    success: true,
    data: result.channels,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
}));

// GET /api/channels/:id - Get channel by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const channel = await channelService.getChannelById(req.params.id);

  if (!channel) {
    throw createError('Channel not found', 404, 'CHANNEL_NOT_FOUND');
  }

  res.json({
    success: true,
    data: channel,
  });
}));

// POST /api/channels/connect - Connect a new YouTube channel
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

  logger.info('Channel connected via API', {
    channelId: channel.id,
    youtubeChannelId: channel.youtubeChannelId,
  });

  res.status(201).json({
    success: true,
    data: channel,
  });
}));

// POST /api/channels/:id/refresh - Refresh channel stats
router.post('/:id/refresh', asyncHandler(async (req: Request, res: Response) => {
  const channel = await channelService.refreshChannelStats(req.params.id);

  if (!channel) {
    throw createError('Channel not found', 404, 'CHANNEL_NOT_FOUND');
  }

  res.json({
    success: true,
    data: channel,
  });
}));

// DELETE /api/channels/:id - Disconnect channel
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await channelService.disconnectChannel(req.params.id);

  logger.info('Channel disconnected', { channelId: req.params.id });

  res.json({
    success: true,
    message: 'Channel disconnected successfully',
  });
}));

// GET /api/channels/search - Search for YouTube channels
router.get('/search/query', asyncHandler(async (req: Request, res: Response) => {
  const query = req.query.q as string;

  if (!query) {
    throw createError('Search query is required', 400, 'MISSING_QUERY');
  }

  const results = await channelService.searchChannels(query);

  res.json({
    success: true,
    data: results,
  });
}));

export default router;
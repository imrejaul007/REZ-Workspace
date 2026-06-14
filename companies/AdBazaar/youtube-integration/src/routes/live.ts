import { Router, Request, Response } from 'express';
import { liveStreamService } from '../services/LiveStreamService.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

const router = Router();

// POST /api/live/start - Start live stream
router.post('/start', asyncHandler(async (req: Request, res: Response) => {
  const { streamId } = req.body;

  if (!streamId) {
    throw createError('Stream ID is required', 400, 'MISSING_STREAM_ID');
  }

  const stream = await liveStreamService.startLiveStream(streamId);

  logger.info('Live stream started via API', { streamId: stream.id });

  res.json({
    success: true,
    data: stream,
  });
}));

// POST /api/live/end - End live stream
router.post('/end', asyncHandler(async (req: Request, res: Response) => {
  const { streamId } = req.body;

  if (!streamId) {
    throw createError('Stream ID is required', 400, 'MISSING_STREAM_ID');
  }

  const stream = await liveStreamService.endLiveStream(streamId);

  logger.info('Live stream ended via API', { streamId: stream.id });

  res.json({
    success: true,
    data: stream,
  });
}));

// GET /api/live/stats - Get live stream stats
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const streamId = req.query.streamId as string;

  if (!streamId) {
    throw createError('Stream ID is required', 400, 'MISSING_STREAM_ID');
  }

  const stats = await liveStreamService.getLiveStreamStats(streamId);

  res.json({
    success: true,
    data: stats,
  });
}));

// GET /api/live/current - Get current live stream
router.get('/current', asyncHandler(async (req: Request, res: Response) => {
  const youtubeChannelId = req.query.youtubeChannelId as string;

  if (!youtubeChannelId) {
    throw createError('YouTube channel ID is required', 400, 'MISSING_CHANNEL_ID');
  }

  const stream = await liveStreamService.getCurrentLiveStream(youtubeChannelId);

  res.json({
    success: true,
    data: stream,
  });
}));

// POST /api/live/create - Create a new live stream
router.post('/create', asyncHandler(async (req: Request, res: Response) => {
  const { youtubeChannelId, title, description, scheduledStartTime, privacyStatus } = req.body;

  if (!youtubeChannelId) {
    throw createError('YouTube channel ID is required', 400, 'MISSING_CHANNEL_ID');
  }

  if (!title) {
    throw createError('Stream title is required', 400, 'MISSING_TITLE');
  }

  const stream = await liveStreamService.createLiveStream({
    youtubeChannelId,
    title,
    description,
    scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : undefined,
    privacyStatus,
  });

  logger.info('Live stream created via API', { streamId: stream.id });

  res.status(201).json({
    success: true,
    data: stream,
  });
}));

// GET /api/live - List live streams
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const youtubeChannelId = req.query.youtubeChannelId as string;
  const status = req.query.status as 'created' | 'live' | 'completed';

  const result = await liveStreamService.getLiveStreams({
    page,
    limit,
    youtubeChannelId,
    status,
  });

  res.json({
    success: true,
    data: result.streams,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
}));

// GET /api/live/:id - Get live stream by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const stream = await liveStreamService.getLiveStreamById(req.params.id);

  if (!stream) {
    throw createError('Live stream not found', 404, 'STREAM_NOT_FOUND');
  }

  res.json({
    success: true,
    data: stream,
  });
}));

// DELETE /api/live/:id - Delete live stream
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await liveStreamService.deleteLiveStream(req.params.id);

  logger.info('Live stream deleted via API', { streamId: req.params.id });

  res.json({
    success: true,
    message: 'Live stream deleted successfully',
  });
}));

export default router;
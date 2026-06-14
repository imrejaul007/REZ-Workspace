import { Router, Request, Response } from 'express';
import { playlistService } from '../services/PlaylistService.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

const router = Router();

// POST /api/playlists - Create playlist
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { youtubeChannelId, title, description, privacyStatus } = req.body;

  if (!youtubeChannelId) {
    throw createError('YouTube channel ID is required', 400, 'MISSING_CHANNEL_ID');
  }

  if (!title) {
    throw createError('Playlist title is required', 400, 'MISSING_TITLE');
  }

  const playlist = await playlistService.createPlaylist({
    youtubeChannelId,
    title,
    description,
    privacyStatus,
  });

  logger.info('Playlist created via API', {
    playlistId: playlist.id,
    youtubePlaylistId: playlist.youtubePlaylistId,
  });

  res.status(201).json({
    success: true,
    data: playlist,
  });
}));

// GET /api/playlists - List playlists
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const youtubeChannelId = req.query.youtubeChannelId as string;

  const result = await playlistService.getPlaylists({
    page,
    limit,
    youtubeChannelId,
  });

  res.json({
    success: true,
    data: result.playlists,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
}));

// GET /api/playlists/:id - Get playlist by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const playlist = await playlistService.getPlaylistById(req.params.id);

  if (!playlist) {
    throw createError('Playlist not found', 404, 'PLAYLIST_NOT_FOUND');
  }

  res.json({
    success: true,
    data: playlist,
  });
}));

// POST /api/playlists/:id/videos - Add video to playlist
router.post('/:id/videos', asyncHandler(async (req: Request, res: Response) => {
  const { videoId } = req.body;

  if (!videoId) {
    throw createError('Video ID is required', 400, 'MISSING_VIDEO_ID');
  }

  const playlist = await playlistService.addVideoToPlaylist(req.params.id, videoId);

  logger.info('Video added to playlist via API', {
    playlistId: req.params.id,
    videoId,
  });

  res.json({
    success: true,
    data: playlist,
  });
}));

// DELETE /api/playlists/:id/videos/:videoId - Remove video from playlist
router.delete('/:id/videos/:videoId', asyncHandler(async (req: Request, res: Response) => {
  const playlist = await playlistService.removeVideoFromPlaylist(req.params.id, req.params.videoId);

  logger.info('Video removed from playlist via API', {
    playlistId: req.params.id,
    videoId: req.params.videoId,
  });

  res.json({
    success: true,
    data: playlist,
  });
}));

// DELETE /api/playlists/:id - Delete playlist
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await playlistService.deletePlaylist(req.params.id);

  logger.info('Playlist deleted via API', { playlistId: req.params.id });

  res.json({
    success: true,
    message: 'Playlist deleted successfully',
  });
}));

export default router;
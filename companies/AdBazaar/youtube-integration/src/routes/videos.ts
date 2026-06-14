import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { videoService } from '../services/VideoService.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

const router = Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024, // 10GB max for long videos
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-ms-wmv',
      'video/webm',
      'video/x-matroska',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  },
});

// POST /api/videos - Upload video
router.post('/', upload.single('video'), asyncHandler(async (req: Request, res: Response) => {
  const { youtubeChannelId, title, description, tags, categoryId, privacyStatus } = req.body;

  if (!youtubeChannelId) {
    throw createError('YouTube channel ID is required', 400, 'MISSING_CHANNEL_ID');
  }

  if (!title) {
    throw createError('Video title is required', 400, 'MISSING_TITLE');
  }

  if (!req.file) {
    throw createError('Video file is required', 400, 'MISSING_VIDEO_FILE');
  }

  const video = await videoService.uploadVideo({
    youtubeChannelId,
    filePath: req.file.path,
    title,
    description,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())) : undefined,
    categoryId,
    privacyStatus: privacyStatus as 'public' | 'unlisted' | 'private' || 'private',
  });

  logger.info('Video uploaded via API', {
    videoId: video.id,
    youtubeVideoId: video.youtubeVideoId,
  });

  res.status(201).json({
    success: true,
    data: video,
  });
}));

// GET /api/videos - List videos
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const youtubeChannelId = req.query.youtubeChannelId as string;
  const status = req.query.status as string;

  const result = await videoService.getVideos({
    page,
    limit,
    youtubeChannelId,
    status,
  });

  res.json({
    success: true,
    data: result.videos,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
}));

// GET /api/videos/:id - Get video by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const video = await videoService.getVideoById(req.params.id);

  if (!video) {
    throw createError('Video not found', 404, 'VIDEO_NOT_FOUND');
  }

  res.json({
    success: true,
    data: video,
  });
}));

// PATCH /api/videos/:id - Update video metadata
router.patch('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { title, description, tags, categoryId, privacyStatus } = req.body;

  const video = await videoService.updateVideo(req.params.id, {
    title,
    description,
    tags,
    categoryId,
    privacyStatus,
  });

  logger.info('Video updated via API', { videoId: req.params.id });

  res.json({
    success: true,
    data: video,
  });
}));

// DELETE /api/videos/:id - Delete video
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await videoService.deleteVideo(req.params.id);

  logger.info('Video deleted via API', { videoId: req.params.id });

  res.json({
    success: true,
    message: 'Video deleted successfully',
  });
}));

// GET /api/videos/:id/analytics - Get video analytics
router.get('/:id/analytics', asyncHandler(async (req: Request, res: Response) => {
  const analytics = await videoService.getVideoAnalytics(req.params.id);

  res.json({
    success: true,
    data: analytics,
  });
}));

// POST /api/videos/:id/thumbnail - Set video thumbnail
router.post('/:id/thumbnail', upload.single('thumbnail'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw createError('Thumbnail image is required', 400, 'MISSING_THUMBNAIL');
  }

  const video = await videoService.setThumbnail(req.params.id, req.file.path);

  logger.info('Thumbnail set via API', { videoId: req.params.id });

  res.json({
    success: true,
    data: video,
  });
}));

// POST /api/videos/:id/captions - Add caption to video
router.post('/:id/captions', upload.single('caption'), asyncHandler(async (req: Request, res: Response) => {
  const { language } = req.body;

  if (!language) {
    throw createError('Caption language is required', 400, 'MISSING_LANGUAGE');
  }

  if (!req.file) {
    throw createError('Caption file is required', 400, 'MISSING_CAPTION_FILE');
  }

  const video = await videoService.addCaption(req.params.id, {
    language,
    filePath: req.file.path,
  });

  logger.info('Caption added via API', { videoId: req.params.id, language });

  res.json({
    success: true,
    data: video,
  });
}));

export default router;
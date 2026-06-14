import { Router, Request, Response } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { getMemoryService } from '../services/memory.service';
import { RideMemory } from '../models/memory';
import { logger } from '../utils/logger';

const router = Router();

// Get all memories (with filters)
router.get('/',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '20', location, tag, featured } = req.query;

    let memories;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    if (featured === 'true') {
      memories = await RideMemory.findFeatured();
    } else if (location) {
      memories = await RideMemory.findByLocation(location as string);
    } else if (tag) {
      memories = await RideMemory.findByTag(tag as string);
    } else {
      memories = await RideMemory.findPublic(parseInt(limit as string), skip);
    }

    res.json({
      success: true,
      data: memories,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      },
    });
  })
);

// Get my memories
router.get('/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [memories, total] = await Promise.all([
      RideMemory.find({ riderId: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string)),
      RideMemory.countDocuments({ riderId: userId }),
    ]);

    res.json({
      success: true,
      data: memories,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  })
);

// Get memory by ID
router.get('/:id',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const memory = await RideMemory.findById(req.params.id)
      .populate('riderId', 'displayName avatar trustScore')
      .populate('likes', 'displayName avatar');

    if (!memory) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    res.json({
      success: true,
      data: memory,
    });
  })
);

// Generate memory from ride
router.post('/generate/:rideId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const memoryService = getMemoryService();

    try {
      const memory = await memoryService.generateMemory(req.params.rideId);

      res.status(201).json({
        success: true,
        data: memory,
      });
    } catch (error: any) {
      logger.error('Memory generation failed:', error);
      res.status(500).json({
        error: 'Failed to generate memory',
        message: error.message,
      });
    }
  })
);

// Regenerate memory with AI
router.post('/:id/regenerate',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const memoryService = getMemoryService();
    const memory = await RideMemory.findById(req.params.id);

    if (!memory) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    try {
      const updatedMemory = await memoryService.regenerateWithAI(memory.rideId.toString());

      res.json({
        success: true,
        data: updatedMemory,
      });
    } catch (error: any) {
      logger.error('Memory regeneration failed:', error);
      res.status(500).json({
        error: 'Failed to regenerate memory',
        message: error.message,
      });
    }
  })
);

// Like/unlike memory
router.post('/:id/like',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const memoryService = getMemoryService();
    const userId = req.userId!;

    try {
      const result = await memoryService.toggleLike(req.params.id, userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Like toggle failed:', error);
      res.status(404).json({ error: error.message });
    }
  })
);

// Share memory
router.post('/:id/share',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const memoryService = getMemoryService();

    try {
      const shareLink = await memoryService.shareMemory(req.params.id);

      res.json({
        success: true,
        data: {
          shareLink,
          url: `${req.protocol}://${req.get('host')}/memory/${shareLink}`,
        },
      });
    } catch (error: any) {
      logger.error('Share failed:', error);
      res.status(404).json({ error: error.message });
    }
  })
);

// Update memory (privacy, etc.)
router.put('/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { isPublic, coverImage, photos, tags } = req.body;

    const memory = await RideMemory.findById(req.params.id);

    if (!memory) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    if (memory.riderId.toString() !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    if (typeof isPublic === 'boolean') memory.isPublic = isPublic;
    if (coverImage) memory.coverImage = coverImage;
    if (photos) memory.photos = photos;
    if (tags) memory.tags = tags;

    await memory.save();

    res.json({
      success: true,
      data: memory,
    });
  })
);

// Delete memory
router.delete('/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const memory = await RideMemory.findById(req.params.id);

    if (!memory) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    if (memory.riderId.toString() !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await memory.deleteOne();

    res.json({
      success: true,
      message: 'Memory deleted',
    });
  })
);

// Search memories
router.get('/search/query',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { q, limit = '20' } = req.query;

    if (!q) {
      res.status(400).json({ error: 'Query required' });
      return;
    }

    const memories = await RideMemory.find({
      isPublic: true,
      $text: { $search: q as string },
    })
      .populate('riderId', 'displayName avatar')
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit as string));

    res.json({
      success: true,
      data: memories,
    });
  })
);

// Get memories by location
router.get('/location/:location',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const memories = await RideMemory.findByLocation(req.params.location);

    res.json({
      success: true,
      data: memories,
    });
  })
);

// Get memories by tag
router.get('/tag/:tag',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const memories = await RideMemory.findByTag(req.params.tag);

    res.json({
      success: true,
      data: memories,
    });
  })
);

// Add photos to memory
router.post('/:id/photos',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { photos, coverImage } = req.body;

    if (!photos || !Array.isArray(photos)) {
      res.status(400).json({ error: 'Photos array required' });
      return;
    }

    const memory = await RideMemory.findById(req.params.id);

    if (!memory) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    if (memory.riderId.toString() !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    memory.photos.push(...photos);

    // If this is the first photo, set as cover
    if (!memory.coverImage && photos.length > 0) {
      memory.coverImage = coverImage || photos[0];
    }

    await memory.save();

    res.json({
      success: true,
      data: memory,
    });
  })
);

export default router;

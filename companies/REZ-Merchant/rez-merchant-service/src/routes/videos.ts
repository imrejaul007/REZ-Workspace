
import { Router, Request, Response } from 'express';
import { Video } from '../models/Video';
import { Store } from '../models/Store';
import { Product } from '../models/Product';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

// POST /videos — create promotional video
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, storeId, videoUrl, thumbnailUrl, products, tags, category, duration, publicId } = req.body;

    const store = await Store.findOne({ _id: storeId, merchantId: req.merchantId });
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }

    if (storeId && !mongoose.Types.ObjectId.isValid(storeId as string)) {
      res.status(400).json({ success: false, message: 'Invalid storeId' }); return;
    }
    const validProductIds = (products || []).filter((id: string) => mongoose.Types.ObjectId.isValid(id)).map((id: string) => new mongoose.Types.ObjectId(id));
    const validProducts = await Product.find({ _id: { $in: validProductIds }, store: new mongoose.Types.ObjectId(storeId as string) }).select('_id').lean();

    const video = new Video({
      title: title?.trim(), description: description?.trim() || '',
      creator: new mongoose.Types.ObjectId(req.merchantId), contentType: 'merchant',
      videoUrl, thumbnail: thumbnailUrl, category: category || 'featured',
      tags: tags || [], products: validProducts.map((p) => p._id),
      stores: [new mongoose.Types.ObjectId(storeId as string)],
      engagement: { views: 0, likes: [], shares: 0, comments: 0, saves: 0 },
      metadata: { duration, format: 'mp4', aspectRatio: '9:16' },
      processing: { status: 'completed', originalUrl: videoUrl, processedUrl: videoUrl, thumbnailUrl },
      analytics: { totalViews: 0, uniqueViews: 0, likes: 0, comments: 0, shares: 0 },
      isPublished: true, isApproved: true, moderationStatus: 'approved', privacy: 'public',
      publishedAt: new Date(),
      ...(publicId && { cloudinaryPublicId: publicId }),
    });
    await video.save();

    res.status(201).json({ success: true, message: 'Video created', data: { video } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /videos/store/:storeId — videos for a store
router.get('/store/:storeId', async (req: Request, res: Response) => {
  try {
    // HIGH FIX: Validate ObjectId before querying
    if (!mongoose.Types.ObjectId.isValid(req.params.storeId as string)) {
      res.status(400).json({ success: false, message: 'Invalid storeId' });
      return;
    }

    const storeId = new mongoose.Types.ObjectId(req.params.storeId as string);
    const store = await Store.findOne({ _id: storeId, merchantId: req.merchantId });
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    let sort: unknown = { createdAt: -1 };
    if (req.query.sortBy === 'popular') sort = { 'analytics.totalViews': -1 };

    const [videos, total] = await Promise.all([
      Video.find({ stores: storeId, contentType: 'merchant' }).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      Video.countDocuments({ stores: storeId, contentType: 'merchant' }),
    ]);

    res.json({ success: true, data: { videos, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /videos/analytics/:storeId
router.get('/analytics/:storeId', async (req: Request, res: Response) => {
  try {
    // HIGH FIX: Validate ObjectId before querying
    if (!mongoose.Types.ObjectId.isValid(req.params.storeId as string)) {
      res.status(400).json({ success: false, message: 'Invalid storeId' });
      return;
    }

    const storeId = new mongoose.Types.ObjectId(req.params.storeId as string);
    const store = await Store.findOne({ _id: storeId, merchantId: req.merchantId });
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }

    const analytics = await Video.aggregate([
      { $match: { stores: storeId, contentType: 'merchant' } },
      { $group: { _id: null, totalVideos: { $sum: 1 }, totalViews: { $sum: { $ifNull: ['$analytics.totalViews', 0] } }, totalLikes: { $sum: { $size: { $ifNull: ['$engagement.likes', []] } } }, totalShares: { $sum: { $ifNull: ['$engagement.shares', 0] } } } },
    ]);

    res.json({ success: true, data: analytics[0] || { totalVideos: 0, totalViews: 0, totalLikes: 0, totalShares: 0 } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PUT /videos/:videoId
router.put('/:videoId', async (req: Request, res: Response) => {
  try {
    // HIGH FIX: Validate ObjectId before querying
    if (!mongoose.Types.ObjectId.isValid(req.params.videoId as string)) {
      res.status(400).json({ success: false, message: 'Invalid videoId' });
      return;
    }

    const VIDEO_ALLOWED = ['title', 'description', 'thumbnailUrl', 'tags', 'category', 'isPublished', 'privacy'];
    const update: Record<string, unknown> = {};
    for (const f of VIDEO_ALLOWED) { if ((req.body as unknown)[f] !== undefined) update[f] = (req.body as unknown)[f]; }
    const video = await Video.findOneAndUpdate(
      { _id: req.params.videoId, creator: req.merchantId },
      { $set: update },
      { new: true },
    );
    if (!video) { res.status(404).json({ success: false, message: 'Video not found' }); return; }
    res.json({ success: true, message: 'Video updated', data: { video } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// DELETE /videos/:videoId
router.delete('/:videoId', async (req: Request, res: Response) => {
  try {
    // HIGH FIX: Validate ObjectId before querying
    if (!mongoose.Types.ObjectId.isValid(req.params.videoId as string)) {
      res.status(400).json({ success: false, message: 'Invalid videoId' });
      return;
    }

    const video = await Video.findOneAndDelete({ _id: req.params.videoId, creator: req.merchantId });
    if (!video) { res.status(404).json({ success: false, message: 'Video not found' }); return; }
    res.json({ success: true, message: 'Video deleted' });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /videos/:videoId
router.get('/:videoId', async (req: Request, res: Response) => {
  try {
    // HIGH FIX: Validate ObjectId before querying
    if (!mongoose.Types.ObjectId.isValid(req.params.videoId as string)) {
      res.status(400).json({ success: false, message: 'Invalid videoId' });
      return;
    }

    const video = await Video.findOne({ _id: req.params.videoId, creator: req.merchantId }).lean();
    if (!video) { res.status(404).json({ success: false, message: 'Video not found' }); return; }
    res.json({ success: true, data: { video } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;

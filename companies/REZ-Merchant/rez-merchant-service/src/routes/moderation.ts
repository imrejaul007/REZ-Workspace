
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { merchantAuth } from '../middleware/auth';
import { cacheGet, cacheSet } from '../config/redis';

const router = Router();
router.use(merchantAuth);

// Lightweight schema references — these collections are created by the monolith
const ReviewSchema = new mongoose.Schema({}, { strict: false, collection: 'reviews' });
const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

const PhotoSchema = new mongoose.Schema({}, { strict: false, collection: 'photos' });
const Photo = mongoose.models.Photo || mongoose.model('Photo', PhotoSchema);

/**
 * GET /moderation/status — moderation summary for this merchant's content
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const merchantOid = new mongoose.Types.ObjectId(merchantId);
    const cacheKey = `merchant:${merchantId}:moderation-status`;

    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) { res.json(cached); return; }

    const [reviewStats, photoStats] = await Promise.all([
      Review.aggregate([
        { $match: { merchant: merchantOid } },  // MS-19: was incorrectly matching ALL docs with a store field
        {
          $group: {
            _id: '$moderationStatus',
            count: { $sum: 1 },
          },
        },
      ]).catch(() => []),
      Photo.aggregate([
        { $match: { merchant: merchantOid } },
        {
          $group: {
            _id: '$moderationStatus',
            count: { $sum: 1 },
          },
        },
      ]).catch(() => []),
    ]);

    const mapStats = (arr: unknown[]) => {
      const m: Record<string, number> = {};
      arr.forEach((r) => { m[r._id || 'unknown'] = r.count; });
      return m;
    };

    const result = {
      success: true,
      data: {
        reviews: {
          ...mapStats(reviewStats),
          total: reviewStats.reduce((s: number, r) => s + r.count, 0),
        },
        photos: {
          ...mapStats(photoStats),
          total: photoStats.reduce((s: number, r) => s + r.count, 0),
        },
      },
    };

    await cacheSet(cacheKey, result, 300);
    res.json(result);
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

/**
 * GET /moderation/reviews — reviews for this merchant's stores with moderation status
 */
router.get('/reviews', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId!;
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: unknown = { merchant: new mongoose.Types.ObjectId(merchantId) };
    if (status) query.moderationStatus = status;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Review.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        items: reviews,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
          hasNext: skip + Number(limit) < total,
          hasPrev: Number(page) > 1,
        },
      },
    });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;

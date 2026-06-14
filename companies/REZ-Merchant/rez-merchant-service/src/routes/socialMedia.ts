
import { Router, Request, Response } from 'express';
import { SocialMediaPost } from '../models/SocialMediaPost';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const query: unknown = { storeId: { $in: storeIds } };
    if (req.query.status) query.status = req.query.status;
    const [posts, total] = await Promise.all([
      SocialMediaPost.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      SocialMediaPost.countDocuments(query),
    ]);
    res.json({ success: true, data: { posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({ merchantId: req.merchantId }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);
    const stats = await SocialMediaPost.aggregate([
      { $match: { storeId: { $in: storeIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    res.json({ success: true, data: stats });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

router.get('/:postId', async (req: Request, res: Response) => {
  try {
    const post = await SocialMediaPost.findOne({ _id: req.params.postId, merchantId: req.merchantId }).lean();
    if (!post) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: post });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

router.put('/:postId/approve', async (req: Request, res: Response) => {
  try {
    const post = await SocialMediaPost.findByIdAndUpdate(req.params.postId, { $set: { status: 'approved', approvedAt: new Date(), approvedBy: req.merchantId } }, { new: true });
    if (!post) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: post });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

router.put('/:postId/reject', async (req: Request, res: Response) => {
  try {
    const post = await SocialMediaPost.findByIdAndUpdate(req.params.postId, { $set: { status: 'rejected', rejectedAt: new Date(), rejectionReason: req.body.reason } }, { new: true });
    if (!post) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: post });
  } catch (err: unknown) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;

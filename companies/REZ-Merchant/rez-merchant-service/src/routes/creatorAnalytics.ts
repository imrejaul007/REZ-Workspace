import { Router, Request, Response } from 'express';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

// GET /stores/:storeId/creator-stats
router.get('/stores/:storeId/creator-stats', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    if (!storeIds.map(String).includes(storeId)) {
      res.status(404).json({ success: false, message: 'Store not found' }); return;
    }
    res.json({
      success: true,
      data: {
        totalPicks: 0,
        uniqueCreators: 0,
        totalViews: 0,
        totalClicks: 0,
        totalPurchases: 0,
        totalRevenue: 0,
        pendingPicks: 0,
        approvedPicks: 0,
        rejectedPicks: 0,
      },
    });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// GET /stores/:storeId/creator-picks
router.get('/stores/:storeId/creator-picks', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    if (!storeIds.map(String).includes(storeId)) {
      res.status(404).json({ success: false, message: 'Store not found' }); return;
    }
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    res.json({ success: true, data: { picks: [], pagination: { page, limit, total: 0, totalPages: 0 } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// GET /stores/:storeId/pending-picks
router.get('/stores/:storeId/pending-picks', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    if (!storeIds.map(String).includes(storeId)) {
      res.status(404).json({ success: false, message: 'Store not found' }); return;
    }
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    res.json({ success: true, data: { picks: [], pagination: { page, limit, total: 0, totalPages: 0 } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// GET /stores/:storeId/pick-history
router.get('/stores/:storeId/pick-history', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    if (!storeIds.map(String).includes(storeId)) {
      res.status(404).json({ success: false, message: 'Store not found' }); return;
    }
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    res.json({ success: true, data: { picks: [], pagination: { page, limit, total: 0, totalPages: 0 } } });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// POST /stores/:storeId/picks/:pickId/approve
router.post('/stores/:storeId/picks/:pickId/approve', async (req: Request, res: Response) => {
  try {
    const { storeId, pickId } = req.params;
    const { rewardType, rewardAmount } = req.body;
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    if (!storeIds.map(String).includes(storeId)) {
      res.status(404).json({ success: false, message: 'Store not found' }); return;
    }
    res.json({
      success: true,
      data: {
        id: pickId,
        merchantApprovalStatus: 'approved',
        reward: rewardType && rewardAmount ? { type: rewardType, amount: Number(rewardAmount) } : null,
        reviewedAt: new Date().toISOString(),
      },
    });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// POST /stores/:storeId/picks/:pickId/reject
router.post('/stores/:storeId/picks/:pickId/reject', async (req: Request, res: Response) => {
  try {
    const { storeId, pickId } = req.params;
    const { reason } = req.body;
    const storeIds = await getMerchantStoreIds(req.merchantId!);
    if (!storeIds.map(String).includes(storeId)) {
      res.status(404).json({ success: false, message: 'Store not found' }); return;
    }
    res.json({
      success: true,
      data: {
        id: pickId,
        merchantApprovalStatus: 'rejected',
        rejectionReason: reason || '',
        reviewedAt: new Date().toISOString(),
      },
    });
  } catch (e) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

async function getMerchantStoreIds(merchantId: string): Promise<string[]> {
  const stores = await Store.find({ merchantId }).select('_id').lean();
  return stores.map((s) => String(s._id));
}

export default router;

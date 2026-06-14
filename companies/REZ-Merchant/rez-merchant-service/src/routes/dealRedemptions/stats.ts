import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { DealRedemption } from '../../models/DealRedemption';
import { Store } from '../../models/Store';
import { merchantAuth } from '../../middleware/auth';

const router = Router();
router.use(merchantAuth);

async function getMerchantStores(merchantId: string) {
  return Store.find({
    $or: [{ merchant: merchantId }, { merchantId: merchantId }],
  })
    .select('_id name')
    .lean();
}

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    if (!merchantId) {
      return res.status(400).json({ success: false, message: 'MerchantId missing' });
    }

    const merchantStores = await getMerchantStores(merchantId);
    const requestedStoreId = typeof req.query.storeId === 'string' ? req.query.storeId.trim() : '';
    let storeIds = merchantStores.map((store) => store._id);

    if (requestedStoreId) {
      const ownsStore = merchantStores.some((store) => store._id.toString() === requestedStoreId);
      if (!ownsStore) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission for this store',
        });
      }

      storeIds = [new mongoose.Types.ObjectId(requestedStoreId)];
    }

    if (storeIds.length === 0) {
      return res.json({
        success: true,
        data: {
          today: { total: 0, used: 0, pending: 0 },
          thisWeek: { total: 0, used: 0, pending: 0 },
          thisMonth: { total: 0, used: 0, pending: 0 },
          totalRevenue: 0,
          topDeals: [],
        },
      });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const merchantScopeMatch = {
      $or: [
        { 'dealSnapshot.storeId': { $in: storeIds } },
        { usedAtStoreId: { $in: storeIds } },
      ],
    };

    const [result] = await DealRedemption.aggregate([
      { $match: merchantScopeMatch },
      {
        $facet: {
          today: [
            { $match: { createdAt: { $gte: todayStart } } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          thisWeek: [
            { $match: { createdAt: { $gte: weekStart } } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          thisMonth: [
            { $match: { createdAt: { $gte: monthStart } } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          revenue: [
            { $match: { isPaid: true, status: { $in: ['active', 'used'] } } },
            { $group: { _id: null, total: { $sum: '$purchaseAmount' } } },
          ],
          topDeals: [
            { $match: { status: { $in: ['active', 'used'] } } },
            { $group: { _id: '$campaignSnapshot.title', redemptions: { $sum: 1 } } },
            { $match: { _id: { $ne: null, $type: 'string' } } },
            { $sort: { redemptions: -1 } },
            { $limit: 5 },
          ],
        },
      },
    ]);

    const formatPeriodStats = (data: Array<{ _id: string; count: number }> = []) => {
      const map: Record<string, number> = { total: 0, used: 0, pending: 0, active: 0 };
      for (const item of data) {
        map[item._id] = item.count;
        map.total += item.count;
      }
      return {
        total: map.total,
        used: map.used || 0,
        pending: map.pending || 0,
      };
    };

    return res.json({
      success: true,
      data: {
        today: formatPeriodStats(result?.today),
        thisWeek: formatPeriodStats(result?.thisWeek),
        thisMonth: formatPeriodStats(result?.thisMonth),
        totalRevenue: result?.revenue?.[0]?.total || 0,
        topDeals: (result?.topDeals || []).map((deal) => ({
          campaign: deal._id,
          redemptions: deal.redemptions,
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message,
    });
  }
});

export default router;

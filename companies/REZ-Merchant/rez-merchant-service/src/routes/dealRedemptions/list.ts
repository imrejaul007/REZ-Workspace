
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { DealRedemption } from '../../models/DealRedemption';
import { Store } from '../../models/Store';
import { merchantAuth } from '../../middleware/auth';

const router = Router();
router.use(merchantAuth);

type ListQueryPayload = {
  storeId?: string;
  status?: 'active' | 'used' | 'expired' | 'pending' | 'cancelled';
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
};

function parsePositiveInteger(value: unknown, fieldName: string, defaultValue: number, max?: number): number {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${fieldName} must be a positive integer`);
  }

  if (max && parsed > max) {
    throw new Error(`${fieldName} must be less than or equal to ${max}`);
  }

  return parsed;
}

function parseOptionalIsoDate(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new Error(`${fieldName} must be a valid ISO date`);
  }

  return value;
}

async function getMerchantStores(merchantId: string) {
  return Store.find({
    $or: [{ merchant: merchantId }, { merchantId: merchantId }],
  })
    .select('_id name')
    .lean();
}

function buildCustomerName(user): string {
  const first = user?.profile?.firstName || user?.firstName || '';
  const last = user?.profile?.lastName || user?.lastName || '';
  const combined = `${first} ${last}`.trim();
  return combined || user?.name || 'Customer';
}

function validateListQuery(query): ListQueryPayload {
  const allowedStatuses = new Set(['active', 'used', 'expired', 'pending', 'cancelled']);
  const status = typeof query?.status === 'string' ? query.status.trim() : undefined;

  if (status && !allowedStatuses.has(status)) {
    throw new Error('status must be one of active, used, expired, pending, or cancelled');
  }

  const storeId = typeof query?.storeId === 'string' ? query.storeId.trim() : undefined;

  return {
    storeId: storeId || undefined,
    status: status as ListQueryPayload['status'],
    startDate: parseOptionalIsoDate(query?.startDate, 'startDate'),
    endDate: parseOptionalIsoDate(query?.endDate, 'endDate'),
    page: parsePositiveInteger(query?.page, 'page', 1),
    limit: parsePositiveInteger(query?.limit, 'limit', 20, 100),
  };
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchantId;
    if (!merchantId) {
      return res.status(400).json({ success: false, message: 'MerchantId missing' });
    }

    const { storeId, status, startDate, endDate, page, limit } = validateListQuery(req.query);
    const merchantStores = await getMerchantStores(merchantId);

    let storeIds: mongoose.Types.ObjectId[] = merchantStores.map((store) => store._id);

    if (storeId) {
      const ownsStore = merchantStores.some((store) => store._id.toString() === storeId);
      if (!ownsStore) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission for this store',
        });
      }
      storeIds = [new mongoose.Types.ObjectId(storeId)];
    }

    if (storeIds.length === 0) {
      return res.json({
        success: true,
        data: {
          redemptions: [],
          stats: { total: 0, active: 0, used: 0, expired: 0, pending: 0, cancelled: 0 },
          pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        },
      });
    }

    const merchantScope: unknown[] = [
      { 'dealSnapshot.storeId': { $in: storeIds } },
      { usedAtStoreId: { $in: storeIds } },
    ];

    const query: unknown = { $or: merchantScope };
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await DealRedemption.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const [redemptions, stats] = await Promise.all([
      DealRedemption.find(query)
        .populate('user', 'profile.firstName profile.lastName firstName lastName name phoneNumber')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      DealRedemption.aggregate([
        { $match: { $or: merchantScope } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const statsMap: Record<string, number> = {
      total: 0,
      active: 0,
      used: 0,
      expired: 0,
      pending: 0,
      cancelled: 0,
    };

    for (const stat of stats) {
      statsMap[stat._id] = stat.count;
      statsMap.total += stat.count;
    }

    return res.json({
      success: true,
      data: {
        redemptions: redemptions.map((redemption) => ({
          id: redemption._id,
          code: redemption.redemptionCode,
          status: redemption.status,
          redeemedAt: redemption.redeemedAt,
          createdAt: redemption.createdAt,
          usedAt: redemption.usedAt,
          expiresAt: redemption.expiresAt,
          dealSnapshot: redemption.dealSnapshot,
          campaignSnapshot: {
            title: redemption.campaignSnapshot?.title,
            type: redemption.campaignSnapshot?.type,
            terms: redemption.campaignSnapshot?.terms,
            minOrderValue: redemption.campaignSnapshot?.minOrderValue,
            maxBenefit: redemption.campaignSnapshot?.maxBenefit,
          },
          isPaid: redemption.isPaid,
          benefitApplied: redemption.benefitApplied,
          orderAmount: redemption.orderAmount,
          user: {
            name: buildCustomerName(redemption.user),
          },
        })),
        stats: statsMap,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch redemptions',
      error: error.message,
    });
  }
});

export default router;

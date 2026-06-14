import { v4 as uuidv4 } from 'uuid';
import { Deal, IDeal, IDealDocument } from '../models/Deal';
import { logger } from '../utils/logger';

interface ListDealsParams {
  buyer?: string;
  seller?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

interface ListDealsResult {
  deals: IDealDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const dealService = {
  async createDeal(data: Partial<IDeal>): Promise<IDealDocument> {
    const dealId = data.dealId || `deal_${uuidv4()}`;

    const deal = new Deal({
      ...data,
      dealId,
      status: data.status || 'draft',
      impressions: data.impressions || 0,
      budget: data.budget || { amount: 0, spent: 0 },
    });

    await deal.save();
    logger.info('Deal created', { dealId, buyer: deal.buyer, seller: deal.seller });
    return deal;
  },

  async getDeal(dealId: string): Promise<IDealDocument | null> {
    return Deal.findOne({ dealId });
  },

  async getDealById(id: string): Promise<IDealDocument | null> {
    return Deal.findById(id);
  },

  async listDeals(params: ListDealsParams): Promise<ListDealsResult> {
    const { buyer, seller, status, type, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (buyer) filter.buyer = buyer;
    if (seller) filter.seller = seller;
    if (status) filter.status = status;
    if (type) filter.type = type;

    const [deals, total] = await Promise.all([
      Deal.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Deal.countDocuments(filter),
    ]);

    return {
      deals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async updateDeal(dealId: string, data: Partial<IDeal>): Promise<IDealDocument | null> {
    const deal = await Deal.findOneAndUpdate(
      { dealId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (deal) {
      logger.info('Deal updated', { dealId, updates: Object.keys(data) });
    }
    return deal;
  },

  async deleteDeal(dealId: string): Promise<boolean> {
    const result = await Deal.deleteOne({ dealId });
    if (result.deletedCount > 0) {
      logger.info('Deal deleted', { dealId });
      return true;
    }
    return false;
  },

  async activateDeal(dealId: string): Promise<IDealDocument | null> {
    const deal = await Deal.findOne({ dealId });
    if (!deal) return null;

    if (deal.status !== 'draft' && deal.status !== 'paused' && deal.status !== 'pending') {
      throw new Error(`Cannot activate deal with status: ${deal.status}`);
    }

    deal.status = 'active';
    if (!deal.startDate) {
      deal.startDate = new Date();
    }
    await deal.save();
    logger.info('Deal activated', { dealId });
    return deal;
  },

  async pauseDeal(dealId: string): Promise<IDealDocument | null> {
    const deal = await Deal.findOne({ dealId });
    if (!deal) return null;

    if (deal.status !== 'active') {
      throw new Error(`Cannot pause deal with status: ${deal.status}`);
    }

    deal.status = 'paused';
    await deal.save();
    logger.info('Deal paused', { dealId });
    return deal;
  },

  async completeDeal(dealId: string): Promise<IDealDocument | null> {
    const deal = await Deal.findOne({ dealId });
    if (!deal) return null;

    deal.status = 'completed';
    if (!deal.endDate) {
      deal.endDate = new Date();
    }
    await deal.save();
    logger.info('Deal completed', { dealId });
    return deal;
  },

  async cancelDeal(dealId: string, reason?: string): Promise<IDealDocument | null> {
    const deal = await Deal.findOne({ dealId });
    if (!deal) return null;

    deal.status = 'cancelled';
    if (deal.metadata && typeof deal.metadata === 'object') {
      (deal.metadata as any).cancellationReason = reason;
    }
    await deal.save();
    logger.info('Deal cancelled', { dealId, reason });
    return deal;
  },

  async updateDealImpressions(dealId: string, impressions: number): Promise<IDealDocument | null> {
    return Deal.findOneAndUpdate(
      { dealId },
      { $inc: { impressions } },
      { new: true }
    );
  },

  async updateDealSpend(dealId: string, amount: number): Promise<IDealDocument | null> {
    const deal = await Deal.findOne({ dealId });
    if (!deal) return null;

    if (!deal.budget) {
      deal.budget = { amount: 0, spent: 0 };
    }
    deal.budget.spent += amount;
    await deal.save();
    return deal;
  },

  async getDealsByBuyer(buyer: string, status?: string): Promise<IDealDocument[]> {
    const filter: Record<string, any> = { buyer };
    if (status) filter.status = status;
    return Deal.find(filter).sort({ createdAt: -1 });
  },

  async getDealsBySeller(seller: string, status?: string): Promise<IDealDocument[]> {
    const filter: Record<string, any> = { seller };
    if (status) filter.status = status;
    return Deal.find(filter).sort({ createdAt: -1 });
  },

  async getActiveDeals(): Promise<IDealDocument[]> {
    return Deal.find({ status: 'active' }).sort({ createdAt: -1 });
  },

  async getDealsByDateRange(startDate: Date, endDate: Date): Promise<IDealDocument[]> {
    return Deal.find({
      $or: [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } },
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
      ],
    }).sort({ createdAt: -1 });
  },

  async getDealStats(): Promise<{
    total: number;
    active: number;
    paused: number;
    completed: number;
    draft: number;
    pending: number;
    totalBudget: number;
    totalSpend: number;
  }> {
    const stats = await Deal.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBudget: { $sum: '$budget.amount' },
          totalSpend: { $sum: '$budget.spent' },
        },
      },
    ]);

    const result = {
      total: 0,
      active: 0,
      paused: 0,
      completed: 0,
      draft: 0,
      pending: 0,
      totalBudget: 0,
      totalSpend: 0,
    };

    stats.forEach((stat) => {
      result[stat._id as keyof typeof result] = stat.count;
      result.totalBudget += stat.totalBudget;
      result.totalSpend += stat.totalSpend;
      result.total += stat.count;
    });

    return result;
  },
};
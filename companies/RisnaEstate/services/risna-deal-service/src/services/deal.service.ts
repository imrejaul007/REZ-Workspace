import { Deal, IDeal, DealStage, DealStatus, STAGE_PROBABILITY_MAP, DEFAULT_HANDOVER_CHECKLIST, DealType, PropertyType, DealSource, OfferStatus, OfferedBy, PaymentMilestoneStatus } from '../models/deal.model';
import { DocumentNotFoundError, InvalidOperationError, StageTransitionError } from '../utils/errors';
import { generateDealId, calculateDiscountPercent, calculateDiscountAmount, isValidStageTransition } from '../utils/deal.utils';
import { redis } from '../config/redis';
import { logger } from '../config/logger';
import mongoose, { FilterQuery, Types } from 'mongoose';

export interface CreateDealData {
  leadId: string;
  propertyId: string;
  brokerId: string;
  buyerId: string;
  sellerId: string;
  dealType: DealType;
  propertyType: PropertyType;
  askingPrice: number;
  source?: DealSource;
  utmCampaign?: string;
  utmMedium?: string;
  createdBy: string;
  companyId?: string;
}

export interface UpdateDealData {
  negotiatedPrice?: number;
  finalPrice?: number;
  discount?: number;
  discountPercent?: number;
  handoverDate?: Date;
  keysHandedOver?: boolean;
  documentsHandedOver?: boolean;
  status?: DealStatus;
  lostReason?: string;
  wonNotes?: string;
}

export interface DealFilters {
  brokerId?: string;
  propertyId?: string;
  leadId?: string;
  stage?: DealStage;
  status?: DealStatus;
  dealType?: DealType;
  propertyType?: PropertyType;
  source?: DealSource;
  minPrice?: number;
  maxPrice?: number;
  probability?: number;
  search?: string;
  companyId?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

class DealService {
  // ==============================================
  // CREATE DEAL
  // ==============================================

  async createDeal(data: CreateDealData): Promise<IDeal> {
    const dealId = generateDealId();

    const deal = new Deal({
      dealId,
      leadId: new Types.ObjectId(data.leadId),
      propertyId: new Types.ObjectId(data.propertyId),
      brokerId: new Types.ObjectId(data.brokerId),
      buyerId: data.buyerId,
      sellerId: data.sellerId,
      dealType: data.dealType,
      propertyType: data.propertyType,
      askingPrice: data.askingPrice,
      source: data.source || DealSource.DIRECT,
      utmCampaign: data.utmCampaign,
      utmMedium: data.utmMedium,
      createdBy: data.createdBy,
      companyId: data.companyId,
      stage: DealStage.INQUIRY,
      status: DealStatus.ACTIVE,
      probability: STAGE_PROBABILITY_MAP[DealStage.INQUIRY],
      stageHistory: [{
        stage: DealStage.INQUIRY,
        changedAt: new Date(),
        changedBy: data.createdBy,
        notes: 'Deal created',
      }],
      handoverChecklist: DEFAULT_HANDOVER_CHECKLIST.map(item => ({
        item,
        completed: false,
      })),
      paymentMilestones: [],
      offers: [],
    });

    await deal.save();

    // Cache the deal for quick lookups
    await this.cacheDeal(deal);

    logger.info('Deal created', { dealId, brokerId: data.brokerId });

    return deal;
  }

  // ==============================================
  // GET DEAL BY ID
  // ==============================================

  async getDealById(dealId: string): Promise<IDeal> {
    // Try cache first
    const cached = await redis.get(`deal:${dealId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const deal = await Deal.findOne({ dealId, deletedAt: null });
    if (!deal) {
      throw new DocumentNotFoundError('Deal', dealId);
    }

    // Cache for future lookups
    await this.cacheDeal(deal);

    return deal;
  }

  async getDealByMongoId(id: string): Promise<IDeal> {
    const deal = await Deal.findOne({ _id: id, deletedAt: null });
    if (!deal) {
      throw new DocumentNotFoundError('Deal', id);
    }
    return deal;
  }

  // ==============================================
  // UPDATE DEAL
  // ==============================================

  async updateDeal(dealId: string, data: UpdateDealData, updatedBy: string): Promise<IDeal> {
    const deal = await this.getDealById(dealId);

    // Update fields
    if (data.negotiatedPrice !== undefined) {
      deal.negotiatedPrice = data.negotiatedPrice;
      deal.discount = calculateDiscountAmount(deal.askingPrice, data.negotiatedPrice);
      deal.discountPercent = calculateDiscountPercent(deal.askingPrice, data.negotiatedPrice);
    }

    if (data.finalPrice !== undefined) {
      deal.finalPrice = data.finalPrice;
    }

    if (data.handoverDate !== undefined) {
      deal.handoverDate = data.handoverDate;
    }

    if (data.keysHandedOver !== undefined) {
      deal.keysHandedOver = data.keysHandedOver;
    }

    if (data.documentsHandedOver !== undefined) {
      deal.documentsHandedOver = data.documentsHandedOver;
    }

    if (data.status !== undefined) {
      deal.status = data.status;
      if (data.status === DealStatus.LOST) {
        deal.stage = DealStage.CLOSED_LOST;
        deal.probability = 0;
      } else if (data.status === DealStatus.WON) {
        deal.stage = DealStage.CLOSED_WON;
        deal.probability = 100;
      }
    }

    if (data.lostReason !== undefined) {
      deal.lostReason = data.lostReason;
    }

    if (data.wonNotes !== undefined) {
      deal.wonNotes = data.wonNotes;
    }

    await deal.save();
    await this.cacheDeal(deal);

    logger.info('Deal updated', { dealId, updatedBy });

    return deal;
  }

  // ==============================================
  // DELETE DEAL (Soft Delete)
  // ==============================================

  async deleteDeal(dealId: string): Promise<void> {
    const deal = await this.getDealById(dealId);
    deal.deletedAt = new Date();
    await deal.save();

    // Remove from cache
    await redis.del(`deal:${dealId}`);

    logger.info('Deal deleted', { dealId });
  }

  // ==============================================
  // STAGE MANAGEMENT
  // ==============================================

  async updateStage(dealId: string, newStage: DealStage, changedBy: string, notes?: string): Promise<IDeal> {
    const deal = await this.getDealById(dealId);

    // Validate stage transition
    if (!isValidStageTransition(deal.stage, newStage)) {
      throw new StageTransitionError(deal.stage, newStage);
    }

    const oldStage = deal.stage;

    // Update stage and probability
    deal.stage = newStage;
    deal.probability = STAGE_PROBABILITY_MAP[newStage];

    // Handle terminal stages
    if (newStage === DealStage.CLOSED_WON) {
      deal.status = DealStatus.WON;
      deal.finalPrice = deal.negotiatedPrice || deal.askingPrice;
      deal.wonNotes = notes || 'Deal closed successfully';
    } else if (newStage === DealStage.CLOSED_LOST) {
      deal.status = DealStatus.LOST;
      deal.probability = 0;
      deal.lostReason = notes || 'Deal lost';
    }

    // Add to stage history
    deal.stageHistory.push({
      stage: newStage,
      changedAt: new Date(),
      changedBy,
      notes: notes || `Stage changed from ${oldStage} to ${newStage}`,
    });

    await deal.save();
    await this.cacheDeal(deal);

    logger.info('Deal stage updated', { dealId, oldStage, newStage, changedBy });

    return deal;
  }

  // ==============================================
  // OFFER MANAGEMENT
  // ==============================================

  async addOffer(
    dealId: string,
    offeredBy: OfferedBy,
    price: number,
    notes?: string,
    offeredByUserId?: string
  ): Promise<IDeal> {
    const deal = await this.getDealById(dealId);

    deal.offers.push({
      offeredBy,
      price,
      notes,
      createdAt: new Date(),
      status: OfferStatus.PENDING,
    });

    // Auto-progress stage if needed
    if (deal.stage === DealStage.INQUIRY || deal.stage === DealStage.SITE_VISIT) {
      deal.stage = DealStage.OFFER_MADE;
      deal.probability = STAGE_PROBABILITY_MAP[DealStage.OFFER_MADE];
      deal.stageHistory.push({
        stage: DealStage.OFFER_MADE,
        changedAt: new Date(),
        changedBy: offeredByUserId || 'system',
        notes: `Offer of ${price} received`,
      });
    }

    await deal.save();
    await this.cacheDeal(deal);

    logger.info('Offer added to deal', { dealId, offeredBy, price });

    return deal;
  }

  async updateOfferStatus(
    dealId: string,
    offerIndex: number,
    status: OfferStatus,
    counteredPrice?: number,
    notes?: string
  ): Promise<IDeal> {
    const deal = await this.getDealById(dealId);

    if (offerIndex < 0 || offerIndex >= deal.offers.length) {
      throw new InvalidOperationError('Invalid offer index');
    }

    const offer = deal.offers[offerIndex];
    offer.status = status;

    if (status === OfferStatus.ACCEPTED) {
      offer.acceptedAt = new Date();
      deal.negotiatedPrice = counteredPrice || offer.price;
      deal.stage = DealStage.NEGOTIATION;
      deal.probability = STAGE_PROBABILITY_MAP[DealStage.NEGOTIATION];
    } else if (status === OfferStatus.COUNTERED) {
      offer.counteredAt = new Date();
      if (counteredPrice) {
        // Add counter offer
        const counterOfferBy: OfferedBy = offer.offeredBy === OfferedBy.BUYER ? OfferedBy.SELLER : OfferedBy.BUYER;
        deal.offers.push({
          offeredBy: counterOfferBy,
          price: counteredPrice,
          notes: 'Counter offer',
          createdAt: new Date(),
          status: OfferStatus.PENDING,
        });
      }
    } else if (status === OfferStatus.REJECTED) {
      offer.rejectedAt = new Date();
    }

    await deal.save();
    await this.cacheDeal(deal);

    logger.info('Offer status updated', { dealId, offerIndex, status });

    return deal;
  }

  // ==============================================
  // PAYMENT MILESTONE MANAGEMENT
  // ==============================================

  async addPaymentMilestone(
    dealId: string,
    milestone: string,
    amount: number,
    dueDate: Date
  ): Promise<IDeal> {
    const deal = await this.getDealById(dealId);

    deal.paymentMilestones.push({
      milestone,
      amount,
      dueDate,
      status: PaymentMilestoneStatus.PENDING,
    });

    await deal.save();
    await this.cacheDeal(deal);

    logger.info('Payment milestone added', { dealId, milestone, amount });

    return deal;
  }

  async updatePaymentMilestone(
    dealId: string,
    milestoneIndex: number,
    data: {
      status?: PaymentMilestoneStatus;
      paidAt?: Date;
      transactionId?: string;
      notes?: string;
    }
  ): Promise<IDeal> {
    const deal = await this.getDealById(dealId);

    if (milestoneIndex < 0 || milestoneIndex >= deal.paymentMilestones.length) {
      throw new InvalidOperationError('Invalid milestone index');
    }

    const milestone = deal.paymentMilestones[milestoneIndex];

    if (data.status) {
      milestone.status = data.status;
    }
    if (data.paidAt) {
      milestone.paidAt = data.paidAt;
    }
    if (data.transactionId) {
      milestone.transactionId = data.transactionId;
    }
    if (data.notes) {
      milestone.notes = data.notes;
    }

    // Update amount paid
    const paidMilestones = deal.paymentMilestones
      .filter(m => m.status === PaymentMilestoneStatus.PAID)
      .reduce((sum, m) => sum + m.amount, 0);
    deal.amountPaid = paidMilestones;

    await deal.save();
    await this.cacheDeal(deal);

    logger.info('Payment milestone updated', { dealId, milestoneIndex });

    return deal;
  }

  // ==============================================
  // HANDOVER MANAGEMENT
  // ==============================================

  async addHandoverItem(dealId: string, item: string): Promise<IDeal> {
    const deal = await this.getDealById(dealId);

    deal.handoverChecklist.push({
      item,
      completed: false,
    });

    await deal.save();
    await this.cacheDeal(deal);

    return deal;
  }

  async completeHandoverItem(
    dealId: string,
    itemIndex: number,
    completed: boolean,
    notes?: string
  ): Promise<IDeal> {
    const deal = await this.getDealById(dealId);

    if (itemIndex < 0 || itemIndex >= deal.handoverChecklist.length) {
      throw new InvalidOperationError('Invalid handover item index');
    }

    const item = deal.handoverChecklist[itemIndex];
    item.completed = completed;
    item.completedAt = completed ? new Date() : undefined;
    if (notes) {
      item.notes = notes;
    }

    // Check if all items are complete
    const allComplete = deal.handoverChecklist.every(i => i.completed);
    if (allComplete && deal.stage !== DealStage.CLOSED_WON) {
      deal.stage = DealStage.CLOSED_WON;
      deal.status = DealStatus.WON;
      deal.probability = 100;
    }

    await deal.save();
    await this.cacheDeal(deal);

    logger.info('Handover item updated', { dealId, itemIndex, completed });

    return deal;
  }

  // ==============================================
  // QUERY DEALS
  // ==============================================

  async queryDeals(
    filters: DealFilters,
    pagination: PaginationOptions
  ): Promise<{ deals: IDeal[]; total: number }> {
    const query: FilterQuery<IDeal> = { deletedAt: null };

    if (filters.brokerId) {
      query.brokerId = new Types.ObjectId(filters.brokerId);
    }
    if (filters.propertyId) {
      query.propertyId = new Types.ObjectId(filters.propertyId);
    }
    if (filters.leadId) {
      query.leadId = new Types.ObjectId(filters.leadId);
    }
    if (filters.stage) {
      query.stage = filters.stage;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.dealType) {
      query.dealType = filters.dealType;
    }
    if (filters.propertyType) {
      query.propertyType = filters.propertyType;
    }
    if (filters.source) {
      query.source = filters.source;
    }
    if (filters.minPrice !== undefined) {
      query.askingPrice = { $gte: filters.minPrice };
    }
    if (filters.maxPrice !== undefined) {
      query.askingPrice = { ...query.askingPrice as object, $lte: filters.maxPrice };
    }
    if (filters.probability !== undefined) {
      query.probability = { $gte: filters.probability };
    }
    if (filters.companyId) {
      query.companyId = filters.companyId;
    }
    if (filters.search) {
      query.$or = [
        { dealId: { $regex: filters.search, $options: 'i' } },
        { buyerId: { $regex: filters.search, $options: 'i' } },
        { sellerId: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const sort: Record<string, 1 | -1> = {};
    sort[pagination.sortBy] = pagination.sortOrder === 'asc' ? 1 : -1;

    const [deals, total] = await Promise.all([
      Deal.find(query).sort(sort).skip(skip).limit(pagination.limit).lean(),
      Deal.countDocuments(query),
    ]);

    return { deals: deals as unknown as IDeal[], total };
  }

  // ==============================================
  // PIPELINE VIEW
  // ==============================================

  async getPipeline(brokerId?: string, minProbability: number = 0): Promise<Record<DealStage, IDeal[]>> {
    const query: FilterQuery<IDeal> = {
      deletedAt: null,
      status: DealStatus.ACTIVE,
      probability: { $gte: minProbability },
    };

    if (brokerId) {
      query.brokerId = new Types.ObjectId(brokerId);
    }

    const deals = await Deal.find(query)
      .sort({ probability: -1, updatedAt: -1 })
      .populate('leadId', 'name email phone')
      .populate('propertyId', 'title address price')
      .lean();

    // Group by stage
    const pipeline: Record<DealStage, IDeal[]> = {
      [DealStage.INQUIRY]: [],
      [DealStage.SITE_VISIT]: [],
      [DealStage.OFFER_MADE]: [],
      [DealStage.NEGOTIATION]: [],
      [DealStage.AGREEMENT]: [],
      [DealStage.REGISTRY]: [],
      [DealStage.CLOSED_WON]: [],
      [DealStage.CLOSED_LOST]: [],
    };

    for (const deal of deals) {
      if (pipeline[deal.stage as DealStage]) {
        pipeline[deal.stage as DealStage].push(deal as unknown as IDeal);
      }
    }

    return pipeline;
  }

  // ==============================================
  // BULK OPERATIONS
  // ==============================================

  async bulkUpdateStage(
    dealIds: string[],
    stage: DealStage,
    changedBy: string,
    notes?: string
  ): Promise<{ updated: number; errors: string[] }> {
    const errors: string[] = [];
    let updated = 0;

    for (const dealId of dealIds) {
      try {
        await this.updateStage(dealId, stage, changedBy, notes);
        updated++;
      } catch (error) {
        errors.push(`${dealId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { updated, errors };
  }

  async bulkUpdateStatus(
    dealIds: string[],
    status: DealStatus,
    changedBy: string,
    _notes?: string
  ): Promise<{ updated: number; errors: string[] }> {
    const errors: string[] = [];
    let updated = 0;

    for (const dealId of dealIds) {
      try {
        await this.updateDeal(dealId, { status }, changedBy);
        updated++;
      } catch (error) {
        errors.push(`${dealId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { updated, errors };
  }

  // ==============================================
  // ANALYTICS
  // ==============================================

  async getAnalytics(params: {
    startDate?: Date;
    endDate?: Date;
    brokerId?: string;
    propertyType?: PropertyType;
    groupBy?: 'stage' | 'source' | 'broker' | 'propertyType' | 'dealType';
  }): Promise<any[]> {
    const matchStage: FilterQuery<IDeal> = { deletedAt: null };

    if (params.startDate || params.endDate) {
      matchStage.createdAt = {};
      if (params.startDate) (matchStage.createdAt as any).$gte = params.startDate;
      if (params.endDate) (matchStage.createdAt as any).$lte = params.endDate;
    }
    if (params.brokerId) {
      matchStage.brokerId = new Types.ObjectId(params.brokerId);
    }
    if (params.propertyType) {
      matchStage.propertyType = params.propertyType;
    }

    const groupBy = params.groupBy || 'stage';

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: `$${groupBy}`,
          count: { $sum: 1 },
          totalValue: { $sum: '$askingPrice' },
          avgProbability: { $avg: '$probability' },
          wonCount: {
            $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] },
          },
          lostCount: {
            $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 as const } },
    ];

    return Deal.aggregate(pipeline);
  }

  // ==============================================
  // TIMELINE
  // ==============================================

  async getDealTimeline(dealId: string): Promise<any[]> {
    const deal = await this.getDealById(dealId);

    const timeline: any[] = [];

    // Add stage history
    for (const history of deal.stageHistory) {
      timeline.push({
        type: 'stage_change',
        stage: history.stage,
        date: history.changedAt,
        by: history.changedBy,
        notes: history.notes,
      });
    }

    // Add offers
    for (const offer of deal.offers) {
      timeline.push({
        type: 'offer',
        offeredBy: offer.offeredBy,
        price: offer.price,
        status: offer.status,
        date: offer.createdAt,
      });
    }

    // Add payment milestones
    for (const milestone of deal.paymentMilestones) {
      timeline.push({
        type: 'payment',
        milestone: milestone.milestone,
        amount: milestone.amount,
        status: milestone.status,
        dueDate: milestone.dueDate,
        paidAt: milestone.paidAt,
      });
    }

    // Sort by date
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return timeline;
  }

  // ==============================================
  // CACHE MANAGEMENT
  // ==============================================

  private async cacheDeal(deal: IDeal): Promise<void> {
    try {
      await redis.setex(
        `deal:${deal.dealId}`,
        3600, // 1 hour TTL
        JSON.stringify(deal.toObject())
      );
    } catch (error) {
      logger.warn('Failed to cache deal', { dealId: deal.dealId, error });
    }
  }

  async invalidateDealCache(dealId: string): Promise<void> {
    try {
      await redis.del(`deal:${dealId}`);
    } catch (error) {
      logger.warn('Failed to invalidate deal cache', { dealId });
    }
  }

  // ==============================================
  // DEAL STATS
  // ==============================================

  async getDealStats(brokerId?: string): Promise<{
    total: number;
    active: number;
    won: number;
    lost: number;
    totalValue: number;
    avgProbability: number;
  }> {
    const match: FilterQuery<IDeal> = { deletedAt: null };
    if (brokerId) {
      match.brokerId = new Types.ObjectId(brokerId);
    }

    const stats = await Deal.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
          lost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
          totalValue: { $sum: '$askingPrice' },
          avgProbability: { $avg: '$probability' },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        total: 0,
        active: 0,
        won: 0,
        lost: 0,
        totalValue: 0,
        avgProbability: 0,
      };
    }

    return {
      total: stats[0].total,
      active: stats[0].active,
      won: stats[0].won,
      lost: stats[0].lost,
      totalValue: stats[0].totalValue,
      avgProbability: Math.round(stats[0].avgProbability * 100) / 100,
    };
  }
}

export const dealService = new DealService();
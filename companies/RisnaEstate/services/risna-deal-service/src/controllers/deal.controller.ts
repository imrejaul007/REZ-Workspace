import { Request, Response } from 'express';
import { dealService } from '../services/deal.service';
import { aiScoringService } from '../services/ai-scoring.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';
import { DealType, PropertyType, DealStage, DealStatus, DealSource, OfferedBy, OfferStatus, PaymentMilestoneStatus } from '../models/deal.model';
import { buildPaginationResponse } from '../utils/deal.utils';

export class DealController {
  // ==============================================
  // CREATE DEAL
  // ==============================================

  async createDeal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = {
        ...req.body,
        createdBy: req.user?.userId || 'system',
        companyId: req.user?.companyId,
      };

      const deal = await dealService.createDeal(data);

      res.status(201).json({
        success: true,
        data: deal,
        message: 'Deal created successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // GET DEAL BY ID
  // ==============================================

  async getDeal(req: Request, res: Response): Promise<void> {
    try {
      const { dealId } = req.params;
      const deal = await dealService.getDealById(dealId);

      res.json({
        success: true,
        data: deal,
      });
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // UPDATE DEAL
  // ==============================================

  async updateDeal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dealId } = req.params;
      const { body } = req;
      const updatedBy = req.user?.userId || 'system';

      const deal = await dealService.updateDeal(dealId, body, updatedBy);

      res.json({
        success: true,
        data: deal,
        message: 'Deal updated successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // DELETE DEAL
  // ==============================================

  async deleteDeal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dealId } = req.params;
      await dealService.deleteDeal(dealId);

      res.json({
        success: true,
        message: 'Deal deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // STAGE MANAGEMENT
  // ==============================================

  async updateStage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dealId } = req.params;
      const { stage, notes } = req.body;
      const changedBy = req.user?.userId || 'system';

      const deal = await dealService.updateStage(dealId, stage, changedBy, notes);

      res.json({
        success: true,
        data: deal,
        message: `Deal stage updated to ${stage}`,
      });
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // OFFER MANAGEMENT
  // ==============================================

  async addOffer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dealId } = req.params;
      const { offeredBy, price, notes } = req.body;
      const offeredByUserId = req.user?.userId || 'system';

      const deal = await dealService.addOffer(dealId, offeredBy, price, notes, offeredByUserId);

      res.status(201).json({
        success: true,
        data: deal,
        message: 'Offer added successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  async updateOffer(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dealId, offerId } = req.params;
      const { status, counteredPrice, notes } = req.body;

      // Get deal and find offer index
      const deal = await dealService.getDealById(dealId);
      const offerIndex = parseInt(offerId);

      if (isNaN(offerIndex) || offerIndex < 0 || offerIndex >= deal.offers.length) {
        throw ApiError.badRequest('Invalid offer ID');
      }

      const updatedDeal = await dealService.updateOfferStatus(
        dealId,
        offerIndex,
        status,
        counteredPrice,
        notes
      );

      res.json({
        success: true,
        data: updatedDeal,
        message: 'Offer status updated',
      });
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // PAYMENT MILESTONE MANAGEMENT
  // ==============================================

  async addPaymentMilestone(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dealId } = req.params;
      const { milestone, amount, dueDate } = req.body;

      const deal = await dealService.addPaymentMilestone(dealId, milestone, amount, new Date(dueDate));

      res.status(201).json({
        success: true,
        data: deal,
        message: 'Payment milestone added',
      });
    } catch (error) {
      throw error;
    }
  }

  async updatePaymentMilestone(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dealId, milestoneId } = req.params;
      const { status, paidAt, transactionId, notes } = req.body;

      const deal = await dealService.getDealById(dealId);
      const milestoneIndex = parseInt(milestoneId);

      if (isNaN(milestoneIndex) || milestoneIndex < 0 || milestoneIndex >= deal.paymentMilestones.length) {
        throw ApiError.badRequest('Invalid milestone ID');
      }

      const updatedDeal = await dealService.updatePaymentMilestone(dealId, milestoneIndex, {
        status,
        paidAt: paidAt ? new Date(paidAt) : undefined,
        transactionId,
        notes,
      });

      res.json({
        success: true,
        data: updatedDeal,
        message: 'Payment milestone updated',
      });
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // HANDOVER MANAGEMENT
  // ==============================================

  async addHandoverItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dealId } = req.params;
      const { item } = req.body;

      const deal = await dealService.addHandoverItem(dealId, item);

      res.status(201).json({
        success: true,
        data: deal,
        message: 'Handover item added',
      });
    } catch (error) {
      throw error;
    }
  }

  async completeHandoverItem(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dealId, itemId } = req.params;
      const { completed, notes } = req.body;

      const deal = await dealService.getDealById(dealId);
      const itemIndex = parseInt(itemId);

      if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= deal.handoverChecklist.length) {
        throw ApiError.badRequest('Invalid item ID');
      }

      const updatedDeal = await dealService.completeHandoverItem(dealId, itemIndex, completed, notes);

      res.json({
        success: true,
        data: updatedDeal,
        message: completed ? 'Handover item completed' : 'Handover item marked incomplete',
      });
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // QUERY DEALS
  // ==============================================

  async queryDeals(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        brokerId,
        propertyId,
        leadId,
        stage,
        status,
        dealType,
        propertyType,
        source,
        minPrice,
        maxPrice,
        probability,
        search,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query as any;

      const filters = {
        brokerId,
        propertyId,
        leadId,
        stage: stage as DealStage | undefined,
        status: status as DealStatus | undefined,
        dealType: dealType as DealType | undefined,
        propertyType: propertyType as PropertyType | undefined,
        source: source as DealSource | undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        probability: probability ? parseFloat(probability) : undefined,
        search,
        companyId: req.user?.companyId,
      };

      const pagination = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const { deals, total } = await dealService.queryDeals(filters, pagination);
      const paginationMeta = buildPaginationResponse(total, pagination.page, pagination.limit);

      res.json({
        success: true,
        data: deals,
        pagination: paginationMeta,
      });
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // PIPELINE VIEW
  // ==============================================

  async getPipeline(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { brokerId, minProbability = 0 } = req.query as any;

      const pipeline = await dealService.getPipeline(brokerId, parseFloat(minProbability));

      // Calculate pipeline stats
      let totalDeals = 0;
      let totalValue = 0;
      let weightedValue = 0;

      for (const stage of Object.values(pipeline)) {
        for (const deal of stage) {
          totalDeals++;
          const price = (deal as any).finalPrice || (deal as any).askingPrice;
          totalValue += price;
          weightedValue += price * ((deal as any).probability / 100);
        }
      }

      res.json({
        success: true,
        data: {
          pipeline,
          stats: {
            totalDeals,
            totalValue,
            weightedValue: Math.round(weightedValue),
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // BULK OPERATIONS
  // ==============================================

  async bulkUpdateStage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dealIds, stage, notes } = req.body;
      const changedBy = req.user?.userId || 'system';

      const result = await dealService.bulkUpdateStage(dealIds, stage, changedBy, notes);

      res.json({
        success: true,
        data: result,
        message: `Updated ${result.updated} deals`,
      });
    } catch (error) {
      throw error;
    }
  }

  async bulkUpdateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dealIds, status, notes } = req.body;
      const changedBy = req.user?.userId || 'system';

      const result = await dealService.bulkUpdateStatus(dealIds, status, changedBy, notes);

      res.json({
        success: true,
        data: result,
        message: `Updated ${result.updated} deals`,
      });
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // AI SCORING
  // ==============================================

  async scoreDeal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { dealId } = req.params;
      const { force = false } = req.body;

      const deal = await dealService.getDealById(dealId);
      const scoreResult = await aiScoringService.scoreDeal(deal, force);

      // Update deal with AI score
      await dealService.updateDeal(dealId, { } as any, 'ai-system');

      res.json({
        success: true,
        data: scoreResult,
      });
    } catch (error) {
      throw error;
    }
  }

  async batchScoreDeals(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { brokerId, minProbability = 0 } = req.query as any;

      const pipeline = await dealService.getPipeline(brokerId, parseFloat(minProbability));

      // Flatten all deals
      const allDeals = Object.values(pipeline).flat();

      const scores = await aiScoringService.scoreDeals(allDeals);

      res.json({
        success: true,
        data: {
          total: allDeals.length,
          scores: Object.fromEntries(scores),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // ANALYTICS
  // ==============================================

  async getAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { startDate, endDate, brokerId, propertyType, groupBy = 'stage' } = req.query as any;

      const analytics = await dealService.getAnalytics({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        brokerId,
        propertyType: propertyType as PropertyType,
        groupBy: groupBy as any,
      });

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // TIMELINE
  // ==============================================

  async getTimeline(req: Request, res: Response): Promise<void> {
    try {
      const { dealId } = req.params;
      const timeline = await dealService.getDealTimeline(dealId);

      res.json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // STATS
  // ==============================================

  async getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { brokerId } = req.query as any;
      const stats = await dealService.getDealStats(brokerId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      throw error;
    }
  }
}

export const dealController = new DealController();
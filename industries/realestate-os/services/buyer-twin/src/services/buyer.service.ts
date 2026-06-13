import { v4 as uuidv4 } from 'uuid';
import { Buyer, IBuyer } from '../models/index.js';
import {
  CreateBuyerInput,
  UpdateBuyerInput,
  PropertyInteractionInput,
  MatchingCriteriaInput
} from '../middleware/validation.js';

// ============================================================================
// BUYER SERVICE
// ============================================================================

export interface BuyerServiceResult {
  success: boolean;
  data?: IBuyer | IBuyer[] | any;
  error?: string;
  message?: string;
}

export interface BuyerListResult {
  success: boolean;
  data?: IBuyer[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
}

export interface MatchingResult {
  success: boolean;
  data?: {
    buyers: IBuyer[];
    total: number;
  };
  error?: string;
}

export interface BuyerStats {
  totalBuyers: number;
  activeBuyers: number;
  pausedBuyers: number;
  byStage: {
    searching: number;
    viewing: number;
    negotiating: number;
    under_contract: number;
    closed: number;
  };
  preApproved: number;
  goldenVisaInterested: number;
  avgViewingCount: number;
}

/**
 * Buyer Service - handles all buyer twin operations
 */
export const buyerService = {
  // ========================================================================
  // CREATE
  // ========================================================================

  /**
   * Create a new buyer
   */
  async createBuyer(input: CreateBuyerInput): Promise<BuyerServiceResult> {
    try {
      // Check if buyer already exists
      const existing = await Buyer.findOne({ buyerId: input.buyerId });
      if (existing) {
        return {
          success: false,
          error: 'Buyer already exists'
        };
      }

      const buyer = await Buyer.create({
        ...input,
        status: {
          current: 'active',
          stage: 'searching',
          lastActivity: new Date(),
          viewingCount: 0
        },
        history: {
          propertiesViewed: [],
          propertiesSaved: [],
          offersMade: 0,
          offersAccepted: 0,
          transactionsCompleted: 0
        }
      });

      return {
        success: true,
        data: buyer
      };
    } catch (error: unknown) {
      console.error('[BuyerService] Error creating buyer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create buyer'
      };
    }
  },

  // ========================================================================
  // READ
  // ========================================================================

  /**
   * Get buyer by ID
   */
  async getBuyer(buyerId: string, tenantId?: string): Promise<BuyerServiceResult> {
    try {
      const query: Record<string, string> = { buyerId };
      if (tenantId) {
        query['tenantId'] = tenantId;
      }

      const buyer = await Buyer.findOne(query);
      if (!buyer) {
        return {
          success: false,
          error: 'Buyer not found'
        };
      }

      return {
        success: true,
        data: buyer
      };
    } catch (error: unknown) {
      console.error('[BuyerService] Error getting buyer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get buyer'
      };
    }
  },

  /**
   * List buyers for a tenant
   */
  async listBuyers(
    tenantId: string,
    options?: {
      status?: string;
      stage?: string;
      agentId?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<BuyerListResult> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const query: Record<string, any> = { tenantId };

      if (options?.status) {
        query['status.current'] = options.status;
      }
      if (options?.stage) {
        query['status.stage'] = options.stage;
      }
      if (options?.agentId) {
        query['assignedAgentId'] = options.agentId;
      }

      const [buyers, total] = await Promise.all([
        Buyer.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ 'status.lastActivity': -1 }),
        Buyer.countDocuments(query)
      ]);

      return {
        success: true,
        data: buyers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: unknown) {
      console.error('[BuyerService] Error listing buyers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list buyers'
      };
    }
  },

  /**
   * Get buyers by agent
   */
  async getBuyersByAgent(
    agentId: string,
    options?: {
      page?: number;
      limit?: number;
    }
  ): Promise<BuyerListResult> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const [buyers, total] = await Promise.all([
        Buyer.find({ assignedAgentId: agentId })
          .skip(skip)
          .limit(limit)
          .sort({ 'status.lastActivity': -1 }),
        Buyer.countDocuments({ assignedAgentId: agentId })
      ]);

      return {
        success: true,
        data: buyers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: unknown) {
      console.error('[BuyerService] Error getting buyers by agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get buyers by agent'
      };
    }
  },

  // ========================================================================
  // UPDATE
  // ========================================================================

  /**
   * Update buyer
   */
  async updateBuyer(
    buyerId: string,
    updates: UpdateBuyerInput,
    tenantId?: string
  ): Promise<BuyerServiceResult> {
    try {
      const query: Record<string, string> = { buyerId };
      if (tenantId) {
        query['tenantId'] = tenantId;
      }

      // Update lastActivity timestamp
      const updateData = {
        ...updates,
        'status.lastActivity': new Date()
      };

      const buyer = await Buyer.findOneAndUpdate(
        query,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!buyer) {
        return {
          success: false,
          error: 'Buyer not found'
        };
      }

      return {
        success: true,
        data: buyer
      };
    } catch (error: unknown) {
      console.error('[BuyerService] Error updating buyer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update buyer'
      };
    }
  },

  /**
   * Update buyer status
   */
  async updateBuyerStatus(
    buyerId: string,
    status: {
      current?: 'active' | 'paused' | 'inactive' | 'closed';
      stage?: 'searching' | 'viewing' | 'negotiating' | 'under_contract' | 'closed';
    },
    tenantId?: string
  ): Promise<BuyerServiceResult> {
    try {
      const query: Record<string, string> = { buyerId };
      if (tenantId) {
        query['tenantId'] = tenantId;
      }

      const buyer = await Buyer.findOneAndUpdate(
        query,
        {
          $set: {
            ...status,
            'status.lastActivity': new Date()
          }
        },
        { new: true }
      );

      if (!buyer) {
        return {
          success: false,
          error: 'Buyer not found'
        };
      }

      return {
        success: true,
        data: buyer
      };
    } catch (error: unknown) {
      console.error('[BuyerService] Error updating buyer status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update buyer status'
      };
    }
  },

  /**
   * Assign agent to buyer
   */
  async assignAgent(
    buyerId: string,
    agentId: string,
    tenantId?: string
  ): Promise<BuyerServiceResult> {
    try {
      const query: Record<string, string> = { buyerId };
      if (tenantId) {
        query['tenantId'] = tenantId;
      }

      const buyer = await Buyer.findOneAndUpdate(
        query,
        {
          $set: {
            assignedAgentId: agentId,
            'status.lastActivity': new Date()
          }
        },
        { new: true }
      );

      if (!buyer) {
        return {
          success: false,
          error: 'Buyer not found'
        };
      }

      return {
        success: true,
        data: buyer
      };
    } catch (error: unknown) {
      console.error('[BuyerService] Error assigning agent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign agent'
      };
    }
  },

  // ========================================================================
  // PROPERTY INTERACTIONS
  // ========================================================================

  /**
   * Record property interaction
   */
  async recordPropertyInteraction(
    buyerId: string,
    interaction: PropertyInteractionInput,
    tenantId?: string
  ): Promise<BuyerServiceResult> {
    try {
      const query: Record<string, string> = { buyerId };
      if (tenantId) {
        query['tenantId'] = tenantId;
      }

      const updateOps: Record<string, any> = {
        'status.lastActivity': new Date()
      };

      switch (interaction.action) {
        case 'view':
          updateOps['$addToSet'] = { 'history.propertiesViewed': interaction.propertyId };
          updateOps['$inc'] = { 'status.viewingCount': 1 };
          break;
        case 'save':
          updateOps['$addToSet'] = { 'history.propertiesSaved': interaction.propertyId };
          break;
        case 'unfavorite':
          updateOps['$pull'] = { 'history.propertiesSaved': interaction.propertyId };
          break;
        case 'offer':
          updateOps['$addToSet'] = { 'history.propertiesViewed': interaction.propertyId };
          updateOps['$inc'] = { 'history.offersMade': 1 };
          break;
        case 'inquiry':
          updateOps['$addToSet'] = { 'history.propertiesViewed': interaction.propertyId };
          break;
      }

      const buyer = await Buyer.findOneAndUpdate(
        query,
        updateOps,
        { new: true }
      );

      if (!buyer) {
        return {
          success: false,
          error: 'Buyer not found'
        };
      }

      return {
        success: true,
        data: buyer
      };
    } catch (error: unknown) {
      console.error('[BuyerService] Error recording property interaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record property interaction'
      };
    }
  },

  // ========================================================================
  // MATCHING
  // ========================================================================

  /**
   * Find matching buyers for property criteria
   */
  async findMatchingBuyers(
    criteria: MatchingCriteriaInput
  ): Promise<MatchingResult> {
    try {
      const limit = criteria.limit || 20;
      const query: Record<string, any> = {
        'status.current': 'active'
      };

      // Build query based on criteria
      if (criteria.areas && criteria.areas.length > 0) {
        query['searchCriteria.areas'] = { $in: criteria.areas };
      }

      if (criteria.minPrice !== undefined || criteria.maxPrice !== undefined) {
        query['searchCriteria.minPrice'] = { $lte: criteria.maxPrice || Infinity };
        query['searchCriteria.maxPrice'] = { $gte: criteria.minPrice || 0 };
      }

      if (criteria.propertyTypes && criteria.propertyTypes.length > 0) {
        query['searchCriteria.propertyType'] = { $in: criteria.propertyTypes };
      }

      if (criteria.minBedrooms !== undefined) {
        query['searchCriteria.minBedrooms'] = { $lte: criteria.minBedrooms };
      }

      if (criteria.maxBedrooms !== undefined) {
        query['$or'] = [
          { 'searchCriteria.maxBedrooms': { $gte: criteria.maxBedrooms } },
          { 'searchCriteria.maxBedrooms': { $exists: false } }
        ];
      }

      if (criteria.features && criteria.features.length > 0) {
        query['searchCriteria.features'] = { $all: criteria.features };
      }

      const [buyers, total] = await Promise.all([
        Buyer.find(query)
          .limit(limit)
          .sort({ 'status.lastActivity': -1 }),
        Buyer.countDocuments(query)
      ]);

      return {
        success: true,
        data: {
          buyers,
          total
        }
      };
    } catch (error: unknown) {
      console.error('[BuyerService] Error finding matching buyers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find matching buyers'
      };
    }
  },

  // ========================================================================
  // ANALYTICS
  // ========================================================================

  /**
   * Get buyer statistics
   */
  async getBuyerStats(tenantId: string): Promise<BuyerServiceResult> {
    try {
      const stats = await Buyer.aggregate([
        { $match: { tenantId } },
        {
          $group: {
            _id: null,
            totalBuyers: { $sum: 1 },
            activeBuyers: {
              $sum: { $cond: [{ $eq: ['$status.current', 'active'] }, 1, 0] }
            },
            pausedBuyers: {
              $sum: { $cond: [{ $eq: ['$status.current', 'paused'] }, 1, 0] }
            },
            searchingStage: {
              $sum: { $cond: [{ $eq: ['$status.stage', 'searching'] }, 1, 0] }
            },
            viewingStage: {
              $sum: { $cond: [{ $eq: ['$status.stage', 'viewing'] }, 1, 0] }
            },
            negotiatingStage: {
              $sum: { $cond: [{ $eq: ['$status.stage', 'negotiating'] }, 1, 0] }
            },
            underContractStage: {
              $sum: { $cond: [{ $eq: ['$status.stage', 'under_contract'] }, 1, 0] }
            },
            closedStage: {
              $sum: { $cond: [{ $eq: ['$status.stage', 'closed'] }, 1, 0] }
            },
            preApproved: {
              $sum: { $cond: ['$financing.preApproved', 1, 0] }
            },
            goldenVisaInterested: {
              $sum: { $cond: ['$goldenVisa.interested', 1, 0] }
            },
            totalViewings: { $sum: '$status.viewingCount' }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          success: true,
          data: {
            totalBuyers: 0,
            activeBuyers: 0,
            pausedBuyers: 0,
            byStage: {
              searching: 0,
              viewing: 0,
              negotiating: 0,
              under_contract: 0,
              closed: 0
            },
            preApproved: 0,
            goldenVisaInterested: 0,
            avgViewingCount: 0
          } as BuyerStats
        };
      }

      const s = stats[0];
      return {
        success: true,
        data: {
          totalBuyers: s.totalBuyers,
          activeBuyers: s.activeBuyers,
          pausedBuyers: s.pausedBuyers,
          byStage: {
            searching: s.searchingStage,
            viewing: s.viewingStage,
            negotiating: s.negotiatingStage,
            under_contract: s.underContractStage,
            closed: s.closedStage
          },
          preApproved: s.preApproved,
          goldenVisaInterested: s.goldenVisaInterested,
          avgViewingCount: s.totalBuyers > 0 ? s.totalViewings / s.totalBuyers : 0
        } as BuyerStats
      };
    } catch (error: unknown) {
      console.error('[BuyerService] Error getting buyer stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get buyer stats'
      };
    }
  },

  // ========================================================================
  // DELETE
  // ========================================================================

  /**
   * Delete buyer (soft delete - set status to inactive)
   */
  async deleteBuyer(buyerId: string, tenantId?: string): Promise<BuyerServiceResult> {
    try {
      const query: Record<string, string> = { buyerId };
      if (tenantId) {
        query['tenantId'] = tenantId;
      }

      const buyer = await Buyer.findOneAndUpdate(
        query,
        {
          $set: {
            'status.current': 'inactive',
            'status.lastActivity': new Date()
          }
        },
        { new: true }
      );

      if (!buyer) {
        return {
          success: false,
          error: 'Buyer not found'
        };
      }

      return {
        success: true,
        message: 'Buyer deactivated'
      };
    } catch (error: unknown) {
      console.error('[BuyerService] Error deleting buyer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete buyer'
      };
    }
  },

  // ========================================================================
  // SEARCH
  // ========================================================================

  /**
   * Search buyers by criteria
   */
  async searchBuyers(
    tenantId: string,
    searchCriteria: {
      query?: string;
      name?: string;
      email?: string;
      phone?: string;
      minBudget?: number;
      maxBudget?: number;
      propertyTypes?: string[];
      areas?: string[];
      urgency?: string;
    },
    options?: {
      page?: number;
      limit?: number;
    }
  ): Promise<BuyerListResult> {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const query: Record<string, any> = { tenantId };

      if (searchCriteria.query) {
        query['$or'] = [
          { 'profile.name.first': { $regex: searchCriteria.query, $options: 'i' } },
          { 'profile.name.last': { $regex: searchCriteria.query, $options: 'i' } },
          { 'profile.email': { $regex: searchCriteria.query, $options: 'i' } }
        ];
      }

      if (searchCriteria.name) {
        const andCondition = {
          $or: [
            { 'profile.name.first': { $regex: searchCriteria.name, $options: 'i' } },
            { 'profile.name.last': { $regex: searchCriteria.name, $options: 'i' } }
          ]
        };
        if (query['$and']) {
          query['$and'] = [...query['$and'], andCondition];
        } else {
          query['$and'] = [andCondition];
        }
      }

      if (searchCriteria.email) {
        query['profile.email'] = { $regex: searchCriteria.email, $options: 'i' };
      }

      if (searchCriteria.phone) {
        query['profile.phone'] = { $regex: searchCriteria.phone, $options: 'i' };
      }

      if (searchCriteria.minBudget !== undefined) {
        query['searchCriteria.minPrice'] = { $lte: searchCriteria.minBudget };
      }

      if (searchCriteria.maxBudget !== undefined) {
        query['searchCriteria.maxPrice'] = { $gte: searchCriteria.maxBudget };
      }

      if (searchCriteria.propertyTypes && searchCriteria.propertyTypes.length > 0) {
        query['searchCriteria.propertyType'] = { $in: searchCriteria.propertyTypes };
      }

      if (searchCriteria.areas && searchCriteria.areas.length > 0) {
        query['searchCriteria.areas'] = { $in: searchCriteria.areas };
      }

      if (searchCriteria.urgency) {
        query['timeline.urgency'] = searchCriteria.urgency;
      }

      const [buyers, total] = await Promise.all([
        Buyer.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ 'status.lastActivity': -1 }),
        Buyer.countDocuments(query)
      ]);

      return {
        success: true,
        data: buyers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: unknown) {
      console.error('[BuyerService] Error searching buyers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search buyers'
      };
    }
  }
};
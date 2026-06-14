import { UGCRights, IUGCRights, UGCContent } from '../models';
import { logger } from '../config/logger';

class RightsService {
  /**
   * Request rights for UGC content
   */
  async requestRights(
    ugcId: string,
    requestedBy: string,
    rightsType: 'display' | 'repost' | 'commercial' | 'all',
    usageTerms?: string,
    expiresAt?: Date
  ): Promise<IUGCRights> {
    // Check if content exists
    const content = await UGCContent.findById(ugcId);
    if (!content) {
      throw new Error('UGC content not found');
    }

    // Check for existing pending request
    const existingRequest = await UGCRights.findOne({
      ugcId,
      status: 'pending'
    });
    if (existingRequest) {
      throw new Error('A pending rights request already exists for this content');
    }

    // Update content rights status
    content.rightsStatus = 'requested';
    content.rightsRequestedAt = new Date();
    await content.save();

    // Create rights request
    const rights = await UGCRights.create({
      ugcId,
      requestedBy,
      requestedAt: new Date(),
      status: 'pending',
      rightsType,
      usageTerms,
      expiresAt
    });

    logger.info(`Rights requested for content ${ugcId}`, { rightsType, requestedBy });

    return rights;
  }

  /**
   * Respond to rights request (approve or deny)
   */
  async respondToRights(
    rightsId: string,
    action: 'approve' | 'deny',
    respondedBy: string,
    notes?: string
  ): Promise<IUGCRights> {
    const rights = await UGCRights.findById(rightsId);
    if (!rights) {
      throw new Error('Rights request not found');
    }

    if (rights.status !== 'pending') {
      throw new Error(`Cannot respond to rights request with status: ${rights.status}`);
    }

    rights.status = action === 'approve' ? 'approved' : 'denied';
    rights.respondedBy = respondedBy;
    rights.respondedAt = new Date();
    if (notes) {
      rights.notes = notes;
    }

    await rights.save();

    // Update UGC content rights status
    const content = await UGCContent.findById(rights.ugcId);
    if (content) {
      content.rightsStatus = action === 'approve' ? 'granted' : 'denied';
      if (action === 'approve') {
        content.rightsGrantedAt = new Date();
      }
      await content.save();
    }

    logger.info(`Rights ${action}ed for request ${rightsId}`, { respondedBy });

    return rights;
  }

  /**
   * Get all rights for a specific UGC
   */
  async getRightsForContent(ugcId: string): Promise<IUGCRights[]> {
    return UGCRights.find({ ugcId }).sort({ requestedAt: -1 });
  }

  /**
   * Get pending rights requests
   */
  async getPendingRequests(): Promise<IUGCRights[]> {
    return UGCRights.find({ status: 'pending' })
      .populate('ugcId')
      .sort({ requestedAt: -1 });
  }

  /**
   * List all rights with filters
   */
  async listRights(filters: {
    status?: 'pending' | 'approved' | 'denied' | 'expired';
    rightsType?: 'display' | 'repost' | 'commercial' | 'all';
    requestedBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ rights: IUGCRights[]; total: number }> {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.rightsType) {
      query.rightsType = filters.rightsType;
    }
    if (filters.requestedBy) {
      query.requestedBy = filters.requestedBy;
    }

    const [rights, total] = await Promise.all([
      UGCRights.find(query)
        .populate('ugcId')
        .sort({ requestedAt: -1 })
        .skip(filters.offset || 0)
        .limit(filters.limit || 50),
      UGCRights.countDocuments(query)
    ]);

    return { rights, total };
  }

  /**
   * Expire old rights requests
   */
  async expireOldRequests(): Promise<number> {
    const result = await UGCRights.updateMany(
      {
        status: 'pending',
        expiresAt: { $lt: new Date() }
      },
      {
        $set: { status: 'expired' }
      }
    );

    if (result.modifiedCount > 0) {
      logger.info(`Expired ${result.modifiedCount} rights requests`);
    }

    return result.modifiedCount;
  }

  /**
   * Check if content has valid rights
   */
  async hasValidRights(ugcId: string, rightsType?: 'display' | 'repost' | 'commercial' | 'all'): Promise<boolean> {
    const content = await UGCContent.findById(ugcId);
    if (!content || content.rightsStatus !== 'granted') {
      return false;
    }

    if (rightsType) {
      const rights = await UGCRights.findOne({
        ugcId,
        status: 'approved',
        $or: [
          { rightsType: rightsType },
          { rightsType: 'all' }
        ]
      });

      if (!rights) {
        return false;
      }

      // Check expiration
      if (rights.expiresAt && rights.expiresAt < new Date()) {
        return false;
      }
    }

    return true;
  }

  /**
   * Revoke rights
   */
  async revokeRights(rightsId: string, revokedBy: string, reason?: string): Promise<IUGCRights> {
    const rights = await UGCRights.findById(rightsId);
    if (!rights) {
      throw new Error('Rights request not found');
    }

    rights.status = 'denied';
    rights.respondedBy = revokedBy;
    rights.respondedAt = new Date();
    rights.notes = reason || 'Rights revoked';

    await rights.save();

    // Update content rights status
    const content = await UGCContent.findById(rights.ugcId);
    if (content) {
      // Check if there are other valid rights
      const otherValidRights = await UGCRights.findOne({
        ugcId: rights.ugcId,
        _id: { $ne: rightsId },
        status: 'approved'
      });

      content.rightsStatus = otherValidRights ? 'granted' : 'denied';
      await content.save();
    }

    logger.info(`Rights revoked for request ${rightsId}`, { revokedBy, reason });

    return rights;
  }
}

export const rightsService = new RightsService();
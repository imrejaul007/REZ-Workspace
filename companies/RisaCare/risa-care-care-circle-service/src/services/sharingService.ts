import { v4 as uuidv4 } from 'uuid';
import { SharedItem } from '../models/SharedItem';
import { circleService } from './circleService';
import logger from '../utils/logger';

export interface ShareVisitDto {
  circleId: string;
  sharedBy: string;
  visitId: string;
  visitSummary: string;
  sharedWith?: string[];
  permissions?: {
    canView?: boolean;
    canDownload?: boolean;
    canShare?: boolean;
    canComment?: boolean;
  };
  expiresAt?: Date;
  notes?: string;
}

export interface ShareRecordDto {
  circleId: string;
  sharedBy: string;
  recordId: string;
  recordType: 'report' | 'vitals' | 'medication';
  recordSummary: string;
  sharedWith?: string[];
  permissions?: {
    canView?: boolean;
    canDownload?: boolean;
    canShare?: boolean;
    canComment?: boolean;
  };
  expiresAt?: Date;
  notes?: string;
}

export interface ShareMedicationDto {
  circleId: string;
  sharedBy: string;
  medicationId: string;
  medicationSummary: string;
  sharedWith?: string[];
  notes?: string;
}

export class SharingService {
  /**
   * Share a visit with care circle
   */
  async shareVisit(dto: ShareVisitDto): Promise<ISharedItem> {
    try {
      logger.info('Sharing visit with circle', { circleId: dto.circleId, visitId: dto.visitId });

      // Check circle permissions
      const canShare = await circleService.checkPermission(dto.circleId, dto.sharedBy, 'shareRecords');
      if (!canShare) {
        throw new Error('User does not have permission to share records');
      }

      // Get all active members if no specific members provided
      let sharedWith = dto.sharedWith;
      if (!sharedWith || sharedWith.length === 0) {
        const members = await circleService.getMembers(dto.circleId);
        sharedWith = members
          .filter(m => m.permissions.viewHealthRecords && m.profileId !== dto.sharedBy)
          .map(m => m.profileId);
      }

      const sharedItem = new SharedItem({
        id: uuidv4(),
        circleId: dto.circleId,
        sharedBy: dto.sharedBy,
        sharedWith,
        itemType: 'visit',
        itemId: dto.visitId,
        itemSummary: dto.visitSummary,
        sharedAt: new Date(),
        expiresAt: dto.expiresAt,
        permissions: {
          canView: dto.permissions?.canView ?? true,
          canDownload: dto.permissions?.canDownload ?? false,
          canShare: dto.permissions?.canShare ?? false,
          canComment: dto.permissions?.canComment ?? false
        },
        notes: dto.notes
      });

      await sharedItem.save();
      logger.info('Visit shared', { sharedItemId: sharedItem.id, circleId: dto.circleId });

      return sharedItem.toJSON() as ISharedItem;
    } catch (error) {
      logger.error('Failed to share visit', { error, dto });
      throw error;
    }
  }

  /**
   * Share a medical record with care circle
   */
  async shareRecord(dto: ShareRecordDto): Promise<ISharedItem> {
    try {
      logger.info('Sharing record with circle', { circleId: dto.circleId, recordId: dto.recordId });

      // Check circle permissions
      const canShare = await circleService.checkPermission(dto.circleId, dto.sharedBy, 'shareRecords');
      if (!canShare) {
        throw new Error('User does not have permission to share records');
      }

      // Get all active members if no specific members provided
      let sharedWith = dto.sharedWith;
      if (!sharedWith || sharedWith.length === 0) {
        const members = await circleService.getMembers(dto.circleId);
        sharedWith = members
          .filter(m => m.permissions.viewHealthRecords && m.profileId !== dto.sharedBy)
          .map(m => m.profileId);
      }

      const sharedItem = new SharedItem({
        id: uuidv4(),
        circleId: dto.circleId,
        sharedBy: dto.sharedBy,
        sharedWith,
        itemType: dto.recordType,
        itemId: dto.recordId,
        itemSummary: dto.recordSummary,
        sharedAt: new Date(),
        expiresAt: dto.expiresAt,
        permissions: {
          canView: dto.permissions?.canView ?? true,
          canDownload: dto.permissions?.canDownload ?? false,
          canShare: dto.permissions?.canShare ?? false,
          canComment: dto.permissions?.canComment ?? false
        },
        notes: dto.notes
      });

      await sharedItem.save();
      logger.info('Record shared', { sharedItemId: sharedItem.id, circleId: dto.circleId });

      return sharedItem.toJSON() as ISharedItem;
    } catch (error) {
      logger.error('Failed to share record', { error, dto });
      throw error;
    }
  }

  /**
   * Share medication info with care circle
   */
  async shareMedication(dto: ShareMedicationDto): Promise<ISharedItem> {
    try {
      logger.info('Sharing medication with circle', { circleId: dto.circleId, medicationId: dto.medicationId });

      // Check circle permissions
      const canShare = await circleService.checkPermission(dto.circleId, dto.sharedBy, 'shareRecords');
      if (!canShare) {
        throw new Error('User does not have permission to share records');
      }

      // Get members who can view medications
      const members = await circleService.getMembers(dto.circleId);
      const sharedWith = dto.sharedWith || members
        .filter(m => m.permissions.viewMedications && m.profileId !== dto.sharedBy)
        .map(m => m.profileId);

      const sharedItem = new SharedItem({
        id: uuidv4(),
        circleId: dto.circleId,
        sharedBy: dto.sharedBy,
        sharedWith,
        itemType: 'medication',
        itemId: dto.medicationId,
        itemSummary: dto.medicationSummary,
        sharedAt: new Date(),
        permissions: {
          canView: true,
          canDownload: false,
          canShare: false,
          canComment: true
        },
        notes: dto.notes
      });

      await sharedItem.save();
      logger.info('Medication shared', { sharedItemId: sharedItem.id, circleId: dto.circleId });

      return sharedItem.toJSON() as ISharedItem;
    } catch (error) {
      logger.error('Failed to share medication', { error, dto });
      throw error;
    }
  }

  /**
   * Get shared items for a circle
   */
  async getSharedItems(
    circleId: string,
    options: { profileId?: string; itemType?: string; limit?: number; offset?: number } = {}
  ): Promise<{ items: ISharedItem[]; total: number }> {
    try {
      logger.info('Fetching shared items', { circleId, options });

      const query: Record<string, unknown> = { circleId };

      // Filter by specific member if provided
      if (options.profileId) {
        query.sharedWith = options.profileId;
      }

      // Filter by item type
      if (options.itemType) {
        query.itemType = options.itemType;
      }

      // Expire check
      query.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ];

      const limit = options.limit || 20;
      const offset = options.offset || 0;

      const [items, total] = await Promise.all([
        SharedItem.find(query)
          .sort({ sharedAt: -1 })
          .skip(offset)
          .limit(limit)
          .lean(),
        SharedItem.countDocuments(query)
      ]);

      return { items: items as ISharedItem[], total };
    } catch (error) {
      logger.error('Failed to fetch shared items', { error, circleId });
      throw error;
    }
  }

  /**
   * Track access to shared item
   */
  async trackAccess(sharedItemId: string, accessedBy: string): Promise<void> {
    try {
      await SharedItem.findOneAndUpdate(
        { id: sharedItemId, sharedWith: accessedBy },
        {
          $inc: { accessCount: 1 },
          $set: { lastAccessedAt: new Date() }
        }
      );
    } catch (error) {
      logger.error('Failed to track access', { error, sharedItemId });
    }
  }

  /**
   * Revoke sharing
   */
  async revokeSharing(sharedItemId: string, revokedBy: string): Promise<boolean> {
    try {
      const item = await SharedItem.findOne({ id: sharedItemId });
      if (!item) return false;

      // Only sharer can revoke
      if (item.sharedBy !== revokedBy) {
        throw new Error('Only the original sharer can revoke sharing');
      }

      await SharedItem.deleteOne({ id: sharedItemId });
      logger.info('Sharing revoked', { sharedItemId, revokedBy });

      return true;
    } catch (error) {
      logger.error('Failed to revoke sharing', { error, sharedItemId });
      throw error;
    }
  }
}

export interface ISharedItem {
  id: string;
  circleId: string;
  sharedBy: string;
  sharedWith: string[];
  itemType: 'visit' | 'medication' | 'record' | 'report' | 'vitals';
  itemId: string;
  itemSummary: string;
  sharedAt: Date;
  expiresAt?: Date;
  accessCount: number;
  lastAccessedAt?: Date;
  permissions: {
    canView: boolean;
    canDownload: boolean;
    canShare: boolean;
    canComment: boolean;
  };
  notes?: string;
}

export const sharingService = new SharingService();

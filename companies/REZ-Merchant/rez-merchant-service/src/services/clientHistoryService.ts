import mongoose, { Types } from 'mongoose';
import { ClientHistory, IClientHistory, IVisit, IPreferences } from '../models/ClientHistory';
import { logger } from '../config/logger';

export interface VisitInput {
  date: Date;
  service: string;
  staff: string;
  amount: number;
  rating?: number;
  notes?: string;
}

export interface PreferencesInput {
  preferredStaff?: string[];
  preferredTimes?: string[];
  notes?: string;
  allergies?: string[];
  sensitiveInfo?: string[];
}

export class ClientHistoryService {
  /**
   * Get client history by client ID
   */
  async getHistory(clientId: string, storeId?: string): Promise<IClientHistory | null> {
    const query: mongoose.FilterQuery<IClientHistory> = {
      clientId: new Types.ObjectId(clientId),
    };

    if (storeId) {
      query.storeId = new Types.ObjectId(storeId);
    }

    const history = await ClientHistory.findOne(query).lean().exec();
    return history as IClientHistory | null;
  }

  /**
   * Add a visit to client history
   */
  async addVisit(clientId: string, storeId: string, visit: VisitInput): Promise<IClientHistory> {
    const visitData: IVisit = {
      date: visit.date,
      service: visit.service,
      staff: visit.staff,
      amount: visit.amount,
      rating: visit.rating,
      notes: visit.notes,
    };

    const filter = {
      clientId: new Types.ObjectId(clientId),
      storeId: new Types.ObjectId(storeId),
    };

    let history = await ClientHistory.findOne(filter).exec();

    if (!history) {
      // Create new history record
      history = new ClientHistory({
        clientId: new Types.ObjectId(clientId),
        storeId: new Types.ObjectId(storeId),
        visits: [visitData],
        preferences: {
          preferredStaff: [],
          preferredTimes: [],
          notes: '',
          allergies: [],
          sensitiveInfo: [],
        },
        tags: [],
        totalSpent: 0,
        visitCount: 0,
      });
    } else {
      // Add visit to existing history
      history.visits.push(visitData);
    }

    await history.save();

    logger.info('[ClientHistory] Visit added', {
      clientId,
      storeId,
      service: visit.service,
      amount: visit.amount,
    });

    return history;
  }

  /**
   * Update client preferences
   */
  async updatePreferences(clientId: string, preferences: PreferencesInput): Promise<void> {
    const updateData: Record<string, unknown> = {};

    if (preferences.preferredStaff !== undefined) {
      updateData['preferences.preferredStaff'] = preferences.preferredStaff.map((id) => new Types.ObjectId(id));
    }

    if (preferences.preferredTimes !== undefined) {
      updateData['preferences.preferredTimes'] = preferences.preferredTimes;
    }

    if (preferences.notes !== undefined) {
      updateData['preferences.notes'] = preferences.notes;
    }

    if (preferences.allergies !== undefined) {
      updateData['preferences.allergies'] = preferences.allergies;
    }

    if (preferences.sensitiveInfo !== undefined) {
      updateData['preferences.sensitiveInfo'] = preferences.sensitiveInfo;
    }

    await ClientHistory.findOneAndUpdate(
      { clientId: new Types.ObjectId(clientId) },
      { $set: updateData },
      { new: true }
    ).exec();

    logger.info('[ClientHistory] Preferences updated', {
      clientId,
      updatedFields: Object.keys(updateData),
    });
  }

  /**
   * Add a tag to client history
   */
  async addTag(clientId: string, tag: string, storeId?: string): Promise<void> {
    const normalizedTag = tag.toLowerCase().trim();

    const query: mongoose.FilterQuery<IClientHistory> = {
      clientId: new Types.ObjectId(clientId),
    };

    if (storeId) {
      query.storeId = new Types.ObjectId(storeId);
    }

    await ClientHistory.findOneAndUpdate(
      query,
      {
        $addToSet: { tags: normalizedTag },
      },
      { new: true }
    ).exec();

    logger.info('[ClientHistory] Tag added', {
      clientId,
      tag: normalizedTag,
    });
  }

  /**
   * Remove a tag from client history
   */
  async removeTag(clientId: string, tag: string, storeId?: string): Promise<void> {
    const normalizedTag = tag.toLowerCase().trim();

    const query: mongoose.FilterQuery<IClientHistory> = {
      clientId: new Types.ObjectId(clientId),
    };

    if (storeId) {
      query.storeId = new Types.ObjectId(storeId);
    }

    await ClientHistory.findOneAndUpdate(
      query,
      {
        $pull: { tags: normalizedTag },
      },
      { new: true }
    ).exec();

    logger.info('[ClientHistory] Tag removed', {
      clientId,
      tag: normalizedTag,
    });
  }

  /**
   * Get top clients by total spent for a store
   */
  async getTopClients(storeId: string, limit: number = 10): Promise<IClientHistory[]> {
    const clients = await ClientHistory.find({
      storeId: new Types.ObjectId(storeId),
    })
      .sort({ totalSpent: -1 })
      .limit(limit)
      .lean()
      .exec();

    return clients as IClientHistory[];
  }

  /**
   * Get top clients by visit count for a store
   */
  async getFrequentClients(storeId: string, limit: number = 10): Promise<IClientHistory[]> {
    const clients = await ClientHistory.find({
      storeId: new Types.ObjectId(storeId),
    })
      .sort({ visitCount: -1 })
      .limit(limit)
      .lean()
      .exec();

    return clients as IClientHistory[];
  }

  /**
   * Get clients with low ratings (potential issues)
   */
  async getLowRatedClients(storeId: string, maxRating: number = 3): Promise<IClientHistory[]> {
    const clients = await ClientHistory.find({
      storeId: new Types.ObjectId(storeId),
      avgRating: { $lte: maxRating, $exists: true },
    })
      .sort({ avgRating: 1 })
      .lean()
      .exec();

    return clients as IClientHistory[];
  }

  /**
   * Get clients by tag
   */
  async getClientsByTag(storeId: string, tag: string): Promise<IClientHistory[]> {
    const normalizedTag = tag.toLowerCase().trim();

    const clients = await ClientHistory.find({
      storeId: new Types.ObjectId(storeId),
      tags: normalizedTag,
    }).lean().exec();

    return clients as IClientHistory[];
  }
}

// Factory function
export function createClientHistoryService(): ClientHistoryService {
  return new ClientHistoryService();
}

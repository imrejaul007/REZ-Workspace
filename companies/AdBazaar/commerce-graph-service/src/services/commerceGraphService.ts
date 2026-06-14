/**
 * Commerce Graph Service - Real implementation
 */

import mongoose, { Schema, model, Document } from 'mongoose';

// ============================================================================
// MODELS
// ============================================================================

export interface ICommerceOrder extends Document {
  orderId: string;
  userId: string;
  merchantId: string;
  total: number;
  city: string;
  categories: string[];
  utmSource?: string;
  createdAt: Date;
}

const commerceOrderSchema = new Schema<ICommerceOrder>({
  orderId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  merchantId: String,
  total: Number,
  city: String,
  categories: [String],
  utmSource: String,
  createdAt: { type: Date, default: Date.now, index: true },
});

export const CommerceOrder = model<ICommerceOrder>('CommerceOrder', commerceOrderSchema);

export interface IUserProfile extends Document {
  userId: string;
  city: string;
  avgOrderValue: number;
  totalOrders: number;
  totalSpend: number;
  topCategories: string[];
  repeatRate: number;
  adImpressions: number;
  adClicks: number;
  updatedAt: Date;
}

const userProfileSchema = new Schema<IUserProfile>({
  userId: { type: String, required: true, unique: true, index: true },
  city: String,
  avgOrderValue: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  totalSpend: { type: Number, default: 0 },
  topCategories: [String],
  repeatRate: { type: Number, default: 0 },
  adImpressions: { type: Number, default: 0 },
  adClicks: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

export const UserProfile = model<IUserProfile>('UserProfile', userProfileSchema);

export interface ICategoryGraph extends Document {
  category: string;
  totalOrders: number;
  totalGMV: number;
  avgOrderValue: number;
  avgCTR: number;
}

const categoryGraphSchema = new Schema<ICategoryGraph>({
  category: { type: String, required: true, unique: true, index: true },
  totalOrders: { type: Number, default: 0 },
  totalGMV: { type: Number, default: 0 },
  avgOrderValue: { type: Number, default: 0 },
  avgCTR: { type: Number, default: 0 },
});

export const CategoryGraph = model<ICategoryGraph>('CategoryGraph', categoryGraphSchema);

// ============================================================================
// SERVICE
// ============================================================================

export class CommerceGraphService {
  async getUserProfile(userId: string): Promise<IUserProfile | null> {
    return UserProfile.findOne({ userId });
  }

  async getTopCategories(limit: number): Promise<ICategoryGraph[]> {
    return CategoryGraph.find().sort({ totalGMV: -1 }).limit(limit);
  }

  async getUsersByCategory(category: string): Promise<string[]> {
    const orders = await CommerceOrder.find({ categories: category }).distinct('userId');
    return orders;
  }

  async getLookalikes(userId: string, limit: number): Promise<string[]> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return [];

    const lookalikes = await UserProfile.find({
      userId: { $ne: userId },
      city: profile.city,
      topCategories: { $in: profile.topCategories?.slice(0, 3) || [] },
    }).limit(limit);

    return lookalikes.map(l => l.userId);
  }

  async predictUserMetrics(userId: string): Promise<{
    predictedLTV: number;
    churnRisk: string;
    nextOrderProbability: number;
  }> {
    const profile = await this.getUserProfile(userId);

    if (!profile) {
      return { predictedLTV: 0, churnRisk: 'high', nextOrderProbability: 0.1 };
    }

    const monthlyOrders = profile.totalOrders / 6;
    const predictedLTV = profile.avgOrderValue * monthlyOrders * 12;

    let churnRisk = 'low';
    if ((profile.repeatRate || 0) < 0.3) churnRisk = 'high';
    else if ((profile.repeatRate || 0) < 0.5) churnRisk = 'medium';

    return {
      predictedLTV,
      churnRisk,
      nextOrderProbability: Math.min(0.9, (profile.repeatRate || 0) + 0.1),
    };
  }

  async getCrossSellOpportunities(userId: string, limit: number): Promise<
    Array<{ category: string; productName: string; score: number }>
  > {
    const profile = await this.getUserProfile(userId);
    if (!profile) return [];

    const categories = await CategoryGraph.find({
      category: { $nin: profile.topCategories || [] },
    }).sort({ totalGMV: -1 }).limit(limit);

    return categories.map(cat => ({
      category: cat.category,
      productName: `${cat.category} products`,
      score: cat.totalGMV / 10000,
    }));
  }

  async getAdAttributedOrders(params: {
    campaignId?: string;
    source?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ICommerceOrder[]> {
    const query: Record<string, unknown> = {};
    if (params.utmSource) query.utmSource = params.utmSource;
    if (params.startDate || params.endDate) {
      query.createdAt = {};
      if (params.startDate) (query.createdAt as Record<string, Date>).$gte = params.startDate;
      if (params.endDate) (query.createdAt as Record<string, Date>).$lte = params.endDate;
    }
    return CommerceOrder.find(query).sort({ createdAt: -1 });
  }
}

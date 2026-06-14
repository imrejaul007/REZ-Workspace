/**
 * Salon Customer 360 Service
 *
 * Extends Customer360Service with salon-specific customer insights:
 * - Service history (haircuts, treatments, etc.)
 * - Stylist preferences
 * - Treatment history and reactions
 * - Product recommendations based on hair/skin type
 * - Loyalty points for beauty services
 * - Shares base customer profile with other industries
 */

import mongoose, { Types } from 'mongoose';
import { CustomerMeta } from '../models/CustomerMeta';
import { StorePayment } from '../models/StorePayment';
import { Store } from '../models/Store';
import { Order } from '../models/Order';
import { LoyaltyTier } from '../models/LoyaltyTier';
import { CoinTransaction } from '../models/CoinTransaction';
import { logger } from '../config/logger';
import {
  Customer360Service,
  customer360Service,
  type CustomerProfile,
  type TransactionSummary,
  type LoyaltySummary,
  type EngagementMetrics,
  type RiskMetrics,
  type Customer360,
} from './customer360Service';

// ── Salon-Specific Types ─────────────────────────────────────────────────────────

export interface StylistPreference {
  stylistId: string;
  stylistName: string;
  visitCount: number;
  lastVisit: Date;
  rating?: number;
  notes?: string;
}

export interface ServiceHistory {
  serviceId: string;
  serviceName: string;
  category: string;
  lastPerformed: Date;
  totalVisits: number;
  totalSpent: number;
  averageRating?: number;
  lastStylistId?: string;
  lastStylistName?: string;
}

export interface TreatmentReaction {
  treatmentId: string;
  treatmentName: string;
  reaction: 'positive' | 'neutral' | 'negative';
  notes?: string;
  date: Date;
}

export interface HairSkinProfile {
  hairType?: string;
  hairCondition?: string;
  scalpCondition?: string;
  skinType?: string;
  skinConcerns?: string[];
  allergies?: string[];
  sensitivities?: string[];
}

export interface ProductRecommendation {
  productId: string;
  productName: string;
  category: string;
  reason: string;
  matchScore: number;
}

export interface SalonCustomer360 extends Customer360 {
  // Salon-specific data
  stylistPreferences: StylistPreference[];
  serviceHistory: ServiceHistory[];
  treatmentReactions: TreatmentReaction[];
  hairSkinProfile: HairSkinProfile;
  productRecommendations: ProductRecommendation[];
  preferredServices: string[];
  lastHaircut?: Date;
  lastColor?: Date;
  lastNailService?: Date;
  subscriptionStatus?: 'active' | 'inactive' | 'none';
}

// ── Service Class ─────────────────────────────────────────────────────────────────

export class SalonCustomer360Service {
  private baseService: Customer360Service;

  constructor() {
    this.baseService = customer360Service;
  }

  /**
   * Get complete Salon Customer 360 view
   */
  async getSalonCustomer360(customerId: string, merchantId: string): Promise<SalonCustomer360> {
    const [
      base360,
      stylistPreferences,
      serviceHistory,
      treatmentReactions,
      hairSkinProfile,
      productRecommendations,
      preferredServices,
    ] = await Promise.all([
      this.baseService.getCustomer360(customerId, merchantId),
      this.getStylistPreferences(customerId, merchantId),
      this.getServiceHistory(customerId, merchantId),
      this.getTreatmentReactions(customerId, merchantId),
      this.getHairSkinProfile(customerId, merchantId),
      this.getProductRecommendations(customerId, merchantId),
      this.getPreferredServices(customerId, merchantId),
    ]);

    const serviceDates = this.extractServiceDates(serviceHistory);

    return {
      ...base360,
      stylistPreferences,
      serviceHistory,
      treatmentReactions,
      hairSkinProfile,
      productRecommendations,
      preferredServices,
      lastHaircut: serviceDates.lastHaircut,
      lastColor: serviceDates.lastColor,
      lastNailService: serviceDates.lastNailService,
      subscriptionStatus: await this.getSubscriptionStatus(customerId, merchantId),
    };
  }

  /**
   * Get stylist preferences based on visit history
   */
  async getStylistPreferences(customerId: string, merchantId: string): Promise<StylistPreference[]> {
    const mid = new mongoose.Types.ObjectId(merchantId);
    const stores = await Store.find({ merchantId: mid }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);

    // Aggregate visits by stylist from orders/payments
    const visitAggregation = await Order.aggregate([
      {
        $match: {
          userId: customerId,
          store: { $in: storeIds },
          stylistId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$stylistId',
          stylistName: { $first: '$stylistName' },
          visitCount: { $sum: 1 },
          lastVisit: { $max: '$createdAt' },
          averageRating: { $avg: '$rating' },
          notes: { $last: '$stylistNotes' },
        },
      },
      { $sort: { visitCount: -1 } },
      { $limit: 5 },
    ]);

    return visitAggregation.map((v) => ({
      stylistId: v._id.toString(),
      stylistName: v.stylistName || 'Unknown Stylist',
      visitCount: v.visitCount,
      lastVisit: v.lastVisit,
      rating: v.averageRating,
      notes: v.notes,
    }));
  }

  /**
   * Get service history for salon services
   */
  async getServiceHistory(customerId: string, merchantId: string): Promise<ServiceHistory[]> {
    const mid = new mongoose.Types.ObjectId(merchantId);
    const stores = await Store.find({ merchantId: mid }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);

    // Define salon service categories
    const haircutCategories = ['haircut', 'hair_cut', 'hair', 'styling'];
    const colorCategories = ['color', 'colour', 'dye', 'highlight', 'balayage'];
    const nailCategories = ['nail', 'manicure', 'pedicure', 'nail_art'];

    const aggregation = await Order.aggregate([
      {
        $match: {
          userId: customerId,
          store: { $in: storeIds },
          status: { $in: ['delivered', 'completed', 'paid'] },
        },
      },
      { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            serviceId: '$items.serviceId',
            serviceName: '$items.name',
            category: '$items.category',
          },
          totalVisits: { $sum: 1 },
          totalSpent: { $sum: { $ifNull: ['$items.subtotal', 0] } },
          lastPerformed: { $max: '$createdAt' },
          lastStylistId: { $last: '$stylistId' },
          lastStylistName: { $last: '$stylistName' },
          averageRating: { $avg: '$rating' },
        },
      },
      { $sort: { lastPerformed: -1 } },
    ]);

    return aggregation.map((a) => {
      const categoryLower = (a._id.category || '').toLowerCase();
      let category = 'other';

      if (haircutCategories.some(c => categoryLower.includes(c))) category = 'haircut';
      else if (colorCategories.some(c => categoryLower.includes(c))) category = 'color';
      else if (nailCategories.some(c => categoryLower.includes(c))) category = 'nails';
      else category = a._id.category || 'other';

      return {
        serviceId: a._id.serviceId?.toString() || 'unknown',
        serviceName: a._id.serviceName || 'Unknown Service',
        category,
        lastPerformed: a.lastPerformed,
        totalVisits: a.totalVisits,
        totalSpent: a.totalSpent,
        averageRating: a.averageRating,
        lastStylistId: a.lastStylistId?.toString(),
        lastStylistName: a.lastStylistName,
      };
    });
  }

  /**
   * Get treatment reactions from customer feedback
   */
  async getTreatmentReactions(customerId: string, merchantId: string): Promise<TreatmentReaction[]> {
    const mid = new mongoose.Types.ObjectId(merchantId);

    // Get reactions from customer meta or feedback
    const meta = await CustomerMeta.findOne({ merchantId: mid, userId: customerId }).lean();

    const reactions = (meta as unknown)?.treatmentReactions || [];

    return reactions.map((r) => ({
      treatmentId: r.treatmentId || r.id || 'unknown',
      treatmentName: r.treatmentName || r.name || 'Unknown Treatment',
      reaction: r.reaction || 'neutral',
      notes: r.notes,
      date: r.date ? new Date(r.date) : new Date(),
    }));
  }

  /**
   * Get hair and skin profile from customer meta
   */
  async getHairSkinProfile(customerId: string, merchantId: string): Promise<HairSkinProfile> {
    const mid = new mongoose.Types.ObjectId(merchantId);
    const meta = await CustomerMeta.findOne({ merchantId: mid, userId: customerId }).lean();

    if (!meta) {
      return {
        hairType: undefined,
        hairCondition: undefined,
        scalpCondition: undefined,
        skinType: undefined,
        skinConcerns: [],
        allergies: [],
        sensitivities: [],
      };
    }

    const healthProfile = meta.healthProfile || {};
    const salonProfile = (meta as unknown).salonProfile || {};

    return {
      hairType: salonProfile.hairType || healthProfile.skinHairType || undefined,
      hairCondition: salonProfile.hairCondition,
      scalpCondition: salonProfile.scalpCondition,
      skinType: salonProfile.skinType || healthProfile.skinHairType || undefined,
      skinConcerns: salonProfile.skinConcerns || [],
      allergies: (healthProfile.allergies || '').split(',').filter(Boolean),
      sensitivities: salonProfile.sensitivities || [],
    };
  }

  /**
   * Get product recommendations based on service history and preferences
   */
  async getProductRecommendations(customerId: string, merchantId: string): Promise<ProductRecommendation[]> {
    const hairSkinProfile = await this.getHairSkinProfile(customerId, merchantId);
    const serviceHistory = await this.getServiceHistory(customerId, merchantId);
    const recommendations: ProductRecommendation[] = [];

    // Product recommendation rules based on hair/skin type
    const productMap: Record<string, ProductRecommendation> = {};

    if (hairSkinProfile.hairType) {
      const hairType = hairSkinProfile.hairType.toLowerCase();
      if (hairType.includes('dry')) {
        productMap['moisturizing_shampoo'] = {
          productId: 'moisturizing_shampoo',
          productName: 'Moisturizing Shampoo',
          category: 'Hair Care',
          reason: 'Recommended for dry hair',
          matchScore: 0.9,
        };
      }
      if (hairType.includes('oily')) {
        productMap['clarifying_shampoo'] = {
          productId: 'clarifying_shampoo',
          productName: 'Clarifying Shampoo',
          category: 'Hair Care',
          reason: 'Recommended for oily hair',
          matchScore: 0.9,
        };
      }
      if (hairType.includes('color') || hairType.includes('treated')) {
        productMap['color_protect'] = {
          productId: 'color_protect',
          productName: 'Color Protect Shampoo',
          category: 'Hair Care',
          reason: 'Recommended for color-treated hair',
          matchScore: 0.95,
        };
      }
    }

    if (hairSkinProfile.skinType) {
      const skinType = hairSkinProfile.skinType.toLowerCase();
      if (skinType.includes('dry')) {
        productMap['hydrating_lotion'] = {
          productId: 'hydrating_lotion',
          productName: 'Hydrating Face Lotion',
          category: 'Skin Care',
          reason: 'Recommended for dry skin',
          matchScore: 0.85,
        };
      }
      if (skinType.includes('sensitive')) {
        productMap['sensitive_lotion'] = {
          productId: 'sensitive_lotion',
          productName: 'Gentle Face Lotion',
          category: 'Skin Care',
          reason: 'Recommended for sensitive skin',
          matchScore: 0.9,
        };
      }
    }

    // Add service-based recommendations
    const hasRecentColor = serviceHistory.some(s => s.category === 'color' && this.isRecent(s.lastPerformed));
    if (hasRecentColor) {
      productMap['color_maintenance'] = {
        productId: 'color_maintenance',
        productName: 'Color Maintenance Serum',
        category: 'Hair Care',
        reason: 'Based on recent color service',
        matchScore: 0.8,
      };
    }

    return Object.values(productMap).slice(0, 5);
  }

  /**
   * Get preferred services based on history
   */
  async getPreferredServices(customerId: string, merchantId: string): Promise<string[]> {
    const serviceHistory = await this.getServiceHistory(customerId, merchantId);

    // Sort by visit frequency and return top services
    const serviceFrequency = new Map<string, number>();
    for (const service of serviceHistory) {
      serviceFrequency.set(service.serviceName, service.totalVisits);
    }

    return Array.from(serviceFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
  }

  /**
   * Get subscription status (simplified)
   */
  private async getSubscriptionStatus(customerId: string, merchantId: string): Promise<'active' | 'inactive' | 'none'> {
    const mid = new mongoose.Types.ObjectId(merchantId);
    const stores = await Store.find({ merchantId: mid }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);

    // Check for active subscriptions in orders
    const subscriptionOrder = await Order.findOne({
      userId: customerId,
      store: { $in: storeIds },
      subscriptionId: { $exists: true, $ne: null },
      status: 'active',
    }).lean();

    if (subscriptionOrder) return 'active';
    return 'none';
  }

  /**
   * Extract service dates from history
   */
  private extractServiceDates(history: ServiceHistory[]): {
    lastHaircut?: Date;
    lastColor?: Date;
    lastNailService?: Date;
  } {
    const result: { lastHaircut?: Date; lastColor?: Date; lastNailService?: Date } = {};

    for (const service of history) {
      if (service.category === 'haircut' && !result.lastHaircut) {
        result.lastHaircut = service.lastPerformed;
      }
      if (service.category === 'color' && !result.lastColor) {
        result.lastColor = service.lastPerformed;
      }
      if (service.category === 'nails' && !result.lastNailService) {
        result.lastNailService = service.lastPerformed;
      }
    }

    return result;
  }

  /**
   * Check if date is within last 90 days
   */
  private isRecent(date: Date): boolean {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return new Date(date) > ninetyDaysAgo;
  }

  /**
   * Get customer salon score (loyalty metric)
   */
  async getSalonScore(customerId: string, merchantId: string): Promise<number> {
    const history = await this.getServiceHistory(customerId, merchantId);
    const stylistPrefs = await this.getStylistPreferences(customerId, merchantId);
    const profile = await this.getHairSkinProfile(customerId, merchantId);

    let score = 50; // Base score

    // Service frequency bonus (up to 20 points)
    const totalVisits = history.reduce((sum, s) => sum + s.totalVisits, 0);
    if (totalVisits >= 20) score += 20;
    else if (totalVisits >= 10) score += 15;
    else if (totalVisits >= 5) score += 10;
    else if (totalVisits >= 1) score += 5;

    // Stylist loyalty bonus (up to 15 points)
    const hasPreferredStylist = stylistPrefs.length > 0;
    if (hasPreferredStylist) score += 15;

    // Profile completeness bonus (up to 10 points)
    const profileFields = [profile.hairType, profile.skinType, profile.allergies.length > 0];
    const completedFields = profileFields.filter(Boolean).length;
    score += Math.round((completedFields / profileFields.length) * 10);

    // Variety bonus (up to 5 points)
    const uniqueServices = new Set(history.map(s => s.category)).size;
    if (uniqueServices >= 3) score += 5;
    else if (uniqueServices >= 2) score += 3;

    return Math.min(100, score);
  }
}

// ── Singleton Export ─────────────────────────────────────────────────────────────

export const salonCustomer360Service = new SalonCustomer360Service();
export default salonCustomer360Service;

import mongoose, { Types } from 'mongoose';
import { Offer } from '../models/Offer';
import { Store } from '../models/Store';

/**
 * Offer Optimization Types
 */
export interface OfferOptimization {
  bestOffer: OfferOptimizationResult | null;
  savings: number;
  discountType: 'percentage' | 'flat' | 'bogo' | 'none';
  finalAmount: number;
  message: string;
}

export interface OfferOptimizationResult {
  id: string;
  title: string;
  description: string;
  type: string;
  discountType: 'percentage' | 'flat' | 'bogo';
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderValue?: number;
  couponCode?: string;
  storeId: string;
  storeName: string;
  validUntil: Date;
}

export interface EligibilityCheck {
  eligible: boolean;
  reason?: string;
}

/**
 * Offer Optimizer Service
 * Finds the best available offer for a given user and cart total
 * for ReZ Loyalty auto-apply best offer feature
 */
export class OfferOptimizer {
  /**
   * Find the best offer for a given user, cart total, and merchant
   * Evaluates all eligible offers and returns the one with maximum savings
   */
  static async findBestOffer(
    userId: string | null,
    cartTotal: number,
    merchantId: string
  ): Promise<OfferOptimization> {
    // Validate inputs
    if (cartTotal <= 0) {
      return {
        bestOffer: null,
        savings: 0,
        discountType: 'none',
        finalAmount: cartTotal,
        message: 'Invalid cart total'
      };
    }

    // Get merchant's stores
    const stores = await Store.find({ merchantId: new Types.ObjectId(merchantId) })
      .select('_id name')
      .lean();

    if (stores.length === 0) {
      return {
        bestOffer: null,
        savings: 0,
        discountType: 'none',
        finalAmount: cartTotal,
        message: 'No stores found for merchant'
      };
    }

    const storeIds = stores.map((s) => s._id);

    // Get all eligible offers for merchant's stores
    // RC-1 FIX: Read-only proxy - offer schema lives in rez-backend
    const now = new Date();
    const offers = await Offer.find({
      'store.id': { $in: storeIds },
      'validity.isActive': true,
      'validity.endDate': { $gte: now },
      $or: [
        { 'eligibility.userId': { $exists: false } },
        { 'eligibility.userId': null },
        { 'eligibility.userId': userId ? new Types.ObjectId(userId) : null }
      ]
    }).lean();

    if (offers.length === 0) {
      return {
        bestOffer: null,
        savings: 0,
        discountType: 'none',
        finalAmount: cartTotal,
        message: 'No offers available'
      };
    }

    let best: OfferOptimization = {
      bestOffer: null,
      savings: 0,
      discountType: 'none',
      finalAmount: cartTotal,
      message: 'No offers available'
    };

    for (const offer of offers) {
      const offerDoc = offer as unknown;

      // Check eligibility
      const eligibility = this.checkEligibility(offerDoc, userId, cartTotal);
      if (!eligibility.eligible) {
        continue;
      }

      // Calculate savings
      const savings = this.calculateSavings(cartTotal, offerDoc);
      const finalAmount = Math.max(0, cartTotal - savings);

      if (savings > best.savings) {
        const store = stores.find((s) => s._id.toString() === (offerDoc.store?.id?.toString() || offerDoc.store?.toString()));

        best = {
          bestOffer: {
            id: offerDoc._id.toString(),
            title: offerDoc.title || 'Special Offer',
            description: offerDoc.description || '',
            type: offerDoc.type || 'discount',
            discountType: offerDoc.discountType || 'flat',
            discountValue: offerDoc.discountValue || 0,
            maxDiscountAmount: offerDoc.maxDiscountAmount,
            minOrderValue: offerDoc.minOrderValue,
            couponCode: offerDoc.couponCode,
            storeId: offerDoc.store?.id?.toString() || '',
            storeName: store?.name || '',
            validUntil: offerDoc.validity?.endDate || new Date()
          },
          savings,
          discountType: offerDoc.discountType || 'flat',
          finalAmount,
          message: this.getOfferMessage(offerDoc, savings)
        };
      }
    }

    if (!best.bestOffer) {
      best.message = 'No eligible offers for this order';
    }

    return best;
  }

  /**
   * Check if a user is eligible for an offer
   */
  private static checkEligibility(
    offer,
    userId: string | null,
    cartTotal: number
  ): EligibilityCheck {
    // Check validity dates
    const now = new Date();
    if (offer.validity?.startDate && new Date(offer.validity.startDate) > now) {
      return { eligible: false, reason: 'Offer has not started yet' };
    }
    if (offer.validity?.endDate && new Date(offer.validity.endDate) < now) {
      return { eligible: false, reason: 'Offer has expired' };
    }

    // Check if offer is active
    if (!offer.validity?.isActive) {
      return { eligible: false, reason: 'Offer is not active' };
    }

    // Check minimum order value
    const minOrderValue = offer.minOrderValue || offer.restrictions?.minOrderValue;
    if (minOrderValue && cartTotal < minOrderValue) {
      return { eligible: false, reason: `Minimum order value is ${minOrderValue}` };
    }

    // Check maximum discount amount cap
    const maxDiscount = offer.maxDiscountAmount || offer.restrictions?.maxDiscount;
    if (maxDiscount && offer.discountType === 'percentage') {
      const potentialSavings = (cartTotal * (offer.discountValue || 0)) / 100;
      if (potentialSavings > maxDiscount) {
        // Will be capped, but still eligible
      }
    }

    // Check user-specific eligibility
    const eligibleUserIds = offer.eligibility?.userId;
    if (eligibleUserIds !== undefined && eligibleUserIds !== null) {
      const userIds = Array.isArray(eligibleUserIds) ? eligibleUserIds : [eligibleUserIds];
      if (userId && !userIds.some((id) => id?.toString() === userId)) {
        return { eligible: false, reason: 'Offer not available for this user' };
      }
    }

    // Check customer segments
    const allowedSegments = offer.eligibility?.customerSegments;
    if (allowedSegments && allowedSegments.length > 0) {
      // Would need user profile data to check - for now allow all
    }

    return { eligible: true };
  }

  /**
   * Calculate savings for an offer given the cart total
   */
  private static calculateSavings(cartTotal: number, offer): number {
    const discountType = offer.discountType || 'flat';
    const discountValue = offer.discountValue || 0;
    const maxDiscount = offer.maxDiscountAmount || offer.restrictions?.maxDiscount;

    let savings = 0;

    switch (discountType) {
      case 'percentage':
        savings = (cartTotal * discountValue) / 100;
        // Apply max discount cap if set
        if (maxDiscount && savings > maxDiscount) {
          savings = maxDiscount;
        }
        break;

      case 'flat':
        savings = Math.min(discountValue, cartTotal);
        break;

      case 'bogo':
        // Buy one get one - assume value of cheapest item (simplified)
        // In a real implementation, this would look at cart items
        savings = this.calculateBogoSavings(cartTotal, offer);
        break;

      case 'cashback':
        // Cashback is applied differently - it credits to wallet
        savings = 0;
        break;

      default:
        savings = 0;
    }

    // Ensure savings don't exceed cart total
    return Math.min(savings, cartTotal);
  }

  /**
   * Calculate savings for Buy One Get One offers
   */
  private static calculateBogoSavings(cartTotal: number, offer): number {
    const discountValue = offer.discountValue || 0;

    if (discountValue === 100) {
      // Buy one get one free - value half the cart
      return cartTotal / 2;
    } else if (discountValue === 50) {
      // 50% off second item
      return cartTotal * 0.25; // Approximate for equal items
    } else {
      return (cartTotal * discountValue) / 100;
    }
  }

  /**
   * Generate a user-friendly message for the offer
   */
  private static getOfferMessage(offer, savings: number): string {
    const discountType = offer.discountType || 'flat';
    const discountValue = offer.discountValue || 0;

    switch (discountType) {
      case 'percentage':
        return `Save ${discountValue}% (up to ${offer.maxDiscountAmount || 'no limit'}) with this offer`;

      case 'flat':
        return `Save ${discountValue} with this offer`;

      case 'bogo':
        return `Buy One Get One offer applied - save approximately ${Math.round(savings)}`;

      default:
        return `Special offer applied - save ${Math.round(savings)}`;
    }
  }

  /**
   * Get all eligible offers for a cart (not just the best one)
   */
  static async getEligibleOffers(
    userId: string | null,
    cartTotal: number,
    merchantId: string
  ): Promise<OfferOptimization[]> {
    if (cartTotal <= 0) {
      return [];
    }

    const stores = await Store.find({ merchantId: new Types.ObjectId(merchantId) })
      .select('_id name')
      .lean();

    if (stores.length === 0) {
      return [];
    }

    const storeIds = stores.map((s) => s._id);

    const now = new Date();
    const offers = await Offer.find({
      'store.id': { $in: storeIds },
      'validity.isActive': true,
      'validity.endDate': { $gte: now }
    }).lean();

    const eligibleOffers: OfferOptimization[] = [];

    for (const offer of offers) {
      const offerDoc = offer as unknown;
      const eligibility = this.checkEligibility(offerDoc, userId, cartTotal);

      if (!eligibility.eligible) {
        continue;
      }

      const savings = this.calculateSavings(cartTotal, offerDoc);
      const finalAmount = Math.max(0, cartTotal - savings);
      const store = stores.find((s) => s._id.toString() === (offerDoc.store?.id?.toString() || offerDoc.store?.toString()));

      eligibleOffers.push({
        bestOffer: {
          id: offerDoc._id.toString(),
          title: offerDoc.title || 'Special Offer',
          description: offerDoc.description || '',
          type: offerDoc.type || 'discount',
          discountType: offerDoc.discountType || 'flat',
          discountValue: offerDoc.discountValue || 0,
          maxDiscountAmount: offerDoc.maxDiscountAmount,
          minOrderValue: offerDoc.minOrderValue,
          couponCode: offerDoc.couponCode,
          storeId: offerDoc.store?.id?.toString() || '',
          storeName: store?.name || '',
          validUntil: offerDoc.validity?.endDate || new Date()
        },
        savings,
        discountType: offerDoc.discountType || 'flat',
        finalAmount,
        message: this.getOfferMessage(offerDoc, savings)
      });
    }

    // Sort by savings descending
    return eligibleOffers.sort((a, b) => b.savings - a.savings);
  }
}

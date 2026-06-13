/**
 * Rider Twin Service
 *
 * Core service for managing rider digital twins including:
 * - Rider profile management
 * - Payment methods
 * - Preferences
 * - Addresses
 * - Loyalty programs
 * - Activity tracking
 */

import { v4 as uuidv4 } from 'uuid';
import {
  RiderTwin,
  RiderProfile,
  RiderPayment,
  RiderPreferences,
  RiderAddresses,
  RiderLoyalty,
  RiderActivity,
  RiderFeedback,
  CreateRiderRequest,
  UpdateRiderRequest,
  AddPaymentMethodRequest,
  AddAddressRequest,
  SetPreferencesRequest,
  AddFavoriteRouteRequest,
  RiderListParams,
  PaginatedResponse,
  LoyaltyTier,
  getRiderTwinId,
} from '../models/types';
import { createLogger } from '../utils/logger';

const logger = createLogger('rider-twin-service');

/**
 * Default values for new riders
 */
const DEFAULT_PREFERENCES: RiderPreferences = {
  preferred_vehicle_type: 'economy',
  preferred_payment: 'card',
  smoking_policy: 'no_preference',
  music_preference: 'no_preference',
  air_conditioning: 'no_preference',
  special_assistance: [],
};

const DEFAULT_PAYMENT: RiderPayment = {
  default_payment_method: '',
  saved_cards: [],
  cash_enabled: true,
};

const DEFAULT_ADDRESSES: RiderAddresses = {
  favorites: [],
};

const DEFAULT_LOYALTY: RiderLoyalty = {
  tier: 'basic',
  points_balance: 0,
  lifetime_points: 0,
};

const DEFAULT_ACTIVITY: RiderActivity = {
  total_trips: 0,
  total_spend: 0,
  avg_trip_cost: 0,
  favorite_routes: [],
};

const DEFAULT_FEEDBACK: RiderFeedback = {
  avg_rating: 5.0,
  given_count: 0,
  reports_count: 0,
};

/**
 * Loyalty tier thresholds
 */
const LOYALTY_TIERS: Record<LoyaltyTier, { minPoints: number; multiplier: number }> = {
  basic: { minPoints: 0, multiplier: 1.0 },
  silver: { minPoints: 1000, multiplier: 1.25 },
  gold: { minPoints: 5000, multiplier: 1.5 },
  platinum: { minPoints: 15000, multiplier: 2.0 },
};

/**
 * Rider Twin Service
 */
export class RiderTwinService {
  private riders: Map<string, RiderTwin> = new Map();
  private twinIndex: Map<string, string> = new Map(); // TwinOS ID -> rider_id

  constructor() {
    logger.info('rider_twin_service_initialized');
  }

  /**
   * Create a new rider twin
   */
  async create(data: CreateRiderRequest): Promise<RiderTwin> {
    const riderId = `RID-${uuidv4().substring(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();

    const rider: RiderTwin = {
      rider_id: riderId,
      profile: data.profile,
      payment: {
        ...DEFAULT_PAYMENT,
        ...data.payment,
      },
      preferences: {
        ...DEFAULT_PREFERENCES,
        ...data.preferences,
      },
      addresses: DEFAULT_ADDRESSES,
      loyalty: DEFAULT_LOYALTY,
      activity: DEFAULT_ACTIVITY,
      feedback: DEFAULT_FEEDBACK,
      created_at: now,
      updated_at: now,
    };

    // Set default payment method if cards exist
    if (rider.payment.saved_cards.length > 0) {
      const defaultCard = rider.payment.saved_cards.find(c => c.is_default) || rider.payment.saved_cards[0];
      rider.payment.default_payment_method = defaultCard.card_id;
    }

    this.riders.set(riderId, rider);
    this.twinIndex.set(getRiderTwinId(riderId), riderId);

    logger.info('rider_twin_created', {
      riderId,
      twinId: getRiderTwinId(riderId),
      email: rider.profile.email,
    });

    return rider;
  }

  /**
   * Get a rider twin by ID
   */
  async get(riderId: string): Promise<RiderTwin | null> {
    return this.riders.get(riderId) || null;
  }

  /**
   * Get rider twin by TwinOS entity ID
   */
  async getByTwinId(twinId: string): Promise<RiderTwin | null> {
    const riderId = this.twinIndex.get(twinId);
    if (!riderId) return null;
    return this.get(riderId);
  }

  /**
   * List riders with pagination and filtering
   */
  async list(params: RiderListParams): Promise<PaginatedResponse<RiderTwin>> {
    let all = Array.from(this.riders.values());

    // Filter by tier
    if (params.tier) {
      all = all.filter(r => r.loyalty.tier === params.tier);
    }

    // Sort
    const sortBy = params.sort_by || 'created_at';
    const sortOrder = params.sort_order || 'desc';
    all.sort((a, b) => {
      const aVal = this.getSortValue(a, sortBy);
      const bVal = this.getSortValue(b, sortBy);
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    // Paginate
    const page = params.page || 1;
    const limit = params.limit || 20;
    const start = (page - 1) * limit;
    const data = all.slice(start, start + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total: all.length,
        total_pages: Math.ceil(all.length / limit),
      },
    };
  }

  private getSortValue(rider: RiderTwin, field: string): string {
    switch (field) {
      case 'created_at': return rider.created_at;
      case 'total_trips': return String(rider.activity.total_trips);
      case 'total_spend': return String(rider.activity.total_spend);
      default: return rider.created_at;
    }
  }

  /**
   * Update rider profile
   */
  async update(riderId: string, data: UpdateRiderRequest): Promise<RiderTwin | null> {
    const rider = this.riders.get(riderId);
    if (!rider) return null;

    if (data.profile) {
      rider.profile = { ...rider.profile, ...data.profile };
    }
    if (data.preferences) {
      rider.preferences = { ...rider.preferences, ...data.preferences };
    }

    rider.updated_at = new Date().toISOString();

    logger.info('rider_twin_updated', { riderId, fields: Object.keys(data) });
    return rider;
  }

  /**
   * Delete a rider twin
   */
  async delete(riderId: string): Promise<boolean> {
    const rider = this.riders.get(riderId);
    if (!rider) return false;

    this.riders.delete(riderId);
    this.twinIndex.delete(getRiderTwinId(riderId));

    logger.info('rider_twin_deleted', { riderId });
    return true;
  }

  /**
   * Search riders by name, email, or phone
   */
  async search(query: string): Promise<RiderTwin[]> {
    const lower = query.toLowerCase();
    return Array.from(this.riders.values()).filter(r =>
      r.profile.first.toLowerCase().includes(lower) ||
      r.profile.last.toLowerCase().includes(lower) ||
      r.profile.email.toLowerCase().includes(lower) ||
      r.profile.phone.includes(query)
    );
  }

  // ============================================
  // PAYMENT METHODS
  // ============================================

  /**
   * Add a payment method
   */
  async addPaymentMethod(riderId: string, data: AddPaymentMethodRequest): Promise<RiderTwin | null> {
    const rider = this.riders.get(riderId);
    if (!rider) return null;

    const card = {
      card_id: data.card_id,
      last_four: data.last_four,
      brand: data.brand,
      is_default: data.set_as_default || rider.payment.saved_cards.length === 0,
    };

    // If setting as default, unset others
    if (card.is_default) {
      rider.payment.saved_cards.forEach(c => c.is_default = false);
    }

    rider.payment.saved_cards.push(card);

    // Update default payment method
    if (card.is_default) {
      rider.payment.default_payment_method = card.card_id;
    }

    rider.updated_at = new Date().toISOString();

    logger.info('payment_method_added', { riderId, cardId: data.card_id });
    return rider;
  }

  /**
   * Remove a payment method
   */
  async removePaymentMethod(riderId: string, cardId: string): Promise<RiderTwin | null> {
    const rider = this.riders.get(riderId);
    if (!rider) return null;

    const index = rider.payment.saved_cards.findIndex(c => c.card_id === cardId);
    if (index === -1) return rider;

    rider.payment.saved_cards.splice(index, 1);

    // Update default if needed
    if (rider.payment.default_payment_method === cardId) {
      rider.payment.default_payment_method = rider.payment.saved_cards[0]?.card_id || '';
    }

    rider.updated_at = new Date().toISOString();

    logger.info('payment_method_removed', { riderId, cardId });
    return rider;
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(riderId: string, cardId: string): Promise<RiderTwin | null> {
    const rider = this.riders.get(riderId);
    if (!rider) return null;

    const card = rider.payment.saved_cards.find(c => c.card_id === cardId);
    if (!card) return null;

    rider.payment.saved_cards.forEach(c => c.is_default = c.card_id === cardId);
    rider.payment.default_payment_method = cardId;
    rider.updated_at = new Date().toISOString();

    logger.info('default_payment_method_set', { riderId, cardId });
    return rider;
  }

  // ============================================
  // ADDRESSES
  // ============================================

  /**
   * Add a saved address
   */
  async addAddress(riderId: string, data: AddAddressRequest): Promise<RiderTwin | null> {
    const rider = this.riders.get(riderId);
    if (!rider) return null;

    const address = {
      lat: data.lat,
      lng: data.lng,
      address: data.address,
      label: data.label,
    };

    switch (data.type) {
      case 'home':
        rider.addresses.home = address;
        break;
      case 'work':
        rider.addresses.work = address;
        break;
      case 'favorite':
        // Check for duplicates
        const exists = rider.addresses.favorites.some(
          f => f.lat === address.lat && f.lng === address.lng
        );
        if (!exists) {
          rider.addresses.favorites.push(address);
        }
        break;
    }

    rider.updated_at = new Date().toISOString();

    logger.info('address_added', { riderId, type: data.type });
    return rider;
  }

  /**
   * Remove a saved address
   */
  async removeAddress(riderId: string, type: 'home' | 'work', label?: string): Promise<RiderTwin | null> {
    const rider = this.riders.get(riderId);
    if (!rider) return null;

    if (type === 'home') {
      rider.addresses.home = undefined;
    } else if (type === 'work') {
      rider.addresses.work = undefined;
    } else if (label) {
      rider.addresses.favorites = rider.addresses.favorites.filter(f => f.label !== label);
    }

    rider.updated_at = new Date().toISOString();

    logger.info('address_removed', { riderId, type });
    return rider;
  }

  // ============================================
  // PREFERENCES
  // ============================================

  /**
   * Update rider preferences
   */
  async setPreferences(riderId: string, data: SetPreferencesRequest): Promise<RiderTwin | null> {
    const rider = this.riders.get(riderId);
    if (!rider) return null;

    rider.preferences = { ...rider.preferences, ...data };
    rider.updated_at = new Date().toISOString();

    logger.info('preferences_updated', { riderId });
    return rider;
  }

  // ============================================
  // LOYALTY
  // ============================================

  /**
   * Get loyalty status for a rider
   */
  async getLoyalty(riderId: string): Promise<RiderLoyalty | null> {
    const rider = this.riders.get(riderId);
    return rider?.loyalty || null;
  }

  /**
   * Add loyalty points
   */
  async addLoyaltyPoints(riderId: string, points: number, reason?: string): Promise<RiderTwin | null> {
    const rider = this.riders.get(riderId);
    if (!rider) return null;

    const oldTier = rider.loyalty.tier;
    rider.loyalty.points_balance += points;
    rider.loyalty.lifetime_points += points;

    // Check for tier upgrade
    const newTier = this.calculateTier(rider.loyalty.lifetime_points);
    if (newTier !== oldTier) {
      rider.loyalty.tier = newTier;
      logger.info('loyalty_tier_upgrade', {
        riderId,
        oldTier,
        newTier,
        lifetimePoints: rider.loyalty.lifetime_points,
      });
    }

    rider.updated_at = new Date().toISOString();

    logger.info('loyalty_points_added', {
      riderId,
      points,
      newBalance: rider.loyalty.points_balance,
      reason,
    });

    return rider;
  }

  /**
   * Redeem loyalty points
   */
  async redeemLoyaltyPoints(riderId: string, points: number): Promise<{ success: boolean; message: string }> {
    const rider = this.riders.get(riderId);
    if (!rider) return { success: false, message: 'Rider not found' };

    if (rider.loyalty.points_balance < points) {
      return {
        success: false,
        message: `Insufficient points. Current balance: ${rider.loyalty.points_balance}`,
      };
    }

    rider.loyalty.points_balance -= points;
    rider.updated_at = new Date().toISOString();

    logger.info('loyalty_points_redeemed', {
      riderId,
      points,
      newBalance: rider.loyalty.points_balance,
    });

    return { success: true, message: `Redeemed ${points} points successfully` };
  }

  /**
   * Calculate loyalty tier based on lifetime points
   */
  private calculateTier(lifetimePoints: number): LoyaltyTier {
    if (lifetimePoints >= LOYALTY_TIERS.platinum.minPoints) return 'platinum';
    if (lifetimePoints >= LOYALTY_TIERS.gold.minPoints) return 'gold';
    if (lifetimePoints >= LOYALTY_TIERS.silver.minPoints) return 'silver';
    return 'basic';
  }

  /**
   * Get points multiplier for current tier
   */
  getPointsMultiplier(tier: LoyaltyTier): number {
    return LOYALTY_TIERS[tier].multiplier;
  }

  // ============================================
  // ACTIVITY TRACKING
  // ============================================

  /**
   * Update rider activity after an event
   */
  async updateActivity(riderId: string, eventType: string, data?: Record<string, any>): Promise<RiderTwin | null> {
    const rider = this.riders.get(riderId);
    if (!rider) return null;

    switch (eventType) {
      case 'order_created':
        rider.activity.last_trip = new Date().toISOString();
        break;

      case 'journey_completed':
        if (data) {
          rider.activity.total_trips++;
          if (data.fare) {
            rider.activity.total_spend += data.fare;
            rider.activity.avg_trip_cost = rider.activity.total_spend / rider.activity.total_trips;
          }
          if (data.from && data.to) {
            this.updateFavoriteRoute(rider, data.from, data.to);
          }
        }
        break;

      case 'rating_given':
        rider.feedback.given_count++;
        break;

      case 'report_filed':
        rider.feedback.reports_count++;
        break;
    }

    rider.updated_at = new Date().toISOString();
    return rider;
  }

  /**
   * Update favorite routes
   */
  private updateFavoriteRoute(rider: RiderTwin, from: string, to: string): void {
    const existing = rider.activity.favorite_routes.find(
      r => r.from === from && r.to === to
    );

    if (existing) {
      existing.count++;
    } else {
      // Add new route and keep top 10
      rider.activity.favorite_routes.push({ from, to, count: 1 });
      rider.activity.favorite_routes.sort((a, b) => b.count - a.count);
      rider.activity.favorite_routes = rider.activity.favorite_routes.slice(0, 10);
    }
  }

  /**
   * Add a favorite route manually
   */
  async addFavoriteRoute(riderId: string, data: AddFavoriteRouteRequest): Promise<RiderTwin | null> {
    const rider = this.riders.get(riderId);
    if (!rider) return null;

    this.updateFavoriteRoute(rider, data.from, data.to);
    rider.updated_at = new Date().toISOString();

    return rider;
  }

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Get rider analytics summary
   */
  async getAnalytics(riderId: string): Promise<Record<string, any> | null> {
    const rider = this.riders.get(riderId);
    if (!rider) return null;

    return {
      rider_id: riderId,
      activity_summary: {
        total_trips: rider.activity.total_trips,
        total_spend: rider.activity.total_spend,
        avg_trip_cost: rider.activity.avg_trip_cost,
        last_trip: rider.activity.last_trip,
      },
      loyalty_summary: {
        tier: rider.loyalty.tier,
        points_balance: rider.loyalty.points_balance,
        lifetime_points: rider.loyalty.lifetime_points,
        points_multiplier: this.getPointsMultiplier(rider.loyalty.tier),
      },
      feedback_summary: {
        avg_rating_given: rider.feedback.avg_rating,
        ratings_given_count: rider.feedback.given_count,
        reports_count: rider.feedback.reports_count,
      },
      preferences_summary: {
        preferred_vehicle: rider.preferences.preferred_vehicle_type,
        preferred_payment: rider.preferences.preferred_payment,
        special_assistance: rider.preferences.special_assistance,
      },
      top_routes: rider.activity.favorite_routes.slice(0, 5),
    };
  }

  /**
   * Get rider statistics for a time period
   */
  async getStats(riderId: string, period: 'day' | 'week' | 'month' | 'all'): Promise<Record<string, any>> {
    const rider = this.riders.get(riderId);
    if (!rider) return {};

    // For demo purposes, return simplified stats
    // In production, this would query historical data
    return {
      rider_id: riderId,
      period,
      trips: rider.activity.total_trips,
      spend: rider.activity.total_spend,
      avg_cost: rider.activity.avg_trip_cost,
      loyalty_points: rider.loyalty.points_balance,
    };
  }
}

import { v4 as uuidv4 } from 'uuid';
import { RoomTwinModel, PropertyTwinModel, GuestTwinModel, UpsellOfferModel } from '../models';
import { PricingDecision, UpsellOffer, RoomTwin, PropertyTwin, GuestTwin } from '../types/twin.types';
import { logger } from '../utils/logger';

interface PricingContext {
  room_id: string;
  guest_id?: string;
  check_in?: string;
  check_out?: string;
  adults?: number;
  children?: number;
}

interface DemandFactors {
  occupancy: number;
  day_of_week: string;
  season: string;
  special_event: boolean;
  local_events: string[];
}

export class PricingService {
  private readonly SEASONAL_RATES: Record<string, number> = {
    peak: 1.25,
    high: 1.15,
    shoulder: 1.0,
    low: 0.85,
  };

  private readonly DAY_OF_WEEK_MULTIPLIERS: Record<string, number> = {
    friday: 1.1,
    saturday: 1.15,
    sunday: 0.95,
    monday: 0.9,
    tuesday: 0.9,
    wednesday: 0.95,
    thursday: 1.0,
  };

  /**
   * Calculate dynamic pricing for a room
   */
  async calculateDynamicPricing(context: PricingContext): Promise<PricingDecision> {
    const { room_id, guest_id } = context;

    // Fetch room and property data
    const room = await RoomTwinModel.findOne({ room_id });
    if (!room) {
      throw new Error(`Room not found: ${room_id}`);
    }

    const property = await PropertyTwinModel.findOne({ property_id: room.property_id });
    if (!property) {
      throw new Error(`Property not found for room: ${room_id}`);
    }

    // Get guest data if available
    let guest: GuestTwin | null = null;
    if (guest_id) {
      const guestDoc = await GuestTwinModel.findOne({ guest_id });
      guest = guestDoc ? guestDoc.toObject() : null;
    }

    // Calculate demand factors
    const demandFactors = await this.analyzeDemandFactors(property, room);

    // Calculate base factors
    const factors = {
      occupancy: demandFactors.occupancy,
      demand_multiplier: this.calculateDemandMultiplier(demandFactors),
      season: this.determineSeason(),
      day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'lowercase' }),
      special_event: demandFactors.special_event,
      guest_loyalty_adjustment: guest ? this.calculateLoyaltyAdjustment(guest) : 0,
      competitive_adjustment: 0,
    };

    // Calculate rates
    const baseRate = room.revenue.base_rate;
    const demandAdjustedRate = baseRate * factors.demand_multiplier;
    const seasonalRate = demandAdjustedRate * (this.SEASONAL_RATES[factors.season] || 1.0);
    const weekendRate = seasonalRate * (this.DAY_OF_WEEK_MULTIPLIERS[factors.day_of_week] || 1.0);

    // Apply loyalty discount if applicable
    const loyaltyDiscount = factors.guest_loyalty_adjustment;
    const calculatedRate = weekendRate * (1 - loyaltyDiscount);

    // Apply constraints
    const minRate = baseRate * 0.7; // Never go below 70% of base
    const maxRate = baseRate * property.settings.pricing_rules.surge_multiplier_max;
    const finalRate = Math.max(minRate, Math.min(maxRate, calculatedRate));

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(room, property, guest);

    const decision: PricingDecision = {
      decision_id: uuidv4(),
      room_id,
      room_type: room.room_type,
      base_rate: baseRate,
      calculated_rate: calculatedRate,
      final_rate: Math.round(finalRate * 100) / 100,
      factors,
      confidence,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      created_at: new Date().toISOString(),
    };

    logger.info('Pricing decision calculated', {
      decision_id: decision.decision_id,
      room_id,
      final_rate: decision.final_rate,
      confidence,
    });

    return decision;
  }

  /**
   * Analyze demand factors for a property
   */
  private async analyzeDemandFactors(property: PropertyTwin, room: RoomTwin): Promise<DemandFactors> {
    const occupancy = property.revenue.occupancy_rate;

    // Determine day of week
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });

    // Determine season
    const season = this.determineSeason();

    // Check for special events (simplified - in production, integrate with events API)
    const specialEvent = false; // Would be fetched from external events service

    return {
      occupancy,
      day_of_week: dayOfWeek,
      season,
      special_event: specialEvent,
      local_events: [],
    };
  }

  /**
   * Determine current season based on date
   */
  private determineSeason(): string {
    const month = new Date().getMonth();

    if (month >= 5 && month <= 7) return 'peak'; // June-August
    if (month >= 3 && month <= 4 || month >= 9 && month <= 10) return 'shoulder'; // Spring/Fall
    if (month >= 11 || month <= 1) return 'high'; // Holiday season
    return 'low';
  }

  /**
   * Calculate demand multiplier based on occupancy and other factors
   */
  private calculateDemandMultiplier(factors: DemandFactors): number {
    let multiplier = 1.0;

    // Occupancy-based pricing
    if (factors.occupancy >= 90) {
      multiplier = 1.4;
    } else if (factors.occupancy >= 80) {
      multiplier = 1.25;
    } else if (factors.occupancy >= 70) {
      multiplier = 1.15;
    } else if (factors.occupancy >= 50) {
      multiplier = 1.0;
    } else if (factors.occupancy >= 30) {
      multiplier = 0.9;
    } else {
      multiplier = 0.8;
    }

    // Special event premium
    if (factors.special_event) {
      multiplier *= 1.2;
    }

    return Math.min(multiplier, 1.5); // Cap at 1.5x surge
  }

  /**
   * Calculate loyalty adjustment based on guest tier
   */
  private calculateLoyaltyAdjustment(guest: GuestTwin): number {
    const tierDiscounts: Record<string, number> = {
      bronze: 0,
      silver: 0.05,
      gold: 0.1,
      platinum: 0.15,
    };

    return tierDiscounts[guest.loyalty.tier] || 0;
  }

  /**
   * Calculate confidence score for pricing decision
   */
  private calculateConfidence(
    room: RoomTwin,
    property: PropertyTwin,
    guest: GuestTwin | null
  ): number {
    let confidence = 0.7; // Base confidence

    // Increase confidence with data
    if (room.revenue.last_rate_update) {
      confidence += 0.1;
    }
    if (property.revenue.revpar > 0) {
      confidence += 0.1;
    }
    if (guest) {
      confidence += 0.1;
    }

    return Math.min(confidence, 0.95); // Max 95% confidence
  }

  /**
   * Optimize upgrade pricing for a guest
   */
  async optimizeUpgradePricing(
    guestId: string,
    currentRoomId: string,
    targetRoomType: string
  ): Promise<UpsellOffer> {
    const guest = await GuestTwinModel.findOne({ guest_id: guestId });
    if (!guest) {
      throw new Error(`Guest not found: ${guestId}`);
    }

    const currentRoom = await RoomTwinModel.findOne({ room_id: currentRoomId });
    if (!currentRoom) {
      throw new Error(`Room not found: ${currentRoomId}`);
    }

    // Find target room type
    const targetRoom = await RoomTwinModel.findOne({
      room_type: targetRoomType,
      'status.current': 'available',
      property_id: currentRoom.property_id,
    });

    if (!targetRoom) {
      throw new Error(`No available ${targetRoomType} rooms`);
    }

    // Calculate pricing
    const baseUpgradeCost = targetRoom.revenue.base_rate - currentRoom.revenue.base_rate;
    const guestSensitivity = guest.price_sensitivity / 100;
    const loyaltyAdjustment = this.calculateLoyaltyAdjustment(guest.toObject() as GuestTwin);

    // Apply price sensitivity: higher sensitivity = bigger discount
    const discountFactor = 1 - (guestSensitivity * 0.3) + (loyaltyAdjustment * 0.5);
    const finalUpgradePrice = baseUpgradeCost * Math.max(0.5, Math.min(1.0, discountFactor));

    const savings = baseUpgradeCost - finalUpgradePrice;
    const discountPercentage = (savings / baseUpgradeCost) * 100;

    const offer: UpsellOffer = {
      offer_id: uuidv4(),
      guest_id: guestId,
      room_id: currentRoomId,
      offer_type: 'upgrade',
      title: `Upgrade to ${this.formatRoomType(targetRoomType)}`,
      description: `Enjoy our ${this.formatRoomType(targetRoomType)} with enhanced amenities and more space`,
      original_price: baseUpgradeCost,
      offer_price: Math.round(finalUpgradePrice * 100) / 100,
      discount_percentage: Math.round(discountPercentage * 10) / 10,
      savings: Math.round(savings * 100) / 100,
      target_room_type: targetRoomType,
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      status: 'pending',
      conversion_probability: this.predictConversionProbability(guest.toObject() as GuestTwin, discountPercentage),
      revenue_impact: finalUpgradePrice,
      created_at: new Date().toISOString(),
    };

    // Save offer to database
    const upsellOffer = new UpsellOfferModel(offer);
    await upsellOffer.save();

    logger.info('Upgrade offer created', {
      offer_id: offer.offer_id,
      guest_id: guestId,
      target_room_type: targetRoomType,
      offer_price: offer.offer_price,
    });

    return offer;
  }

  /**
   * Predict conversion probability based on guest profile and discount
   */
  private predictConversionProbability(guest: GuestTwin, discountPercentage: number): number {
    let probability = 0.5; // Base probability

    // Loyalty tier boost
    const tierBoosts: Record<string, number> = {
      bronze: 0,
      silver: 0.1,
      gold: 0.15,
      platinum: 0.2,
    };
    probability += tierBoosts[guest.loyalty.tier] || 0;

    // Price sensitivity inverse boost
    const sensitivityBoost = (100 - guest.price_sensitivity) / 200;
    probability += sensitivityBoost;

    // Discount boost (more discount = more likely to accept)
    const discountBoost = Math.min(discountPercentage / 50, 0.2);
    probability += discountBoost;

    // Sentiment boost
    if (guest.sentiment.current_score >= 80) {
      probability += 0.1;
    } else if (guest.sentiment.current_score < 50) {
      probability -= 0.15;
    }

    // CLV boost (high value guests more likely to upgrade)
    if (guest.lifetime_value.clv > 5000) {
      probability += 0.1;
    }

    return Math.max(0.05, Math.min(0.95, Math.round(probability * 100) / 100));
  }

  /**
   * Format room type for display
   */
  private formatRoomType(roomType: string): string {
    return roomType.charAt(0).toUpperCase() + roomType.slice(1);
  }

  /**
   * Calculate bundle pricing for packages
   */
  async calculateBundlePricing(
    guestId: string,
    items: { item_id: string; original_price: number }[]
  ): Promise<{ bundle_price: number; discount_percentage: number; savings: number }> {
    const guest = await GuestTwinModel.findOne({ guest_id: guestId });
    if (!guest) {
      throw new Error(`Guest not found: ${guestId}`);
    }

    const originalTotal = items.reduce((sum, item) => sum + item.original_price, 0);

    // Bundle discount based on number of items
    let bundleDiscount = 0;
    if (items.length >= 4) {
      bundleDiscount = 0.25; // 25% for 4+ items
    } else if (items.length >= 3) {
      bundleDiscount = 0.2; // 20% for 3 items
    } else if (items.length >= 2) {
      bundleDiscount = 0.15; // 15% for 2 items
    }

    // Apply loyalty bonus
    const loyaltyAdjustment = this.calculateLoyaltyAdjustment(guest.toObject() as GuestTwin);
    const totalDiscount = Math.min(bundleDiscount + (loyaltyAdjustment * 0.5), 0.4);

    const bundlePrice = originalTotal * (1 - totalDiscount);
    const savings = originalTotal - bundlePrice;

    return {
      bundle_price: Math.round(bundlePrice * 100) / 100,
      discount_percentage: Math.round(totalDiscount * 100 * 10) / 10,
      savings: Math.round(savings * 100) / 100,
    };
  }
}

export const pricingService = new PricingService();
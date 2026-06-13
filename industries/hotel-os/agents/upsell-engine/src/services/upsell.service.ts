import { v4 as uuidv4 } from 'uuid';
import { GuestTwinModel, RoomTwinModel, PropertyTwinModel, UpsellOfferModel } from '../models';
import { UpsellOffer, GuestTwin, RoomTwin, PropertyTwin } from '../types/twin.types';
import { logger } from '../utils/logger';

interface OfferContext {
  guest_id: string;
  room_id: string;
  offer_type?: 'upgrade' | 'package' | 'addon' | 'early_checkin' | 'late_checkout';
  force_refresh?: boolean;
}

interface OfferEligibility {
  eligible: boolean;
  reasons: string[];
  suggested_offers: string[];
}

export class UpsellService {
  private readonly OFFER_TYPES = ['upgrade', 'package', 'addon', 'early_checkin', 'late_checkout'] as const;

  /**
   * Check if a guest is eligible for upsell offers
   */
  async checkEligibility(guestId: string, roomId: string): Promise<OfferEligibility> {
    const guest = await GuestTwinModel.findOne({ guest_id: guestId });
    if (!guest) {
      return { eligible: false, reasons: ['Guest not found'], suggested_offers: [] };
    }

    const room = await RoomTwinModel.findOne({ room_id: roomId });
    if (!room) {
      return { eligible: false, reasons: ['Room not found'], suggested_offers: [] };
    }

    const property = await PropertyTwinModel.findOne({ property_id: room.property_id });
    if (!property) {
      return { eligible: false, reasons: ['Property not found'], suggested_offers: [] };
    }

    const reasons: string[] = [];
    const suggestedOffers: string[] = [];

    // Check if recommendation eligibility
    if (!guest.lifetime_value.recommendation_eligibility) {
      reasons.push('Guest has opted out of recommendations');
      return { eligible: false, reasons, suggested_offers: [] };
    }

    // Check excluded rate codes
    if (guest.current_stay?.rate_code) {
      if (property.settings.upsell_config.excluded_rate_codes.includes(guest.current_stay.rate_code)) {
        reasons.push('Rate code excluded from upsells');
        return { eligible: false, reasons, suggested_offers: [] };
      }
    }

    // Check if recently offered (within interval)
    const recentOffer = await UpsellOfferModel.findOne({
      guest_id: guestId,
      created_at: { $gte: new Date(Date.now() - property.settings.upsell_config.min_offer_interval_hours * 60 * 60 * 1000) },
    });

    if (recentOffer) {
      reasons.push(`Recent offer within ${property.settings.upsell_config.min_offer_interval_hours} hours`);
    }

    // Check for upgrade eligibility
    if (room.room_type !== 'penthouse') {
      suggestedOffers.push('upgrade');
    }

    // Check for early/late checkout
    if (guest.current_stay?.check_out) {
      const checkoutTime = new Date(guest.current_stay.check_out);
      const checkoutHour = checkoutTime.getHours();
      if (checkoutHour >= 10 && checkoutHour < 14) {
        suggestedOffers.push('late_checkout');
      }
    }

    // Check for early check-in
    if (guest.current_stay?.check_in) {
      const checkinTime = new Date(guest.current_stay.check_in);
      const checkinHour = checkinTime.getHours();
      if (checkinHour >= 6 && checkinHour < 14) {
        suggestedOffers.push('early_checkin');
      }
    }

    // Check for dining preferences to suggest packages
    if (guest.preferences.dining.favorite_items.length > 0) {
      suggestedOffers.push('package');
    }

    // Check for spa interests
    if (guest.preferences.amenities.spa_interests.length > 0) {
      suggestedOffers.push('addon');
    }

    return {
      eligible: suggestedOffers.length > 0 || reasons.length === 0,
      reasons,
      suggested_offers: [...new Set(suggestedOffers)],
    };
  }

  /**
   * Generate personalized upsell offers for a guest
   */
  async generateOffers(context: OfferContext): Promise<UpsellOffer[]> {
    const { guest_id, room_id, offer_type } = context;

    const guest = await GuestTwinModel.findOne({ guest_id });
    if (!guest) {
      throw new Error(`Guest not found: ${guest_id}`);
    }

    const room = await RoomTwinModel.findOne({ room_id });
    if (!room) {
      throw new Error(`Room not found: ${room_id}`);
    }

    const property = await PropertyTwinModel.findOne({ property_id: room.property_id });
    if (!property) {
      throw new Error(`Property not found for room: ${room_id}`);
    }

    const offers: UpsellOffer[] = [];
    const offerTypes = offer_type ? [offer_type] : this.OFFER_TYPES;

    for (const type of offerTypes) {
      const offer = await this.createOffer(type, guest.toObject() as GuestTwin, room.toObject() as RoomTwin, property.toObject() as PropertyTwin);
      if (offer) {
        offers.push(offer);
      }
    }

    // Save all offers
    if (offers.length > 0) {
      await UpsellOfferModel.insertMany(offers);
      logger.info('Upsell offers generated', {
        guest_id,
        room_id,
        offer_count: offers.length,
        offer_types: offers.map((o) => o.offer_type),
      });
    }

    return offers;
  }

  /**
   * Create a specific offer type
   */
  private async createOffer(
    offerType: typeof this.OFFER_TYPES[number],
    guest: GuestTwin,
    room: RoomTwin,
    property: PropertyTwin
  ): Promise<UpsellOffer | null> {
    switch (offerType) {
      case 'upgrade':
        return this.createUpgradeOffer(guest, room, property);
      case 'early_checkin':
        return this.createEarlyCheckinOffer(guest, room, property);
      case 'late_checkout':
        return this.createLateCheckoutOffer(guest, room, property);
      case 'package':
        return this.createPackageOffer(guest, room, property);
      case 'addon':
        return this.createAddonOffer(guest, room, property);
      default:
        return null;
    }
  }

  /**
   * Create room upgrade offer
   */
  private async createUpgradeOffer(
    guest: GuestTwin,
    room: RoomTwin,
    property: PropertyTwin
  ): Promise<UpsellOffer | null> {
    // Check if upgrade is possible
    if (room.room_type === 'penthouse') {
      return null;
    }

    // Find upgrade room type
    const upgradeMap: Record<string, string> = {
      standard: 'deluxe',
      deluxe: 'suite',
      suite: 'penthouse',
      accessible: 'standard',
    };

    const targetRoomType = upgradeMap[room.room_type];
    if (!targetRoomType) {
      return null;
    }

    // Check availability and pricing
    const targetRoom = await RoomTwinModel.findOne({
      room_type: targetRoomType,
      'status.current': 'available',
      property_id: property.property_id,
    });

    if (!targetRoom) {
      return null;
    }

    const baseUpgradeCost = targetRoom.revenue.base_rate - room.revenue.base_rate;
    const maxDiscount = property.settings.upsell_config.max_upgrade_discount / 100;

    // Calculate personalized discount
    const loyaltyDiscounts: Record<string, number> = {
      bronze: 0,
      silver: 0.05,
      gold: 0.1,
      platinum: 0.15,
    };

    const sensitivityDiscount = (100 - guest.price_sensitivity) / 500; // Max 20% for very price-sensitive
    const totalDiscount = Math.min(
      (loyaltyDiscounts[guest.loyalty.tier] || 0) + sensitivityDiscount,
      maxDiscount
    );

    const finalPrice = baseUpgradeCost * (1 - totalDiscount);
    const savings = baseUpgradeCost - finalPrice;

    return {
      offer_id: uuidv4(),
      guest_id: guest.guest_id,
      room_id: room.room_id,
      offer_type: 'upgrade',
      title: `Upgrade to ${this.formatRoomType(targetRoomType)}`,
      description: `Enhance your stay with our ${this.formatRoomType(targetRoomType)} featuring ${this.getRoomTypeAmenities(targetRoomType).join(', ')}`,
      original_price: baseUpgradeCost,
      offer_price: Math.round(finalPrice * 100) / 100,
      discount_percentage: Math.round(totalDiscount * 100 * 10) / 10,
      savings: Math.round(savings * 100) / 100,
      target_room_type: targetRoomType,
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      conversion_probability: this.calculateConversionProbability(guest, totalDiscount * 100),
      revenue_impact: finalPrice,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Create early check-in offer
   */
  private createEarlyCheckinOffer(
    guest: GuestTwin,
    room: RoomTwin,
    property: PropertyTwin
  ): UpsellOffer | null {
    if (!guest.current_stay?.check_in) {
      return null;
    }

    const checkinTime = new Date(guest.current_stay.check_in);
    const checkinHour = checkinTime.getHours();

    // Only offer early check-in if standard check-in hasn't passed
    if (checkinHour < 14) {
      return null;
    }

    const earlyCheckinPrice = 50; // Base price
    const loyaltyDiscount = { bronze: 0, silver: 0.1, gold: 0.15, platinum: 0.2 }[guest.loyalty.tier] || 0;
    const finalPrice = earlyCheckinPrice * (1 - loyaltyDiscount);

    return {
      offer_id: uuidv4(),
      guest_id: guest.guest_id,
      room_id: room.room_id,
      offer_type: 'early_checkin',
      title: 'Early Check-In',
      description: 'Arrive early and start your stay relaxed. Get access to your room from 10:00 AM.',
      original_price: earlyCheckinPrice,
      offer_price: Math.round(finalPrice * 100) / 100,
      discount_percentage: Math.round(loyaltyDiscount * 100 * 10) / 10,
      savings: Math.round((earlyCheckinPrice - finalPrice) * 100) / 100,
      valid_until: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      conversion_probability: this.calculateConversionProbability(guest, loyaltyDiscount * 100),
      revenue_impact: finalPrice,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Create late checkout offer
   */
  private createLateCheckoutOffer(
    guest: GuestTwin,
    room: RoomTwin,
    property: PropertyTwin
  ): UpsellOffer | null {
    if (!guest.current_stay?.check_out) {
      return null;
    }

    const checkoutTime = new Date(guest.current_stay.check_out);
    const checkoutHour = checkoutTime.getHours();

    // Only offer late checkout if standard checkout hasn't passed
    if (checkoutHour > 14) {
      return null;
    }

    const lateCheckoutPrice = 50; // Base price
    const loyaltyDiscount = { bronze: 0, silver: 0.1, gold: 0.15, platinum: 0.2 }[guest.loyalty.tier] || 0;
    const finalPrice = lateCheckoutPrice * (1 - loyaltyDiscount);

    return {
      offer_id: uuidv4(),
      guest_id: guest.guest_id,
      room_id: room.room_id,
      offer_type: 'late_checkout',
      title: 'Late Check-Out',
      description: 'Enjoy your stay longer with a late checkout until 3:00 PM.',
      original_price: lateCheckoutPrice,
      offer_price: Math.round(finalPrice * 100) / 100,
      discount_percentage: Math.round(loyaltyDiscount * 100 * 10) / 10,
      savings: Math.round((lateCheckoutPrice - finalPrice) * 100) / 100,
      valid_until: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      conversion_probability: this.calculateConversionProbability(guest, loyaltyDiscount * 100),
      revenue_impact: finalPrice,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Create package offer
   */
  private createPackageOffer(
    guest: GuestTwin,
    room: RoomTwin,
    property: PropertyTwin
  ): UpsellOffer | null {
    // Create personalized package based on preferences
    const packageItems = this.buildPackageFromPreferences(guest);

    if (packageItems.length === 0) {
      return null;
    }

    const basePrice = packageItems.reduce((sum, item) => sum + item.price, 0);
    const packageDiscount = packageItems.length >= 3 ? 0.2 : 0.15;
    const finalPrice = basePrice * (1 - packageDiscount);

    return {
      offer_id: uuidv4(),
      guest_id: guest.guest_id,
      room_id: room.room_id,
      offer_type: 'package',
      title: 'Personalized Experience Package',
      description: `Curated package including ${packageItems.map((i) => i.name).join(', ')}`,
      original_price: basePrice,
      offer_price: Math.round(finalPrice * 100) / 100,
      discount_percentage: Math.round(packageDiscount * 100 * 10) / 10,
      savings: Math.round((basePrice - finalPrice) * 100) / 100,
      addons: packageItems.map((i) => i.id),
      valid_until: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      conversion_probability: this.calculateConversionProbability(guest, packageDiscount * 100),
      revenue_impact: finalPrice,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Create addon offer
   */
  private createAddonOffer(
    guest: GuestTwin,
    room: RoomTwin,
    property: PropertyTwin
  ): UpsellOffer | null {
    // Find relevant addons based on guest preferences
    const addons = this.findRelevantAddons(guest, property);

    if (addons.length === 0) {
      return null;
    }

    const addon = addons[0]; // Return first relevant addon
    const loyaltyDiscount = { bronze: 0, silver: 0.05, gold: 0.1, platinum: 0.15 }[guest.loyalty.tier] || 0;
    const finalPrice = addon.price * (1 - loyaltyDiscount);

    return {
      offer_id: uuidv4(),
      guest_id: guest.guest_id,
      room_id: room.room_id,
      offer_type: 'addon',
      title: addon.name,
      description: addon.description,
      original_price: addon.price,
      offer_price: Math.round(finalPrice * 100) / 100,
      discount_percentage: Math.round(loyaltyDiscount * 100 * 10) / 10,
      savings: Math.round((addon.price - finalPrice) * 100) / 100,
      addons: [addon.id],
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      conversion_probability: this.calculateConversionProbability(guest, loyaltyDiscount * 100),
      revenue_impact: finalPrice,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Build package items from guest preferences
   */
  private buildPackageFromPreferences(guest: GuestTwin): { id: string; name: string; price: number }[] {
    const items: { id: string; name: string; price: number }[] = [];

    // Add dining if preferences exist
    if (guest.preferences.dining.favorite_items.length > 0) {
      items.push({ id: 'dining', name: 'Dining Credit', price: 75 });
    }

    // Add spa if interested
    if (guest.preferences.amenities.spa_interests.length > 0) {
      items.push({ id: 'spa', name: 'Spa Treatment', price: 120 });
    }

    // Add breakfast
    items.push({ id: 'breakfast', name: 'Breakfast for Two', price: 45 });

    return items;
  }

  /**
   * Find relevant addons for guest
   */
  private findRelevantAddons(
    guest: GuestTwin,
    property: PropertyTwin
  ): { id: string; name: string; description: string; price: number }[] {
    const addons: { id: string; name: string; description: string; price: number }[] = [];

    // Spa addon if interested
    if (guest.preferences.amenities.spa_interests.length > 0) {
      addons.push({
        id: 'spa_treatment',
        name: 'Spa Access Pass',
        description: 'Full day spa access with your choice of treatment',
        price: 85,
      });
    }

    // Fitness addon if fitness habits
    if (guest.preferences.amenities.fitness_habits) {
      addons.push({
        id: 'fitness_pass',
        name: 'Premium Fitness Access',
        description: 'Access to gym and fitness classes',
        price: 35,
      });
    }

    // Pool addon if pool usage
    if (guest.preferences.amenities.pool_usage) {
      addons.push({
        id: 'pool_cabana',
        name: 'Pool Cabana Rental',
        description: 'Private cabana with complimentary refreshments',
        price: 65,
      });
    }

    return addons;
  }

  /**
   * Calculate conversion probability
   */
  private calculateConversionProbability(guest: GuestTwin, discountPercentage: number): number {
    let probability = 0.5;

    // Loyalty boost
    const tierBoosts: Record<string, number> = {
      bronze: 0,
      silver: 0.1,
      gold: 0.15,
      platinum: 0.2,
    };
    probability += tierBoosts[guest.loyalty.tier] || 0;

    // Price sensitivity inverse boost
    probability += (100 - guest.price_sensitivity) / 200;

    // Discount boost
    probability += Math.min(discountPercentage / 50, 0.2);

    // Sentiment boost
    if (guest.sentiment.current_score >= 80) {
      probability += 0.1;
    } else if (guest.sentiment.current_score < 50) {
      probability -= 0.15;
    }

    return Math.max(0.05, Math.min(0.95, Math.round(probability * 100) / 100));
  }

  /**
   * Get room type amenities
   */
  private getRoomTypeAmenities(roomType: string): string[] {
    const amenities: Record<string, string[]> = {
      deluxe: ['upgraded bedding', 'city view', 'work desk'],
      suite: ['separate living area', 'premium minibar', 'marble bathroom', 'city view'],
      penthouse: ['butler service', 'panoramic views', 'jacuzzi', 'premium amenities'],
      standard: ['comfortable bedding', 'standard amenities'],
      accessible: ['accessible features', 'mobility-friendly design'],
    };
    return amenities[roomType] || [];
  }

  /**
   * Format room type for display
   */
  private formatRoomType(roomType: string): string {
    return roomType.charAt(0).toUpperCase() + roomType.slice(1);
  }

  /**
   * Respond to an offer (accept/decline)
   */
  async respondToOffer(offerId: string, response: 'accepted' | 'declined'): Promise<UpsellOffer | null> {
    const offer = await UpsellOfferModel.findOne({ offer_id: offerId });
    if (!offer) {
      throw new Error(`Offer not found: ${offerId}`);
    }

    if (offer.status !== 'pending' && offer.status !== 'shown') {
      throw new Error(`Offer already responded: ${offer.status}`);
    }

    offer.status = response;
    offer.responded_at = new Date().toISOString();
    await offer.save();

    logger.info('Offer response recorded', {
      offer_id: offerId,
      response,
      guest_id: offer.guest_id,
    });

    return offer.toObject();
  }

  /**
   * Get active offers for a guest
   */
  async getActiveOffers(guestId: string): Promise<UpsellOffer[]> {
    const now = new Date();

    const offers = await UpsellOfferModel.find({
      guest_id: guestId,
      status: { $in: ['pending', 'shown'] },
      valid_until: { $gt: now.toISOString() },
    }).sort({ created_at: -1 });

    return offers.map((o) => o.toObject());
  }

  /**
   * Mark offer as shown
   */
  async markOfferShown(offerId: string): Promise<void> {
    await UpsellOfferModel.updateOne(
      { offer_id: offerId },
      {
        status: 'shown',
        shown_at: new Date().toISOString(),
      }
    );
  }
}

export const upsellService = new UpsellService();
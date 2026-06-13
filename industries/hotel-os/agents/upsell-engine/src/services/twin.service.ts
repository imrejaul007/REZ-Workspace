import { v4 as uuidv4 } from 'uuid';
import { GuestTwinModel, RoomTwinModel, PropertyTwinModel } from '../models';
import { GuestTwin, RoomTwin, PropertyTwin } from '../types/twin.types';
import { logger } from '../utils/logger';
import axios from 'axios';

const GUEST_MEMORY_URL = process.env.GUEST_MEMORY_URL || 'http://localhost:8447';

interface GuestTwinCreateInput {
  guest_id?: string;
  property_id: string;
  profile: GuestTwin['profile'];
  loyalty?: Partial<GuestTwin['loyalty']>;
  preferences?: Partial<GuestTwin['preferences']>;
  stay_patterns?: Partial<GuestTwin['stay_patterns']>;
  sentiment?: Partial<GuestTwin['sentiment']>;
  lifetime_value?: Partial<GuestTwin['lifetime_value']>;
  current_stay?: GuestTwin['current_stay'];
  price_sensitivity?: number;
}

interface RoomTwinCreateInput {
  room_id?: string;
  property_id: string;
  room_number: string;
  room_type: RoomTwin['room_type'];
  floor: number;
  view?: RoomTwin['view'];
  capacity?: RoomTwin['capacity'];
  bed_configuration?: RoomTwin['bed_configuration'];
  amenities?: RoomTwin['amenities'];
  revenue: { base_rate: number; rack_rate: number };
}

interface PropertyTwinCreateInput {
  property_id?: string;
  brand: string;
  name: string;
  location: PropertyTwin['location'];
  inventory: PropertyTwin['inventory'];
  venues?: PropertyTwin['venues'];
  settings?: Partial<PropertyTwin['settings']>;
}

export class TwinService {
  /**
   * Create a new guest twin
   */
  async createGuestTwin(input: GuestTwinCreateInput): Promise<GuestTwin> {
    const guestId = input.guest_id || uuidv4();

    // Check if guest already exists
    const existing = await GuestTwinModel.findOne({ guest_id: guestId });
    if (existing) {
      throw new Error(`Guest twin already exists: ${guestId}`);
    }

    const guestTwin = new GuestTwinModel({
      guest_id: guestId,
      property_id: input.property_id,
      profile: input.profile,
      loyalty: {
        tier: input.loyalty?.tier || 'bronze',
        points_balance: input.loyalty?.points_balance || 0,
        member_since: input.loyalty?.member_since || new Date().toISOString(),
        total_stays: input.loyalty?.total_stays || 0,
        total_spend: input.loyalty?.total_spend || 0,
      },
      preferences: input.preferences || this.getDefaultPreferences(),
      stay_patterns: input.stay_patterns || this.getDefaultStayPatterns(),
      sentiment: input.sentiment || this.getDefaultSentiment(),
      lifetime_value: input.lifetime_value || this.getDefaultLifetimeValue(),
      current_stay: input.current_stay || null,
      price_sensitivity: input.price_sensitivity || 50,
      upgrade_history: [],
    });

    await guestTwin.save();

    logger.info('Guest twin created', { guest_id: guestId, property_id: input.property_id });

    // Sync with Guest Memory service
    await this.syncWithGuestMemory(guestTwin.toObject() as GuestTwin);

    return guestTwin.toObject() as GuestTwin;
  }

  /**
   * Get guest twin by ID
   */
  async getGuestTwin(guestId: string): Promise<GuestTwin | null> {
    const guest = await GuestTwinModel.findOne({ guest_id: guestId });
    if (!guest) {
      return null;
    }
    return guest.toObject() as GuestTwin;
  }

  /**
   * Update guest preferences
   */
  async updateGuestPreferences(
    guestId: string,
    preferences: Partial<GuestTwin['preferences']>
  ): Promise<GuestTwin | null> {
    const guest = await GuestTwinModel.findOne({ guest_id: guestId });
    if (!guest) {
      return null;
    }

    // Merge with existing preferences
    guest.preferences = {
      ...guest.preferences.toObject(),
      ...preferences,
    };

    await guest.save();

    logger.info('Guest preferences updated', { guest_id: guestId });

    // Sync with Guest Memory
    await this.syncWithGuestMemory(guest.toObject() as GuestTwin);

    return guest.toObject() as GuestTwin;
  }

  /**
   * Create a new room twin
   */
  async createRoomTwin(input: RoomTwinCreateInput): Promise<RoomTwin> {
    const roomId = input.room_id || uuidv4();

    const existing = await RoomTwinModel.findOne({ room_id: roomId });
    if (existing) {
      throw new Error(`Room twin already exists: ${roomId}`);
    }

    const roomTwin = new RoomTwinModel({
      room_id: roomId,
      property_id: input.property_id,
      room_number: input.room_number,
      room_type: input.room_type,
      floor: input.floor,
      view: input.view || 'city',
      capacity: input.capacity || { max_adults: 2, max_children: 1, max_occupancy: 3 },
      bed_configuration: input.bed_configuration || { bed_count: 1, bed_type: 'king', rollaway_available: false },
      amenities: input.amenities || this.getDefaultAmenities(),
      status: {
        current: 'available',
        next_available: null,
        maintenance_alerts: [],
      },
      revenue: {
        ...input.revenue,
        minibar_balance: 0,
        last_rate_update: new Date().toISOString(),
      },
    });

    await roomTwin.save();

    logger.info('Room twin created', { room_id: roomId, property_id: input.property_id });

    return roomTwin.toObject() as RoomTwin;
  }

  /**
   * Get room status
   */
  async getRoomStatus(roomId: string): Promise<RoomTwin['status'] | null> {
    const room = await RoomTwinModel.findOne({ room_id: roomId }, { status: 1 });
    if (!room) {
      return null;
    }
    return room.status;
  }

  /**
   * Update room status
   */
  async updateRoomStatus(
    roomId: string,
    status: Partial<RoomTwin['status']>
  ): Promise<RoomTwin | null> {
    const room = await RoomTwinModel.findOne({ room_id: roomId });
    if (!room) {
      return null;
    }

    room.status = { ...room.status.toObject(), ...status };
    await room.save();

    logger.info('Room status updated', { room_id: roomId, status: room.status.current });

    return room.toObject() as RoomTwin;
  }

  /**
   * Create a new property twin
   */
  async createPropertyTwin(input: PropertyTwinCreateInput): Promise<PropertyTwin> {
    const propertyId = input.property_id || uuidv4();

    const existing = await PropertyTwinModel.findOne({ property_id: propertyId });
    if (existing) {
      throw new Error(`Property twin already exists: ${propertyId}`);
    }

    const propertyTwin = new PropertyTwinModel({
      property_id: propertyId,
      brand: input.brand,
      name: input.name,
      location: input.location,
      inventory: input.inventory,
      venues: input.venues || [],
      revenue: {
        today_revenue: 0,
        mtd_revenue: 0,
        ytd_revenue: 0,
        revpar: 0,
        adr: 0,
        occupancy_rate: 0,
      },
      settings: {
        brand_standards_version: input.settings?.brand_standards_version || '1.0.0',
        upsell_config: input.settings?.upsell_config || this.getDefaultUpsellConfig(),
        pricing_rules: input.settings?.pricing_rules || this.getDefaultPricingRules(),
      },
    });

    await propertyTwin.save();

    logger.info('Property twin created', { property_id: propertyId, name: input.name });

    return propertyTwin.toObject() as PropertyTwin;
  }

  /**
   * Get property twin by ID
   */
  async getPropertyTwin(propertyId: string): Promise<PropertyTwin | null> {
    const property = await PropertyTwinModel.findOne({ property_id: propertyId });
    if (!property) {
      return null;
    }
    return property.toObject() as PropertyTwin;
  }

  /**
   * Sync twin data with Guest Memory service
   */
  private async syncWithGuestMemory(guestTwin: GuestTwin): Promise<void> {
    try {
      await axios.post(
        `${GUEST_MEMORY_URL}/api/guests/${guestTwin.guest_id}/sync`,
        {
          source: 'upsell-engine',
          data: {
            preferences: guestTwin.preferences,
            sentiment: guestTwin.sentiment,
            lifetime_value: guestTwin.lifetime_value,
            price_sensitivity: guestTwin.price_sensitivity,
          },
        },
        { timeout: 5000 }
      );
    } catch (error) {
      // Log but don't fail - Guest Memory might not be available
      logger.warn('Failed to sync with Guest Memory', {
        guest_id: guestTwin.guest_id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(): GuestTwin['preferences'] {
    return {
      room: {
        floor_preference: '',
        view_preference: '',
        bed_configuration: '',
        temperature_setting: { default: 22, range: { min: 18, max: 26 } },
        lighting_preference: '',
        noise_tolerance: 5,
      },
      dining: {
        dietary_restrictions: [],
        allergies: [],
        favorite_items: [],
        beverage_preferences: [],
        typical_spend_range: { min: 50, max: 200 },
      },
      amenities: {
        spa_interests: [],
        fitness_habits: false,
        pool_usage: false,
        business_amenities: [],
      },
      communication: {
        preferred_channel: 'email',
        opt_ins: [],
        quiet_hours: { start: '22:00', end: '08:00' },
      },
    };
  }

  /**
   * Get default stay patterns
   */
  private getDefaultStayPatterns(): GuestTwin['stay_patterns'] {
    return {
      typical_check_in_time: '15:00',
      typical_check_out_time: '11:00',
      weekend_vs_weekday: 'mixed',
      seasonal_patterns: [],
      booking_lead_time: 7,
    };
  }

  /**
   * Get default sentiment
   */
  private getDefaultSentiment(): GuestTwin['sentiment'] {
    return {
      current_score: 70,
      trend: 'stable',
      last_feedback_date: new Date().toISOString(),
      key_topics: [],
    };
  }

  /**
   * Get default lifetime value
   */
  private getDefaultLifetimeValue(): GuestTwin['lifetime_value'] {
    return {
      clv: 0,
      potential_clv: 0,
      churn_risk: 'low',
      recommendation_eligibility: true,
    };
  }

  /**
   * Get default amenities
   */
  private getDefaultAmenities(): RoomTwin['amenities'] {
    return {
      smart_tv: false,
      smart_speaker: false,
      minibar: true,
      coffee_machine: false,
      safe: true,
      balcony: false,
      jacuzzi: false,
    };
  }

  /**
   * Get default upsell config
   */
  private getDefaultUpsellConfig(): PropertyTwin['settings']['upsell_config'] {
    return {
      max_upgrade_discount: 30,
      min_offer_interval_hours: 24,
      preferred_offer_times: ['10:00', '14:00', '18:00'],
      excluded_rate_codes: [],
      upgrade_thresholds: { occupancy: 70, min_rate: 100 },
    };
  }

  /**
   * Get default pricing rules
   */
  private getDefaultPricingRules(): PropertyTwin['settings']['pricing_rules'] {
    return {
      dynamic_pricing_enabled: true,
      surge_multiplier_max: 1.5,
      weekend_premium: 1.15,
      seasonal_adjustments: [],
    };
  }
}

export const twinService = new TwinService();
import { v4 as uuidv4 } from 'uuid';
import { TwinOSClient } from './twinos-client';
import {
  GuestTwin,
  RoomTwin,
  PropertyTwin,
  Preferences,
  Sentiment,
  LifetimeValue,
  Loyalty,
  CurrentStay,
  IoTState,
  RoomStatus,
} from '../models';
import { logger } from '../utils/logger';

// In-memory storage for demo (replace with actual database in production)
const guestTwins = new Map<string, GuestTwin>();
const roomTwins = new Map<string, RoomTwin>();
const propertyTwins = new Map<string, PropertyTwin>();

export interface CreateGuestTwinInput {
  guest_id?: string;
  profile: {
    name: string;
    email: string;
    phone?: string;
    nationality?: string;
    language_preference?: string;
    accessibility_needs?: string[];
  };
  loyalty?: Partial<Loyalty>;
  preferences?: Partial<Preferences>;
  stay_patterns?: {
    typical_check_in_time?: string;
    typical_check_out_time?: string;
    weekend_vs_weekday?: 'weekend' | 'weekday' | 'mixed';
    seasonal_patterns?: string[];
    booking_lead_time?: number;
  };
  sentiment?: Partial<Sentiment>;
  lifetime_value?: Partial<LifetimeValue>;
  current_stay?: Partial<CurrentStay>;
  sync_to_twinos?: boolean;
}

export interface CreateGuestTwinResponse {
  guest_id: string;
  guest_twin_id: string;
  created_at: string;
  synced_to_twinos: boolean;
  twinos_twin_id?: string;
}

export interface UpdatePreferencesInput {
  guest_id: string;
  preferences: Partial<Preferences>;
  sync_to_twinos?: boolean;
}

export interface UpdatePreferencesResponse {
  guest_id: string;
  preferences: Preferences;
  updated_at: string;
  synced_to_twinos: boolean;
}

export interface CreateRoomTwinInput {
  room_id?: string;
  property_id: string;
  room_number: string;
  room_type?: 'standard' | 'deluxe' | 'suite' | 'penthouse' | 'accessible';
  floor: number;
  view?: 'city' | 'pool' | 'garden' | 'ocean' | 'mountain';
  capacity?: {
    max_adults?: number;
    max_children?: number;
    max_occupancy?: number;
  };
  bed_configuration?: {
    bed_count?: number;
    bed_type?: 'king' | 'queen' | 'twin' | 'bunk';
    rollaway_available?: boolean;
  };
  amenities?: {
    smart_tv?: boolean;
    smart_speaker?: boolean;
    minibar?: boolean;
    coffee_machine?: boolean;
    safe?: boolean;
    balcony?: boolean;
    jacuzzi?: boolean;
  };
  status?: {
    current?: RoomStatus;
    next_available?: string;
    maintenance_alerts?: string[];
  };
  iot_state?: Partial<IoTState>;
  housekeeping?: {
    last_cleaned?: string;
    next_scheduled?: string;
    frequency?: 'daily' | 'weekly' | 'on_departure';
    supply_status?: 'adequate' | 'low' | 'critical';
  };
  revenue?: {
    base_rate?: number;
    rack_rate?: number;
    minibar_balance?: number;
    last_rate_update?: string;
  };
  sync_to_twinos?: boolean;
}

export interface CreateRoomTwinResponse {
  room_id: string;
  room_twin_id: string;
  created_at: string;
  synced_to_twinos: boolean;
  twinos_twin_id?: string;
}

export interface GetRoomStatusResponse {
  room_id: string;
  room_number: string;
  status: {
    current: RoomStatus;
    next_available?: string;
    maintenance_alerts: string[];
  };
  iot_state: IoTState;
  housekeeping: {
    last_cleaned?: string;
    next_scheduled?: string;
    frequency: 'daily' | 'weekly' | 'on_departure';
    supply_status: 'adequate' | 'low' | 'critical';
  };
  occupancy?: {
    occupied_by?: string;
    check_in?: string;
    check_out?: string;
  };
}

export interface CreatePropertyTwinInput {
  property_id?: string;
  brand?: string;
  name: string;
  location?: {
    address?: string;
    city?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
    timezone?: string;
  };
  inventory: {
    total_rooms: number;
    by_type?: Record<string, number>;
    available_today?: number;
    available_tomorrow?: number;
  };
  venues?: Array<{
    venue_id?: string;
    name: string;
    type: 'restaurant' | 'bar' | 'spa' | 'gym' | 'pool' | 'meeting_room';
    capacity: number;
    hours?: Record<string, string>;
    pos_revenue_center_id?: string;
  }>;
  staff?: {
    total_count?: number;
    by_department?: Record<string, number>;
    on_duty_now?: number;
  };
  services?: {
    check_in_24h?: boolean;
    concierge_available?: boolean;
    room_service_hours?: Record<string, string>;
    housekeeping_schedule?: Record<string, string>;
  };
  revenue?: {
    today_revenue?: number;
    mtd_revenue?: number;
    ytd_revenue?: number;
    revpar?: number;
    adr?: number;
    occupancy_rate?: number;
  };
  settings?: {
    brand_standards_version?: string;
    upsell_config?: Record<string, unknown>;
    pricing_rules?: Record<string, unknown>;
  };
  sync_to_twinos?: boolean;
}

export interface CreatePropertyTwinResponse {
  property_id: string;
  property_twin_id: string;
  created_at: string;
  synced_to_twinos: boolean;
  twinos_twin_id?: string;
}

export class GuestMemoryService {
  private twinosClient: TwinOSClient | null = null;
  private readonly isTwinOSEnabled: boolean;

  constructor(twinosClient?: TwinOSClient) {
    this.twinosClient = twinosClient || null;
    this.isTwinOSEnabled = !!twinosClient;
    logger.info(`GuestMemoryService initialized. TwinOS sync: ${this.isTwinOSEnabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Create a new Guest Twin
   */
  async createGuestTwin(input: CreateGuestTwinInput): Promise<CreateGuestTwinResponse> {
    const guestId = input.guest_id || uuidv4();
    const now = new Date().toISOString();

    const guestTwin: GuestTwin = {
      guest_id: guestId,
      profile: {
        name: input.profile.name,
        email: input.profile.email,
        phone: input.profile.phone,
        nationality: input.profile.nationality,
        language_preference: input.profile.language_preference || 'en',
        accessibility_needs: input.profile.accessibility_needs || [],
      },
      loyalty: {
        tier: input.loyalty?.tier || 'bronze',
        points_balance: input.loyalty?.points_balance || 0,
        member_since: input.loyalty?.member_since || now,
        total_stays: input.loyalty?.total_stays || 0,
        total_spend: input.loyalty?.total_spend || 0,
      },
      preferences: {
        room: input.preferences?.room || { floor_preference: undefined, view_preference: undefined, bed_configuration: undefined, temperature_setting: undefined, lighting_preference: undefined, noise_tolerance: undefined },
        dining: input.preferences?.dining || { dietary_restrictions: [], allergies: [], favorite_items: [], beverage_preferences: [], typical_spend_range: undefined },
        amenities: input.preferences?.amenities || { spa_interests: [], fitness_habits: false, pool_usage: false, business_amenities: [] },
        communication: input.preferences?.communication || { preferred_channel: 'email', opt_ins: [], quiet_hours: undefined },
      },
      stay_patterns: {
        typical_check_in_time: input.stay_patterns?.typical_check_in_time,
        typical_check_out_time: input.stay_patterns?.typical_check_out_time,
        weekend_vs_weekday: input.stay_patterns?.weekend_vs_weekday,
        seasonal_patterns: input.stay_patterns?.seasonal_patterns || [],
        booking_lead_time: input.stay_patterns?.booking_lead_time,
      },
      sentiment: {
        current_score: input.sentiment?.current_score || 50,
        trend: input.sentiment?.trend || 'stable',
        last_feedback_date: input.sentiment?.last_feedback_date,
        key_topics: input.sentiment?.key_topics || [],
      },
      lifetime_value: {
        clv: input.lifetime_value?.clv || 0,
        potential_clv: input.lifetime_value?.potential_clv || 0,
        churn_risk: input.lifetime_value?.churn_risk || 'low',
        recommendation_eligibility: input.lifetime_value?.recommendation_eligibility ?? true,
      },
      current_stay: input.current_stay,
      created_at: now,
      updated_at: now,
    };

    // Store in memory (replace with DB in production)
    guestTwins.set(guestId, guestTwin);
    logger.info(`Guest Twin created: ${guestId}`);

    // Sync to TwinOS Hub if enabled
    let twinosTwinId: string | undefined;
    if (input.sync_to_twinos !== false && this.twinosClient) {
      try {
        const twinOSId = `twin.hotel.guest.${guestId}`;
        await this.twinosClient.createTwin({
          twinId: twinOSId,
          twinType: 'HUMAN',
          industry: 'hotel',
          attributes: guestTwin as unknown as Record<string, unknown>,
          metadata: {
            source: 'guest_memory',
            createdBy: 'guest-memory-twinos',
          },
        });
        twinosTwinId = twinOSId;
        logger.info(`Guest Twin synced to TwinOS: ${twinOSId}`);
      } catch (error) {
        logger.error(`Failed to sync Guest Twin to TwinOS: ${error}`);
      }
    }

    return {
      guest_id: guestId,
      guest_twin_id: `twin.hotel.guest.${guestId}`,
      created_at: now,
      synced_to_twinos: !!twinosTwinId,
      twinos_twin_id: twinosTwinId,
    };
  }

  /**
   * Get a Guest Twin by ID
   */
  async getGuestTwin(guestId: string): Promise<GuestTwin | null> {
    return guestTwins.get(guestId) || null;
  }

  /**
   * Update guest preferences
   */
  async updatePreferences(input: UpdatePreferencesInput): Promise<UpdatePreferencesResponse> {
    const guestTwin = guestTwins.get(input.guest_id);
    if (!guestTwin) {
      throw new Error(`Guest Twin not found: ${input.guest_id}`);
    }

    // Merge preferences
    const updatedPreferences: Preferences = {
      room: { ...guestTwin.preferences.room, ...input.preferences.room },
      dining: { ...guestTwin.preferences.dining, ...input.preferences.dining },
      amenities: { ...guestTwin.preferences.amenities, ...input.preferences.amenities },
      communication: { ...guestTwin.preferences.communication, ...input.preferences.communication },
    };

    guestTwin.preferences = updatedPreferences;
    guestTwin.updated_at = new Date().toISOString();
    guestTwins.set(input.guest_id, guestTwin);

    logger.info(`Preferences updated for Guest Twin: ${input.guest_id}`);

    // Sync to TwinOS Hub if enabled
    if (input.sync_to_twinos !== false && this.twinosClient) {
      try {
        const twinOSId = `twin.hotel.guest.${input.guest_id}`;
        await this.twinosClient.patchTwin('HUMAN', twinOSId, {
          preferences: updatedPreferences,
          updated_at: guestTwin.updated_at,
        });
        logger.info(`Preferences synced to TwinOS: ${twinOSId}`);
      } catch (error) {
        logger.error(`Failed to sync preferences to TwinOS: ${error}`);
      }
    }

    return {
      guest_id: input.guest_id,
      preferences: updatedPreferences,
      updated_at: guestTwin.updated_at!,
      synced_to_twinos: !!this.twinosClient,
    };
  }

  /**
   * Create a new Room Twin
   */
  async createRoomTwin(input: CreateRoomTwinInput): Promise<CreateRoomTwinResponse> {
    const roomId = input.room_id || uuidv4();
    const now = new Date().toISOString();

    const roomTwin: RoomTwin = {
      room_id: roomId,
      property_id: input.property_id,
      room_number: input.room_number,
      room_type: input.room_type || 'standard',
      floor: input.floor,
      view: input.view || 'city',
      capacity: {
        max_adults: input.capacity?.max_adults || 2,
        max_children: input.capacity?.max_children || 0,
        max_occupancy: input.capacity?.max_occupancy || 2,
      },
      bed_configuration: {
        bed_count: input.bed_configuration?.bed_count || 1,
        bed_type: input.bed_configuration?.bed_type || 'king',
        rollaway_available: input.bed_configuration?.rollaway_available || false,
      },
      amenities: {
        smart_tv: input.amenities?.smart_tv || false,
        smart_speaker: input.amenities?.smart_speaker || false,
        minibar: input.amenities?.minibar || false,
        coffee_machine: input.amenities?.coffee_machine || false,
        safe: input.amenities?.safe || false,
        balcony: input.amenities?.balcony || false,
        jacuzzi: input.amenities?.jacuzzi || false,
      },
      status: {
        current: input.status?.current || 'available',
        next_available: input.status?.next_available,
        maintenance_alerts: input.status?.maintenance_alerts || [],
      },
      iot_state: {
        thermostat: input.iot_state?.thermostat,
        lighting: input.iot_state?.lighting,
        blinds: input.iot_state?.blinds || 'closed',
        door_lock: input.iot_state?.door_lock || 'locked',
        minibar_door: input.iot_state?.minibar_door || 'closed',
        occupancy_sensor: input.iot_state?.occupancy_sensor || false,
      },
      housekeeping: {
        last_cleaned: input.housekeeping?.last_cleaned,
        next_scheduled: input.housekeeping?.next_scheduled,
        frequency: input.housekeeping?.frequency || 'daily',
        supply_status: input.housekeeping?.supply_status || 'adequate',
      },
      revenue: {
        base_rate: input.revenue?.base_rate,
        rack_rate: input.revenue?.rack_rate,
        minibar_balance: input.revenue?.minibar_balance || 0,
        last_rate_update: input.revenue?.last_rate_update,
      },
      created_at: now,
      updated_at: now,
    };

    roomTwins.set(roomId, roomTwin);
    logger.info(`Room Twin created: ${roomId}`);

    // Sync to TwinOS Hub if enabled
    let twinosTwinId: string | undefined;
    if (input.sync_to_twinos !== false && this.twinosClient) {
      try {
        const twinOSId = `twin.hotel.room.${roomId}`;
        await this.twinosClient.createTwin({
          twinId: twinOSId,
          twinType: 'ASSET',
          industry: 'hotel',
          attributes: roomTwin as unknown as Record<string, unknown>,
          metadata: {
            source: 'guest_memory',
            createdBy: 'guest-memory-twinos',
          },
        });
        twinosTwinId = twinOSId;
        logger.info(`Room Twin synced to TwinOS: ${twinOSId}`);
      } catch (error) {
        logger.error(`Failed to sync Room Twin to TwinOS: ${error}`);
      }
    }

    return {
      room_id: roomId,
      room_twin_id: `twin.hotel.room.${roomId}`,
      created_at: now,
      synced_to_twinos: !!twinosTwinId,
      twinos_twin_id: twinosTwinId,
    };
  }

  /**
   * Get room status
   */
  async getRoomStatus(roomId: string): Promise<GetRoomStatusResponse | null> {
    const roomTwin = roomTwins.get(roomId);
    if (!roomTwin) {
      return null;
    }

    // Find guest currently in this room
    let occupancy: GetRoomStatusResponse['occupancy'] = undefined;
    for (const [guestId, guest] of guestTwins.entries()) {
      if (guest.current_stay?.room_id === roomId) {
        occupancy = {
          occupied_by: guestId,
          check_in: guest.current_stay.check_in,
          check_out: guest.current_stay.check_out,
        };
        break;
      }
    }

    return {
      room_id: roomTwin.room_id,
      room_number: roomTwin.room_number,
      status: roomTwin.status,
      iot_state: roomTwin.iot_state,
      housekeeping: roomTwin.housekeeping,
      occupancy,
    };
  }

  /**
   * Create a new Property Twin
   */
  async createPropertyTwin(input: CreatePropertyTwinInput): Promise<CreatePropertyTwinResponse> {
    const propertyId = input.property_id || uuidv4();
    const now = new Date().toISOString();

    const propertyTwin: PropertyTwin = {
      property_id: propertyId,
      brand: input.brand,
      name: input.name,
      location: {
        address: input.location?.address,
        city: input.location?.city,
        country: input.location?.country,
        coordinates: input.location?.coordinates,
        timezone: input.location?.timezone || 'UTC',
      },
      inventory: {
        total_rooms: input.inventory.total_rooms,
        by_type: input.inventory.by_type,
        available_today: input.inventory.available_today,
        available_tomorrow: input.inventory.available_tomorrow,
      },
      venues: (input.venues || []).map((v) => ({
        venue_id: v.venue_id || uuidv4(),
        name: v.name,
        type: v.type,
        capacity: v.capacity,
        hours: v.hours,
        pos_revenue_center_id: v.pos_revenue_center_id,
      })),
      staff: {
        total_count: input.staff?.total_count || 0,
        by_department: input.staff?.by_department,
        on_duty_now: input.staff?.on_duty_now || 0,
      },
      services: {
        check_in_24h: input.services?.check_in_24h || false,
        concierge_available: input.services?.concierge_available || false,
        room_service_hours: input.services?.room_service_hours,
        housekeeping_schedule: input.services?.housekeeping_schedule,
      },
      revenue: {
        today_revenue: input.revenue?.today_revenue || 0,
        mtd_revenue: input.revenue?.mtd_revenue || 0,
        ytd_revenue: input.revenue?.ytd_revenue || 0,
        revpar: input.revenue?.revpar,
        adr: input.revenue?.adr,
        occupancy_rate: input.revenue?.occupancy_rate,
      },
      settings: {
        brand_standards_version: input.settings?.brand_standards_version,
        upsell_config: input.settings?.upsell_config,
        pricing_rules: input.settings?.pricing_rules,
      },
      created_at: now,
      updated_at: now,
    };

    propertyTwins.set(propertyId, propertyTwin);
    logger.info(`Property Twin created: ${propertyId}`);

    // Sync to TwinOS Hub if enabled
    let twinosTwinId: string | undefined;
    if (input.sync_to_twinos !== false && this.twinosClient) {
      try {
        const twinOSId = `twin.hotel.property.${propertyId}`;
        await this.twinosClient.createTwin({
          twinId: twinOSId,
          twinType: 'ORGANIZATION',
          industry: 'hotel',
          attributes: propertyTwin as unknown as Record<string, unknown>,
          metadata: {
            source: 'guest_memory',
            createdBy: 'guest-memory-twinos',
          },
        });
        twinosTwinId = twinOSId;
        logger.info(`Property Twin synced to TwinOS: ${twinOSId}`);
      } catch (error) {
        logger.error(`Failed to sync Property Twin to TwinOS: ${error}`);
      }
    }

    return {
      property_id: propertyId,
      property_twin_id: `twin.hotel.property.${propertyId}`,
      created_at: now,
      synced_to_twinos: !!twinosTwinId,
      twinos_twin_id: twinosTwinId,
    };
  }

  /**
   * Get all Guest Twins
   */
  getAllGuestTwins(): GuestTwin[] {
    return Array.from(guestTwins.values());
  }

  /**
   * Get all Room Twins
   */
  getAllRoomTwins(): RoomTwin[] {
    return Array.from(roomTwins.values());
  }

  /**
   * Get all Property Twins
   */
  getAllPropertyTwins(): PropertyTwin[] {
    return Array.from(propertyTwins.values());
  }

  /**
   * Check if TwinOS sync is enabled
   */
  isTwinOSEnabledCheck(): boolean {
    return this.isTwinOSEnabled;
  }
}
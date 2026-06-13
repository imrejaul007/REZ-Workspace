import {
  GuestTwinSchema,
  CreateGuestTwinRequestSchema,
  UpdateGuestPreferencesRequestSchema,
  RoomTwinSchema,
  CreateRoomTwinRequestSchema,
  PropertyTwinSchema,
  CreatePropertyTwinRequestSchema,
  ScheduleRequestSchema,
  CleaningTaskSchema,
  HousekeeperSchema,
} from '../src/schemas/twin.schemas';

describe('Twin Schemas', () => {
  describe('Guest Twin Schemas', () => {
    const validGuestTwin = {
      guest_id: 'G-123456',
      profile: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        nationality: 'US',
        language_preference: 'en',
        accessibility_needs: ['wheelchair_accessible'],
      },
      loyalty: {
        tier: 'gold',
        points_balance: 15000,
        member_since: '2023-01-15T00:00:00Z',
        total_stays: 12,
        total_spend: 8500,
      },
      preferences: {
        room: {
          floor_preference: 'high',
          view_preference: 'ocean',
          bed_configuration: 'king',
          temperature_setting: { default: 72, range: { min: 68, max: 76 } },
          lighting_preference: 'warm',
          noise_tolerance: 7,
        },
        dining: {
          dietary_restrictions: ['vegetarian'],
          allergies: ['peanuts'],
          favorite_items: ['pasta', 'wine'],
          beverage_preferences: ['coffee', 'sparkling_water'],
        },
        amenities: {
          spa_interests: ['massage', 'facial'],
          fitness_habits: true,
          pool_usage: true,
          business_amenities: ['printer', 'meeting_room'],
        },
        communication: {
          preferred_channel: 'app_push',
          opt_ins: ['promotions', 'weather_updates'],
          quiet_hours: { start: '22:00', end: '08:00' },
        },
      },
      stay_patterns: {
        typical_check_in_time: '15:00',
        typical_check_out_time: '11:00',
        weekend_vs_weekday: 'weekend',
        seasonal_patterns: ['summer', 'christmas'],
        booking_lead_time: 14,
      },
      sentiment: {
        current_score: 85,
        trend: 'improving',
        last_feedback_date: '2024-01-10T00:00:00Z',
        key_topics: ['service', 'cleanliness'],
      },
      lifetime_value: {
        clv: 15000,
        potential_clv: 25000,
        churn_risk: 'low',
        recommendation_eligibility: true,
      },
      current_stay: {
        room_id: '501',
        check_in: '2024-01-15T14:00:00Z',
        check_out: '2024-01-18T11:00:00Z',
        adults: 2,
        children: 0,
        rate_code: 'FLEX-RE',
        special_requests: ['high_floor', 'quiet_room'],
        occasion: 'anniversary',
      },
      preferred_property_id: 'PROP-001',
    };

    it('should validate a valid guest twin', () => {
      const result = GuestTwinSchema.safeParse(validGuestTwin);
      expect(result.success).toBe(true);
    });

    it('should reject guest twin with invalid email', () => {
      const invalidGuest = {
        ...validGuestTwin,
        profile: { ...validGuestTwin.profile, email: 'invalid-email' },
      };
      const result = GuestTwinSchema.safeParse(invalidGuest);
      expect(result.success).toBe(false);
    });

    it('should reject guest twin with invalid loyalty tier', () => {
      const invalidGuest = {
        ...validGuestTwin,
        loyalty: { ...validGuestTwin.loyalty!, tier: 'diamond' },
      };
      const result = GuestTwinSchema.safeParse(invalidGuest);
      expect(result.success).toBe(false);
    });

    it('should reject guest twin with invalid noise tolerance', () => {
      const invalidGuest = {
        ...validGuestTwin,
        preferences: {
          ...validGuestTwin.preferences!,
          room: { ...validGuestTwin.preferences!.room, noise_tolerance: 15 },
        },
      };
      const result = GuestTwinSchema.safeParse(invalidGuest);
      expect(result.success).toBe(false);
    });

    it('should apply default values for optional fields', () => {
      const minimalGuest = {
        guest_id: 'G-123',
        profile: {
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      };
      const result = CreateGuestTwinRequestSchema.safeParse(minimalGuest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profile.language_preference).toBe('en');
        expect(result.data.preferences?.dining.dietary_restrictions).toEqual([]);
      }
    });
  });

  describe('Room Twin Schemas', () => {
    const validRoomTwin = {
      room_id: '501',
      property_id: 'PROP-001',
      room_number: '501',
      room_type: 'deluxe',
      floor: 5,
      view: 'ocean',
      capacity: {
        max_adults: 2,
        max_children: 2,
        max_occupancy: 4,
      },
      bed_configuration: {
        bed_count: 1,
        bed_type: 'king',
        rollaway_available: true,
      },
      amenities: {
        smart_tv: true,
        smart_speaker: true,
        minibar: true,
        coffee_machine: true,
        safe: true,
        balcony: true,
        jacuzzi: false,
      },
      status: {
        current: 'available',
        next_available: '2024-01-15T14:00:00Z',
        maintenance_alerts: [],
      },
      iot_state: {
        thermostat: { current: 72, target: 72, mode: 'auto' },
        lighting: { scene: 'evening', brightness: 60 },
        blinds: 'closed',
        door_lock: 'locked',
        minibar_door: 'closed',
        occupancy_sensor: false,
      },
      housekeeping: {
        last_cleaned: '2024-01-14T10:00:00Z',
        next_scheduled: '2024-01-15T10:00:00Z',
        frequency: 'daily',
        supply_status: 'adequate',
      },
      revenue: {
        base_rate: 199,
        rack_rate: 299,
        minibar_balance: 45.50,
        last_rate_update: '2024-01-01T00:00:00Z',
      },
    };

    it('should validate a valid room twin', () => {
      const result = RoomTwinSchema.safeParse(validRoomTwin);
      expect(result.success).toBe(true);
    });

    it('should reject room twin with invalid room type', () => {
      const invalidRoom = { ...validRoomTwin, room_type: 'presidential' };
      const result = RoomTwinSchema.safeParse(invalidRoom);
      expect(result.success).toBe(false);
    });

    it('should reject room twin with invalid status', () => {
      const invalidRoom = {
        ...validRoomTwin,
        status: { ...validRoomTwin.status, current: 'reserved' },
      };
      const result = RoomTwinSchema.safeParse(invalidRoom);
      expect(result.success).toBe(false);
    });

    it('should reject room twin with negative base rate', () => {
      const invalidRoom = {
        ...validRoomTwin,
        revenue: { ...validRoomTwin.revenue, base_rate: -50 },
      };
      const result = RoomTwinSchema.safeParse(invalidRoom);
      expect(result.success).toBe(false);
    });

    it('should apply default values for capacity', () => {
      const minimalRoom = {
        room_id: '101',
        property_id: 'PROP-001',
        room_number: '101',
        room_type: 'standard',
        floor: 1,
        view: 'city',
        capacity: {},
        bed_configuration: { bed_count: 1, bed_type: 'queen' },
        status: { current: 'available', maintenance_alerts: [] },
        housekeeping: { frequency: 'daily', supply_status: 'adequate' },
        revenue: { base_rate: 99, rack_rate: 149 },
      };
      const result = CreateRoomTwinRequestSchema.safeParse(minimalRoom);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capacity.max_adults).toBe(2);
        expect(result.data.capacity.max_children).toBe(0);
      }
    });
  });

  describe('Property Twin Schemas', () => {
    const validPropertyTwin = {
      property_id: 'PROP-001',
      brand: 'RTMN Hotels',
      name: 'Grand Plaza Hotel',
      location: {
        address: '123 Main Street',
        city: 'New York',
        country: 'USA',
        coordinates: { lat: 40.7128, lng: -74.006 },
        timezone: 'America/New_York',
      },
      inventory: {
        total_rooms: 250,
        by_type: { standard: 100, deluxe: 80, suite: 50, penthouse: 20 },
        available_today: 45,
        available_tomorrow: 38,
      },
      venues: [
        {
          venue_id: 'VEN-001',
          name: 'The Grill',
          type: 'restaurant',
          capacity: 120,
          hours: { monday: '06:30-22:00', tuesday: '06:30-22:00' },
        },
        {
          venue_id: 'VEN-002',
          name: 'Sky Lounge',
          type: 'bar',
          capacity: 80,
          hours: { monday: '17:00-02:00' },
        },
      ],
      staff: {
        total_count: 150,
        by_department: { front_desk: 20, housekeeping: 40, f_and_b: 50 },
        on_duty_now: 65,
      },
      services: {
        check_in_24h: true,
        concierge_available: true,
        room_service_hours: { start: '06:00', end: '23:00' },
        housekeeping_schedule: { start: '07:00', end: '21:00' },
      },
      revenue: {
        today_revenue: 45000,
        mtd_revenue: 1350000,
        ytd_revenue: 16200000,
        revpar: 180,
        adr: 225,
        occupancy_rate: 82,
      },
      settings: {
        brand_standards_version: '3.2.1',
        upsell_config: { enabled: true, max_upgrade_price: 150 },
      },
    };

    it('should validate a valid property twin', () => {
      const result = PropertyTwinSchema.safeParse(validPropertyTwin);
      expect(result.success).toBe(true);
    });

    it('should reject property twin with invalid venue type', () => {
      const invalidProperty = {
        ...validPropertyTwin,
        venues: [
          { ...validPropertyTwin.venues[0], type: 'nightclub' },
        ],
      };
      const result = PropertyTwinSchema.safeParse(invalidProperty);
      expect(result.success).toBe(false);
    });

    it('should reject property twin with invalid coordinates', () => {
      const invalidProperty = {
        ...validPropertyTwin,
        location: {
          ...validPropertyTwin.location,
          coordinates: { lat: 200, lng: -74 }, // lat out of range
        },
      };
      const result = PropertyTwinSchema.safeParse(invalidProperty);
      expect(result.success).toBe(false);
    });

    it('should reject property twin with occupancy rate > 100', () => {
      const invalidProperty = {
        ...validPropertyTwin,
        revenue: { ...validPropertyTwin.revenue, occupancy_rate: 105 },
      };
      const result = PropertyTwinSchema.safeParse(invalidProperty);
      expect(result.success).toBe(false);
    });
  });

  describe('Scheduling Schemas', () => {
    it('should validate a valid schedule request', () => {
      const validRequest = {
        property_id: 'PROP-001',
        date: '2024-01-15',
        shift_start: '07:00',
        shift_end: '15:00',
        available_staff: ['staff-001', 'staff-002', 'staff-003'],
        priority_rooms: ['501', '502'],
      };
      const result = ScheduleRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject schedule request with invalid date format', () => {
      const invalidRequest = {
        property_id: 'PROP-001',
        date: '15-01-2024', // Wrong format
        shift_start: '07:00',
        shift_end: '15:00',
        available_staff: ['staff-001'],
      };
      const result = ScheduleRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject schedule request with invalid time format', () => {
      const invalidRequest = {
        property_id: 'PROP-001',
        date: '2024-01-15',
        shift_start: '7:00', // Missing leading zero
        shift_end: '15:00',
        available_staff: ['staff-001'],
      };
      const result = ScheduleRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should validate a valid cleaning task', () => {
      const validTask = {
        task_id: 'task-001',
        room_id: '501',
        room_number: '501',
        room_type: 'deluxe',
        priority: 'high',
        task_type: 'checkout',
        estimated_duration_minutes: 30,
        special_requirements: ['eco_friendly_products'],
        status: 'pending',
      };
      const result = CleaningTaskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });

    it('should reject cleaning task with invalid priority', () => {
      const invalidTask = {
        task_id: 'task-001',
        room_id: '501',
        room_number: '501',
        room_type: 'deluxe',
        priority: 'urgent', // Invalid priority
        task_type: 'checkout',
        status: 'pending',
      };
      const result = CleaningTaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should validate a valid housekeeper', () => {
      const validHousekeeper = {
        staff_id: 'staff-001',
        name: 'Maria Garcia',
        property_id: 'PROP-001',
        department: 'housekeeping',
        level: 'senior',
        certifications: ['eco_cleaning', 'spa_knowledge'],
        languages: ['english', 'spanish'],
        max_rooms_per_shift: 18,
        efficiency_rating: 92,
      };
      const result = HousekeeperSchema.safeParse(validHousekeeper);
      expect(result.success).toBe(true);
    });

    it('should reject housekeeper with efficiency rating > 100', () => {
      const invalidHousekeeper = {
        staff_id: 'staff-001',
        name: 'Maria Garcia',
        property_id: 'PROP-001',
        department: 'housekeeping',
        level: 'senior',
        efficiency_rating: 110,
      };
      const result = HousekeeperSchema.safeParse(invalidHousekeeper);
      expect(result.success).toBe(false);
    });
  });
});
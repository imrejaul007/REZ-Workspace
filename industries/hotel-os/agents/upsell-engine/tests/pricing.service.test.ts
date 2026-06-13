import { pricingService } from '../src/services';
import { GuestTwinModel, RoomTwinModel, PropertyTwinModel, UpsellOfferModel } from '../src/models';

describe('PricingService', () => {
  let testProperty: any;
  let testRoom: any;
  let testGuest: any;

  beforeEach(async () => {
    // Create test property
    testProperty = await PropertyTwinModel.create({
      property_id: 'test-prop-001',
      brand: 'TestBrand',
      name: 'Test Hotel',
      location: {
        address: '123 Test St',
        city: 'TestCity',
        country: 'US',
        coordinates: { lat: 40.7128, lng: -74.006 },
        timezone: 'America/New_York',
      },
      inventory: {
        total_rooms: 100,
        by_type: { standard: 50, deluxe: 30, suite: 20 },
        available_today: 70,
        available_tomorrow: 65,
      },
      revenue: {
        today_revenue: 10000,
        mtd_revenue: 300000,
        ytd_revenue: 3600000,
        revpar: 150,
        adr: 200,
        occupancy_rate: 75,
      },
      settings: {
        brand_standards_version: '1.0.0',
        upsell_config: {
          max_upgrade_discount: 30,
          min_offer_interval_hours: 24,
          preferred_offer_times: ['10:00', '14:00', '18:00'],
          excluded_rate_codes: [],
          upgrade_thresholds: { occupancy: 70, min_rate: 100 },
        },
        pricing_rules: {
          dynamic_pricing_enabled: true,
          surge_multiplier_max: 1.5,
          weekend_premium: 1.15,
          seasonal_adjustments: [],
        },
      },
    });

    // Create test room
    testRoom = await RoomTwinModel.create({
      room_id: 'room-001',
      property_id: testProperty.property_id,
      room_number: '101',
      room_type: 'standard',
      floor: 1,
      view: 'city',
      revenue: {
        base_rate: 100,
        rack_rate: 150,
        minibar_balance: 0,
        last_rate_update: new Date().toISOString(),
      },
      status: {
        current: 'available',
        next_available: null,
        maintenance_alerts: [],
      },
    });

    // Create deluxe room for upgrade testing
    await RoomTwinModel.create({
      room_id: 'room-002',
      property_id: testProperty.property_id,
      room_number: '201',
      room_type: 'deluxe',
      floor: 2,
      view: 'pool',
      revenue: {
        base_rate: 175,
        rack_rate: 250,
        minibar_balance: 0,
        last_rate_update: new Date().toISOString(),
      },
      status: {
        current: 'available',
        next_available: null,
        maintenance_alerts: [],
      },
    });

    // Create test guest
    testGuest = await GuestTwinModel.create({
      guest_id: 'guest-001',
      property_id: testProperty.property_id,
      profile: {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1987654321',
        nationality: 'US',
        language_preference: 'en',
        accessibility_needs: [],
      },
      loyalty: {
        tier: 'gold',
        points_balance: 5000,
        member_since: '2023-01-01',
        total_stays: 5,
        total_spend: 2500,
      },
      price_sensitivity: 40,
      preferences: {
        room: {
          floor_preference: 'high',
          view_preference: 'ocean',
          temperature_setting: { default: 22, range: { min: 18, max: 26 } },
          noise_tolerance: 5,
        },
        dining: {
          dietary_restrictions: [],
          allergies: [],
          favorite_items: ['Wine', 'Cheese'],
          beverage_preferences: ['Coffee'],
          typical_spend_range: { min: 50, max: 200 },
        },
        amenities: {
          spa_interests: ['Massage'],
          fitness_habits: true,
          pool_usage: true,
          business_amenities: ['WiFi', 'Printer'],
        },
        communication: {
          preferred_channel: 'email',
          opt_ins: [],
          quiet_hours: { start: '22:00', end: '08:00' },
        },
      },
      sentiment: {
        current_score: 85,
        trend: 'stable',
        last_feedback_date: new Date().toISOString(),
        key_topics: ['Cleanliness', 'Service'],
      },
      lifetime_value: {
        clv: 2500,
        potential_clv: 5000,
        churn_risk: 'low',
        recommendation_eligibility: true,
      },
      current_stay: {
        room_id: 'room-001',
        check_in: new Date().toISOString(),
        check_out: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        adults: 2,
        children: 0,
        rate_code: 'BAR',
        special_requests: [],
        occasion: null,
      },
    });
  });

  describe('calculateDynamicPricing', () => {
    it('should calculate dynamic pricing successfully', async () => {
      const decision = await pricingService.calculateDynamicPricing({
        room_id: 'room-001',
        guest_id: 'guest-001',
      });

      expect(decision).toBeDefined();
      expect(decision.room_id).toBe('room-001');
      expect(decision.base_rate).toBe(100);
      expect(decision.final_rate).toBeGreaterThan(0);
      expect(decision.confidence).toBeGreaterThan(0);
      expect(decision.factors).toBeDefined();
      expect(decision.factors.occupancy).toBe(75);
    });

    it('should throw error for non-existent room', async () => {
      await expect(
        pricingService.calculateDynamicPricing({ room_id: 'non-existent-room' })
      ).rejects.toThrow('Room not found');
    });

    it('should include demand factors in decision', async () => {
      const decision = await pricingService.calculateDynamicPricing({
        room_id: 'room-001',
      });

      expect(decision.factors.demand_multiplier).toBeGreaterThan(0);
      expect(decision.factors.day_of_week).toBeDefined();
      expect(decision.factors.season).toBeDefined();
    });
  });

  describe('optimizeUpgradePricing', () => {
    it('should generate upgrade offer successfully', async () => {
      const offer = await pricingService.optimizeUpgradePricing(
        'guest-001',
        'room-001',
        'deluxe'
      );

      expect(offer).toBeDefined();
      expect(offer.offer_type).toBe('upgrade');
      expect(offer.original_price).toBe(75); // 175 - 100
      expect(offer.offer_price).toBeLessThan(offer.original_price);
      expect(offer.discount_percentage).toBeGreaterThan(0);
      expect(offer.savings).toBeGreaterThan(0);
      expect(offer.target_room_type).toBe('deluxe');
      expect(offer.status).toBe('pending');
    });

    it('should save offer to database', async () => {
      const offer = await pricingService.optimizeUpgradePricing(
        'guest-001',
        'room-001',
        'deluxe'
      );

      const savedOffer = await UpsellOfferModel.findOne({ offer_id: offer.offer_id });
      expect(savedOffer).toBeDefined();
      expect(savedOffer?.guest_id).toBe('guest-001');
    });

    it('should throw error for non-existent guest', async () => {
      await expect(
        pricingService.optimizeUpgradePricing('non-existent', 'room-001', 'deluxe')
      ).rejects.toThrow('Guest not found');
    });

    it('should throw error for non-existent room', async () => {
      await expect(
        pricingService.optimizeUpgradePricing('guest-001', 'non-existent', 'deluxe')
      ).rejects.toThrow('Room not found');
    });
  });

  describe('calculateBundlePricing', () => {
    it('should calculate bundle pricing with discount', async () => {
      const items = [
        { item_id: 'dining', original_price: 100 },
        { item_id: 'spa', original_price: 150 },
        { item_id: 'breakfast', original_price: 50 },
      ];

      const result = await pricingService.calculateBundlePricing('guest-001', items);

      expect(result).toBeDefined();
      expect(result.bundle_price).toBeLessThan(300); // Total without discount
      expect(result.discount_percentage).toBeGreaterThan(0);
      expect(result.savings).toBeGreaterThan(0);
    });

    it('should apply higher discount for more items', async () => {
      const twoItems = [
        { item_id: 'dining', original_price: 100 },
        { item_id: 'spa', original_price: 150 },
      ];

      const threeItems = [
        { item_id: 'dining', original_price: 100 },
        { item_id: 'spa', original_price: 150 },
        { item_id: 'breakfast', original_price: 50 },
      ];

      const twoItemResult = await pricingService.calculateBundlePricing('guest-001', twoItems);
      const threeItemResult = await pricingService.calculateBundlePricing('guest-001', threeItems);

      expect(threeItemResult.discount_percentage).toBeGreaterThan(twoItemResult.discount_percentage);
    });

    it('should apply loyalty bonus for gold member', async () => {
      const items = [
        { item_id: 'dining', original_price: 100 },
        { item_id: 'spa', original_price: 150 },
      ];

      const result = await pricingService.calculateBundlePricing('guest-001', items);

      // Gold member should get at least 15% discount (base 15% + loyalty bonus)
      expect(result.discount_percentage).toBeGreaterThan(15);
    });
  });
});

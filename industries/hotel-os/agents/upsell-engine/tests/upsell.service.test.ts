import { upsellService } from '../src/services';
import { GuestTwinModel, RoomTwinModel, PropertyTwinModel, UpsellOfferModel } from '../src/models';

describe('UpsellService', () => {
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

  describe('checkEligibility', () => {
    it('should return eligible for valid guest and room', async () => {
      const eligibility = await upsellService.checkEligibility('guest-001', 'room-001');

      expect(eligibility).toBeDefined();
      expect(eligibility.eligible).toBe(true);
      expect(eligibility.suggested_offers).toContain('upgrade');
    });

    it('should return not eligible for non-existent guest', async () => {
      const eligibility = await upsellService.checkEligibility('non-existent', 'room-001');

      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reasons).toContain('Guest not found');
    });

    it('should return not eligible for opted-out guest', async () => {
      await GuestTwinModel.updateOne(
        { guest_id: 'guest-001' },
        { 'lifetime_value.recommendation_eligibility': false }
      );

      const eligibility = await upsellService.checkEligibility('guest-001', 'room-001');

      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reasons).toContain('Guest has opted out of recommendations');
    });

    it('should suggest late checkout for early checkout times', async () => {
      // Update checkout to afternoon
      await GuestTwinModel.updateOne(
        { guest_id: 'guest-001' },
        {
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
        }
      );

      const eligibility = await upsellService.checkEligibility('guest-001', 'room-001');

      expect(eligibility.suggested_offers).toContain('upgrade');
    });
  });

  describe('generateOffers', () => {
    it('should generate offers successfully', async () => {
      const offers = await upsellService.generateOffers({
        guest_id: 'guest-001',
        room_id: 'room-001',
      });

      expect(offers).toBeDefined();
      expect(offers.length).toBeGreaterThan(0);
      expect(offers[0].offer_id).toBeDefined();
      expect(offers[0].guest_id).toBe('guest-001');
      expect(offers[0].room_id).toBe('room-001');
    });

    it('should generate upgrade offer for standard room', async () => {
      const offers = await upsellService.generateOffers({
        guest_id: 'guest-001',
        room_id: 'room-001',
        offer_type: 'upgrade',
      });

      expect(offers.length).toBe(1);
      expect(offers[0].offer_type).toBe('upgrade');
      expect(offers[0].target_room_type).toBe('deluxe');
    });

    it('should throw error for non-existent guest', async () => {
      await expect(
        upsellService.generateOffers({
          guest_id: 'non-existent',
          room_id: 'room-001',
        })
      ).rejects.toThrow('Guest not found');
    });

    it('should save offers to database', async () => {
      await upsellService.generateOffers({
        guest_id: 'guest-001',
        room_id: 'room-001',
      });

      const savedOffers = await UpsellOfferModel.find({ guest_id: 'guest-001' });
      expect(savedOffers.length).toBeGreaterThan(0);
    });
  });

  describe('respondToOffer', () => {
    it('should accept offer successfully', async () => {
      const offers = await upsellService.generateOffers({
        guest_id: 'guest-001',
        room_id: 'room-001',
        offer_type: 'upgrade',
      });

      const offer = offers[0];
      const responded = await upsellService.respondToOffer(offer.offer_id, 'accepted');

      expect(responded).toBeDefined();
      expect(responded?.status).toBe('accepted');
      expect(responded?.responded_at).toBeDefined();
    });

    it('should decline offer successfully', async () => {
      const offers = await upsellService.generateOffers({
        guest_id: 'guest-001',
        room_id: 'room-001',
        offer_type: 'upgrade',
      });

      const offer = offers[0];
      const responded = await upsellService.respondToOffer(offer.offer_id, 'declined');

      expect(responded).toBeDefined();
      expect(responded?.status).toBe('declined');
    });

    it('should throw error for non-existent offer', async () => {
      await expect(
        upsellService.respondToOffer('non-existent-offer', 'accepted')
      ).rejects.toThrow('Offer not found');
    });

    it('should throw error for already responded offer', async () => {
      const offers = await upsellService.generateOffers({
        guest_id: 'guest-001',
        room_id: 'room-001',
        offer_type: 'upgrade',
      });

      const offer = offers[0];
      await upsellService.respondToOffer(offer.offer_id, 'accepted');

      await expect(
        upsellService.respondToOffer(offer.offer_id, 'declined')
      ).rejects.toThrow('already responded');
    });
  });

  describe('getActiveOffers', () => {
    it('should return active offers for guest', async () => {
      await upsellService.generateOffers({
        guest_id: 'guest-001',
        room_id: 'room-001',
      });

      const offers = await upsellService.getActiveOffers('guest-001');

      expect(offers).toBeDefined();
      expect(offers.length).toBeGreaterThan(0);
      expect(offers[0].status).toBe('pending');
    });

    it('should return empty array for guest with no offers', async () => {
      const offers = await upsellService.getActiveOffers('guest-001');
      expect(offers).toBeDefined();
      expect(offers.length).toBe(0);
    });
  });

  describe('markOfferShown', () => {
    it('should mark offer as shown', async () => {
      const offers = await upsellService.generateOffers({
        guest_id: 'guest-001',
        room_id: 'room-001',
        offer_type: 'upgrade',
      });

      const offer = offers[0];
      await upsellService.markOfferShown(offer.offer_id);

      const updatedOffer = await UpsellOfferModel.findOne({ offer_id: offer.offer_id });
      expect(updatedOffer?.status).toBe('shown');
      expect(updatedOffer?.shown_at).toBeDefined();
    });
  });
});

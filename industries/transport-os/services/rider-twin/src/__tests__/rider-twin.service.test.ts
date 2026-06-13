/**
 * Rider Twin Service Tests
 */

import { RiderTwinService } from '../services/rider-twin.service';
import { CreateRiderRequest, AddPaymentMethodRequest, AddAddressRequest } from '../models/types';

describe('RiderTwinService', () => {
  let service: RiderTwinService;

  beforeEach(() => {
    service = new RiderTwinService();
  });

  describe('create', () => {
    it('should create a new rider with default values', async () => {
      const request: CreateRiderRequest = {
        profile: {
          first: 'John',
          last: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
        },
      };

      const rider = await service.create(request);

      expect(rider).toBeDefined();
      expect(rider.rider_id).toMatch(/^RID-/);
      expect(rider.profile.first).toBe('John');
      expect(rider.profile.last).toBe('Doe');
      expect(rider.profile.email).toBe('john.doe@example.com');
      expect(rider.loyalty.tier).toBe('basic');
      expect(rider.activity.total_trips).toBe(0);
      expect(rider.preferences.preferred_vehicle_type).toBe('economy');
    });

    it('should create a rider with custom preferences', async () => {
      const request: CreateRiderRequest = {
        profile: {
          first: 'Jane',
          last: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+1234567891',
        },
        preferences: {
          preferred_vehicle_type: 'comfort',
          smoking_policy: 'no_smoking',
          air_conditioning: 'on',
        },
      };

      const rider = await service.create(request);

      expect(rider.preferences.preferred_vehicle_type).toBe('comfort');
      expect(rider.preferences.smoking_policy).toBe('no_smoking');
      expect(rider.preferences.air_conditioning).toBe('on');
    });
  });

  describe('get', () => {
    it('should retrieve an existing rider', async () => {
      const request: CreateRiderRequest = {
        profile: {
          first: 'Test',
          last: 'User',
          email: 'test@example.com',
          phone: '+1234567892',
        },
      };

      const created = await service.create(request);
      const retrieved = await service.get(created.rider_id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.rider_id).toBe(created.rider_id);
      expect(retrieved?.profile.email).toBe('test@example.com');
    });

    it('should return null for non-existent rider', async () => {
      const result = await service.get('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update rider profile', async () => {
      const created = await service.create({
        profile: {
          first: 'Original',
          last: 'Name',
          email: 'original@example.com',
          phone: '+1234567893',
        },
      });

      const updated = await service.update(created.rider_id, {
        profile: {
          first: 'Updated',
          last: 'Name',
        },
      });

      expect(updated).toBeDefined();
      expect(updated?.profile.first).toBe('Updated');
      expect(updated?.profile.last).toBe('Name');
      expect(updated?.profile.email).toBe('original@example.com');
    });

    it('should update rider preferences', async () => {
      const created = await service.create({
        profile: {
          first: 'Pref',
          last: 'Test',
          email: 'pref@example.com',
          phone: '+1234567894',
        },
      });

      const updated = await service.update(created.rider_id, {
        preferences: {
          preferred_vehicle_type: 'premium',
          music_preference: 'quiet',
        },
      });

      expect(updated?.preferences.preferred_vehicle_type).toBe('premium');
      expect(updated?.preferences.music_preference).toBe('quiet');
    });
  });

  describe('delete', () => {
    it('should delete an existing rider', async () => {
      const created = await service.create({
        profile: {
          first: 'Delete',
          last: 'Me',
          email: 'delete@example.com',
          phone: '+1234567895',
        },
      });

      const deleted = await service.delete(created.rider_id);
      expect(deleted).toBe(true);

      const retrieved = await service.get(created.rider_id);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent rider', async () => {
      const deleted = await service.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('search', () => {
    it('should find riders by email', async () => {
      await service.create({
        profile: {
          first: 'Search',
          last: 'Test',
          email: 'searchable@example.com',
          phone: '+1234567896',
        },
      });

      const results = await service.search('searchable@example.com');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].profile.email).toBe('searchable@example.com');
    });

    it('should find riders by phone', async () => {
      await service.create({
        profile: {
          first: 'Phone',
          last: 'Search',
          email: 'phone@example.com',
          phone: '+1987654321',
        },
      });

      const results = await service.search('1987654321');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('list', () => {
    it('should list riders with pagination', async () => {
      // Create multiple riders
      for (let i = 0; i < 5; i++) {
        await service.create({
          profile: {
            first: `User${i}`,
            last: 'List',
            email: `list${i}@example.com`,
            phone: `+1111111${i}`,
          },
        });
      }

      const result = await service.list({ page: 1, limit: 3 });
      expect(result.data.length).toBeLessThanOrEqual(3);
      expect(result.pagination.total).toBeGreaterThanOrEqual(5);
    });
  });

  describe('payment methods', () => {
    it('should add a payment method', async () => {
      const created = await service.create({
        profile: {
          first: 'Payment',
          last: 'Test',
          email: 'payment@example.com',
          phone: '+1234567897',
        },
      });

      const paymentMethod: AddPaymentMethodRequest = {
        card_id: 'card_123',
        last_four: '4242',
        brand: 'Visa',
        set_as_default: true,
      };

      const updated = await service.addPaymentMethod(created.rider_id, paymentMethod);

      expect(updated?.payment.saved_cards.length).toBe(1);
      expect(updated?.payment.saved_cards[0].last_four).toBe('4242');
      expect(updated?.payment.default_payment_method).toBe('card_123');
    });

    it('should remove a payment method', async () => {
      const created = await service.create({
        profile: {
          first: 'Remove',
          last: 'Payment',
          email: 'remove@example.com',
          phone: '+1234567898',
        },
      });

      await service.addPaymentMethod(created.rider_id, {
        card_id: 'card_remove',
        last_four: '1234',
        brand: 'Mastercard',
      });

      const updated = await service.removePaymentMethod(created.rider_id, 'card_remove');

      expect(updated?.payment.saved_cards.length).toBe(0);
    });
  });

  describe('addresses', () => {
    it('should add home address', async () => {
      const created = await service.create({
        profile: {
          first: 'Address',
          last: 'Test',
          email: 'address@example.com',
          phone: '+1234567899',
        },
      });

      const address: AddAddressRequest = {
        type: 'home',
        label: 'Home',
        address: '123 Main Street',
        lat: 25.2048,
        lng: 55.2708,
      };

      const updated = await service.addAddress(created.rider_id, address);

      expect(updated?.addresses.home).toBeDefined();
      expect(updated?.addresses.home?.address).toBe('123 Main Street');
    });

    it('should add favorite addresses', async () => {
      const created = await service.create({
        profile: {
          first: 'Fav',
          last: 'Address',
          email: 'fav@example.com',
          phone: '+1234567800',
        },
      });

      await service.addAddress(created.rider_id, {
        type: 'favorite',
        label: 'Gym',
        address: '456 Fitness Ave',
        lat: 25.2100,
        lng: 55.2800,
      });

      const rider = await service.get(created.rider_id);
      expect(rider?.addresses.favorites.length).toBe(1);
      expect(rider?.addresses.favorites[0].label).toBe('Gym');
    });
  });

  describe('loyalty', () => {
    it('should add loyalty points', async () => {
      const created = await service.create({
        profile: {
          first: 'Loyal',
          last: 'Customer',
          email: 'loyal@example.com',
          phone: '+1234567801',
        },
      });

      const updated = await service.addLoyaltyPoints(created.rider_id, 500, 'First ride bonus');

      expect(updated?.loyalty.points_balance).toBe(500);
      expect(updated?.loyalty.lifetime_points).toBe(500);
    });

    it('should upgrade tier when threshold is reached', async () => {
      const created = await service.create({
        profile: {
          first: 'Upgrade',
          last: 'Test',
          email: 'upgrade@example.com',
          phone: '+1234567802',
        },
      });

      // Add enough points to reach silver tier (1000)
      await service.addLoyaltyPoints(created.rider_id, 1200, 'Welcome bonus');

      const rider = await service.get(created.rider_id);
      expect(rider?.loyalty.tier).toBe('silver');
    });

    it('should redeem loyalty points', async () => {
      const created = await service.create({
        profile: {
          first: 'Redeem',
          last: 'Test',
          email: 'redeem@example.com',
          phone: '+1234567803',
        },
      });

      await service.addLoyaltyPoints(created.rider_id, 1000, 'Initial points');
      const result = await service.redeemLoyaltyPoints(created.rider_id, 500);

      expect(result.success).toBe(true);
      const rider = await service.get(created.rider_id);
      expect(rider?.loyalty.points_balance).toBe(500);
    });

    it('should fail redemption with insufficient points', async () => {
      const created = await service.create({
        profile: {
          first: 'Insufficient',
          last: 'Points',
          email: 'insufficient@example.com',
          phone: '+1234567804',
        },
      });

      const result = await service.redeemLoyaltyPoints(created.rider_id, 1000);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Insufficient points');
    });
  });

  describe('activity tracking', () => {
    it('should update activity on journey completed', async () => {
      const created = await service.create({
        profile: {
          first: 'Activity',
          last: 'Track',
          email: 'activity@example.com',
          phone: '+1234567805',
        },
      });

      await service.updateActivity(created.rider_id, 'journey_completed', {
        fare: 50,
        from: 'Location A',
        to: 'Location B',
      });

      const rider = await service.get(created.rider_id);
      expect(rider?.activity.total_trips).toBe(1);
      expect(rider?.activity.total_spend).toBe(50);
      expect(rider?.activity.avg_trip_cost).toBe(50);
    });

    it('should track favorite routes', async () => {
      const created = await service.create({
        profile: {
          first: 'Routes',
          last: 'Track',
          email: 'routes@example.com',
          phone: '+1234567806',
        },
      });

      // Complete same route multiple times
      for (let i = 0; i < 3; i++) {
        await service.updateActivity(created.rider_id, 'journey_completed', {
          from: 'Home',
          to: 'Work',
        });
      }

      const rider = await service.get(created.rider_id);
      expect(rider?.activity.favorite_routes.length).toBe(1);
      expect(rider?.activity.favorite_routes[0].count).toBe(3);
    });
  });

  describe('analytics', () => {
    it('should return complete analytics', async () => {
      const created = await service.create({
        profile: {
          first: 'Analytics',
          last: 'Test',
          email: 'analytics@example.com',
          phone: '+1234567807',
        },
      });

      await service.addLoyaltyPoints(created.rider_id, 2000, 'Test points');
      await service.updateActivity(created.rider_id, 'journey_completed', {
        fare: 100,
        from: 'A',
        to: 'B',
      });

      const analytics = await service.getAnalytics(created.rider_id);

      expect(analytics).toBeDefined();
      expect(analytics?.rider_id).toBe(created.rider_id);
      expect(analytics?.activity_summary.total_trips).toBe(1);
      expect(analytics?.loyalty_summary.tier).toBe('silver');
      expect(analytics?.loyalty_summary.points_balance).toBe(2000);
    });
  });
});

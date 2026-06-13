import { GuestTwinService } from '../src/services/guest-twin.service.js';
import { GuestTwinModel } from '../src/models/index.js';
import { resetEventEmitter } from '../src/events/index.js';

describe('GuestTwinService', () => {
  let service: GuestTwinService;

  beforeEach(() => {
    service = new GuestTwinService();
    resetEventEmitter();
  });

  afterEach(async () => {
    await GuestTwinModel.deleteMany({});
  });

  describe('create', () => {
    it('should create a new guest twin', async () => {
      const data = {
        guest_id: 'G-001',
        profile: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          nationality: 'US',
          language_preference: 'en',
          accessibility_needs: [],
        },
        property_id: 'PROP-001',
      };

      const result = await service.create(data);

      expect(result).toBeDefined();
      expect(result.guest_id).toBe('G-001');
      expect(result.twin_id).toBe('twin.hotel.guest.G-001');
      expect(result.profile.name).toBe('John Doe');
      expect(result.profile.email).toBe('john@example.com');
      expect(result.loyalty.tier).toBe('bronze');
      expect(result.preferences).toBeDefined();
      expect(result.sentiment).toBeDefined();
    });

    it('should throw error if guest already exists', async () => {
      const data = {
        guest_id: 'G-002',
        profile: {
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      };

      await service.create(data);

      await expect(service.create(data)).rejects.toThrow('already exists');
    });

    it('should create with custom loyalty data', async () => {
      const data = {
        guest_id: 'G-003',
        profile: {
          name: 'Gold Member',
          email: 'gold@example.com',
        },
        loyalty: {
          tier: 'gold' as const,
          points_balance: 5000,
          total_stays: 10,
          total_spend: 5000,
        },
      };

      const result = await service.create(data);

      expect(result.loyalty.tier).toBe('gold');
      expect(result.loyalty.points_balance).toBe(5000);
      expect(result.loyalty.total_stays).toBe(10);
    });

    it('should create with preferences', async () => {
      const data = {
        guest_id: 'G-004',
        profile: {
          name: 'Preferences Test',
          email: 'pref@example.com',
        },
        preferences: {
          room: {
            floor_preference: 'high',
            view_preference: 'ocean' as const,
            temperature_setting: { default: 72 },
          },
          dining: {
            dietary_restrictions: ['vegetarian'],
            allergies: ['peanuts'],
          },
        },
      };

      const result = await service.create(data);

      expect(result.preferences.room.floor_preference).toBe('high');
      expect(result.preferences.room.view_preference).toBe('ocean');
      expect(result.preferences.dining.dietary_restrictions).toContain('vegetarian');
      expect(result.preferences.dining.allergies).toContain('peanuts');
    });
  });

  describe('getById', () => {
    it('should return guest twin by guest_id', async () => {
      const data = {
        guest_id: 'G-005',
        profile: { name: 'Get Test', email: 'get@example.com' },
      };

      await service.create(data);
      const result = await service.getById('G-005');

      expect(result).toBeDefined();
      expect(result?.guest_id).toBe('G-005');
    });

    it('should return null for non-existent guest', async () => {
      const result = await service.getById('NON-EXISTENT');
      expect(result).toBeNull();
    });
  });

  describe('getByTwinId', () => {
    it('should return guest twin by twin_id', async () => {
      const data = {
        guest_id: 'G-006',
        profile: { name: 'Twin ID Test', email: 'twinid@example.com' },
      };

      await service.create(data);
      const result = await service.getByTwinId('twin.hotel.guest.G-006');

      expect(result).toBeDefined();
      expect(result?.guest_id).toBe('G-006');
    });
  });

  describe('update', () => {
    it('should update guest twin', async () => {
      const data = {
        guest_id: 'G-007',
        profile: { name: 'Original Name', email: 'update@example.com' },
      };

      await service.create(data);

      const result = await service.update('G-007', {
        profile: { ...data.profile, name: 'Updated Name' },
      });

      expect(result).toBeDefined();
      expect(result?.profile.name).toBe('Updated Name');
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences with merge', async () => {
      const data = {
        guest_id: 'G-008',
        profile: { name: 'Pref Test', email: 'pref@example.com' },
        preferences: {
          room: { floor_preference: 'low' },
          dining: { dietary_restrictions: ['gluten-free'] },
        },
      };

      await service.create(data);

      const result = await service.updatePreferences('G-008', {
        preferences: {
          room: { view_preference: 'garden' as const },
          dining: { favorite_items: ['pasta'] },
        },
        merge: true,
      });

      expect(result?.preferences.room.floor_preference).toBe('low'); // Preserved
      expect(result?.preferences.room.view_preference).toBe('garden'); // Updated
      expect(result?.preferences.dining.dietary_restrictions).toContain('gluten-free'); // Preserved
      expect(result?.preferences.dining.favorite_items).toContain('pasta'); // Added
    });

    it('should replace preferences without merge', async () => {
      const data = {
        guest_id: 'G-009',
        profile: { name: 'Pref Test', email: 'pref2@example.com' },
        preferences: {
          room: { floor_preference: 'low' },
          dining: { dietary_restrictions: ['gluten-free'] },
        },
      };

      await service.create(data);

      const result = await service.updatePreferences('G-009', {
        preferences: {
          room: { view_preference: 'ocean' as const },
          dining: { favorite_items: ['sushi'] },
        },
        merge: false,
      });

      expect(result?.preferences.room.floor_preference).toBeUndefined(); // Replaced
      expect(result?.preferences.room.view_preference).toBe('ocean'); // New value
      expect(result?.preferences.dining.dietary_restrictions).toHaveLength(0); // Replaced
    });
  });

  describe('updateSentiment', () => {
    it('should update sentiment and detect trend', async () => {
      const data = {
        guest_id: 'G-010',
        profile: { name: 'Sentiment Test', email: 'sentiment@example.com' },
        sentiment: {
          current_score: 60,
          trend: 'stable' as const,
        },
      };

      await service.create(data);

      const result = await service.updateSentiment('G-010', {
        score: 80,
        feedback_date: new Date().toISOString(),
      });

      expect(result?.sentiment.current_score).toBe(80);
      expect(result?.sentiment.trend).toBe('improving');
    });

    it('should detect declining trend', async () => {
      const data = {
        guest_id: 'G-011',
        profile: { name: 'Declining Test', email: 'declining@example.com' },
        sentiment: {
          current_score: 80,
          trend: 'stable' as const,
        },
      };

      await service.create(data);

      const result = await service.updateSentiment('G-011', {
        score: 40,
      });

      expect(result?.sentiment.current_score).toBe(40);
      expect(result?.sentiment.trend).toBe('declining');
    });
  });

  describe('checkIn', () => {
    it('should process guest check-in', async () => {
      const data = {
        guest_id: 'G-012',
        profile: { name: 'CheckIn Test', email: 'checkin@example.com' },
      };

      await service.create(data);

      const result = await service.checkIn('G-012', {
        room_id: '501',
        check_in: new Date().toISOString(),
        check_out: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        adults: 2,
        children: 1,
        occasion: 'anniversary',
      });

      expect(result?.current_stay.room_id).toBe('501');
      expect(result?.current_stay.adults).toBe(2);
      expect(result?.current_stay.children).toBe(1);
      expect(result?.loyalty.total_stays).toBe(1);
    });

    it('should throw error if already checked in', async () => {
      const data = {
        guest_id: 'G-013',
        profile: { name: 'Double CheckIn', email: 'doublecheckin@example.com' },
      };

      await service.create(data);

      await service.checkIn('G-013', {
        room_id: '502',
        check_in: new Date().toISOString(),
        check_out: new Date().toISOString(),
      });

      await expect(
        service.checkIn('G-013', {
          room_id: '503',
          check_in: new Date().toISOString(),
          check_out: new Date().toISOString(),
        })
      ).rejects.toThrow('already checked in');
    });
  });

  describe('checkOut', () => {
    it('should process guest check-out and update history', async () => {
      const data = {
        guest_id: 'G-014',
        profile: { name: 'CheckOut Test', email: 'checkout@example.com' },
      };

      await service.create(data);

      await service.checkIn('G-014', {
        room_id: '504',
        check_in: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        check_out: new Date().toISOString(),
      });

      const result = await service.checkOut('G-014', {
        rating: 5,
        feedback: 'Great stay!',
        total_spend: 450,
      });

      expect(result?.current_stay.room_id).toBeUndefined();
      expect(result?.stay_history).toHaveLength(1);
      expect(result?.stay_history[0].room_id).toBe('504');
      expect(result?.stay_history[0].total_spend).toBe(450);
      expect(result?.stay_history[0].rating).toBe(5);
      expect(result?.loyalty.total_spend).toBe(450);
    });

    it('should throw error if not checked in', async () => {
      const data = {
        guest_id: 'G-015',
        profile: { name: 'No CheckIn', email: 'nocheckin@example.com' },
      };

      await service.create(data);

      await expect(
        service.checkOut('G-015', { total_spend: 100 })
      ).rejects.toThrow('not checked in');
    });
  });

  describe('updateLoyalty', () => {
    it('should update loyalty tier', async () => {
      const data = {
        guest_id: 'G-016',
        profile: { name: 'Loyalty Test', email: 'loyalty@example.com' },
        loyalty: { tier: 'silver' as const },
      };

      await service.create(data);

      const result = await service.updateLoyalty('G-016', { tier: 'gold' });

      expect(result?.loyalty.tier).toBe('gold');
    });

    it('should update points balance', async () => {
      const data = {
        guest_id: 'G-017',
        profile: { name: 'Points Test', email: 'points@example.com' },
      };

      await service.create(data);

      const result = await service.updateLoyalty('G-017', { points_balance: 10000 });

      expect(result?.loyalty.points_balance).toBe(10000);
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      // Create multiple guests
      const guests = [
        { guest_id: 'G-018', profile: { name: 'Guest 1', email: 'g1@example.com' }, property_id: 'PROP-001' },
        { guest_id: 'G-019', profile: { name: 'Guest 2', email: 'g2@example.com' }, property_id: 'PROP-001' },
        { guest_id: 'G-020', profile: { name: 'Guest 3', email: 'g3@example.com' }, property_id: 'PROP-002' },
      ];

      for (const guest of guests) {
        await service.create(guest);
      }
    });

    it('should list all guests with pagination', async () => {
      const result = await service.list({ page: 1, limit: 10 });

      expect(result.total).toBe(3);
      expect(result.twins).toHaveLength(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by property_id', async () => {
      const result = await service.list({ property_id: 'PROP-001' });

      expect(result.total).toBe(2);
      expect(result.twins.every(t => t.property_id === 'PROP-001')).toBe(true);
    });

    it('should paginate correctly', async () => {
      const result = await service.list({ page: 1, limit: 2 });

      expect(result.total).toBe(3);
      expect(result.twins).toHaveLength(2);
      expect(result.twins[0].guest_id).toBe('G-018');
      expect(result.twins[1].guest_id).toBe('G-019');
    });
  });

  describe('delete', () => {
    it('should delete guest twin', async () => {
      const data = {
        guest_id: 'G-021',
        profile: { name: 'Delete Test', email: 'delete@example.com' },
      };

      await service.create(data);

      const deleted = await service.delete('G-021');
      expect(deleted).toBe(true);

      const result = await service.getById('G-021');
      expect(result).toBeNull();
    });

    it('should return false for non-existent guest', async () => {
      const deleted = await service.delete('NON-EXISTENT');
      expect(deleted).toBe(false);
    });
  });
});
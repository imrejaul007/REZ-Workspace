/**
 * Guest Twin Service Tests
 */

import {
  GuestTwinService,
} from '../src/services';

describe('GuestTwinService', () => {
  let service: GuestTwinService;

  beforeEach(() => {
    service = new GuestTwinService('http://localhost:8447');
  });

  describe('createGuestTwin', () => {
    it('should create a new guest twin with required fields', async () => {
      const input = {
        guest_id: 'G-001',
        profile: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          nationality: 'USA',
          language_preference: 'en',
          accessibility_needs: [],
        },
      };

      const result = await service.createGuestTwin(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.twin_id).toBe('twin.hotel.guest.G-001');
      expect(result.data?.guest_id).toBe('G-001');
      expect(result.data?.profile.name).toBe('John Doe');
      expect(result.data?.version).toBe(1);
      expect(result.data?.created_at).toBeDefined();
      expect(result.data?.updated_at).toBeDefined();
    });

    it('should create a guest twin with all optional fields', async () => {
      const now = new Date().toISOString();
      const input = {
        guest_id: 'G-002',
        profile: {
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+1234567891',
          language_preference: 'en',
          accessibility_needs: [],
        },
        loyalty: {
          tier: 'gold' as const,
          points_balance: 5000,
          member_since: now,
          total_stays: 10,
          total_spend: 15000,
        },
        preferences: {
          room: {
            floor_preference: 'high',
            view_preference: 'ocean',
            temperature_setting: { default: 70, range: { min: 65, max: 80 } },
          },
          dining: {
            dietary_restrictions: ['vegetarian'],
            allergies: ['peanuts'],
            favorite_items: ['pasta', 'wine'],
            beverage_preferences: ['sparkling water'],
          },
          amenities: {
            spa_interests: ['massage'],
            fitness_habits: true,
            pool_usage: true,
            business_amenities: ['printer'],
          },
          communication: {
            preferred_channel: 'app_push' as const,
            opt_ins: ['promotions'],
          },
        },
        current_stay: {
          room_id: '301',
          check_in: now,
          check_out: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          adults: 2,
          children: 0,
          rate_code: 'GOLD-PACKAGE',
          special_requests: ['late checkout'],
          occasion: 'anniversary',
        },
      };

      const result = await service.createGuestTwin(input);

      expect(result.success).toBe(true);
      expect(result.data?.loyalty.tier).toBe('gold');
      expect(result.data?.preferences.dining.dietary_restrictions).toContain('vegetarian');
      expect(result.data?.current_stay?.room_id).toBe('301');
      expect(result.data?.current_stay?.occasion).toBe('anniversary');
    });

    it('should throw TwinAlreadyExistsError for duplicate guest', async () => {
      const input = {
        guest_id: 'G-003',
        profile: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567892',
          language_preference: 'en',
          accessibility_needs: [],
        },
      };

      await service.createGuestTwin(input);

      await expect(service.createGuestTwin(input)).rejects.toThrow(
        'Guest Twin already exists'
      );
    });
  });

  describe('getGuestTwin', () => {
    it('should retrieve an existing guest twin', async () => {
      // First create a twin
      const createResult = await service.createGuestTwin({
        guest_id: 'G-004',
        profile: {
          name: 'Retrieve Test',
          email: 'retrieve@example.com',
          phone: '+1234567893',
          language_preference: 'en',
          accessibility_needs: [],
        },
      });

      const twinId = createResult.data?.guest_id || 'G-004';

      // Then retrieve it
      const result = await service.getGuestTwin(twinId);

      expect(result.success).toBe(true);
      expect(result.data?.guest_id).toBe(twinId);
      expect(result.data?.profile.name).toBe('Retrieve Test');
    });

    it('should throw TwinNotFoundError for non-existent guest', async () => {
      await expect(service.getGuestTwin('NON-EXISTENT')).rejects.toThrow(
        'Guest Twin not found'
      );
    });
  });

  describe('updatePreferences', () => {
    it('should update guest preferences', async () => {
      // Create a guest first
      await service.createGuestTwin({
        guest_id: 'G-005',
        profile: {
          name: 'Update Test',
          email: 'update@example.com',
          phone: '+1234567894',
          language_preference: 'en',
          accessibility_needs: [],
        },
      });

      const result = await service.updatePreferences('G-005', {
        room: {
          floor_preference: 'high',
          noise_tolerance: 8,
        },
        dining: {
          allergies: ['shellfish'],
        },
      });

      expect(result.success).toBe(true);
      expect(result.data?.preferences.room.floor_preference).toBe('high');
      expect(result.data?.preferences.room.noise_tolerance).toBe(8);
      expect(result.data?.preferences.dining.allergies).toContain('shellfish');
      expect(result.data?.version).toBe(2);
    });
  });

  describe('updateCurrentStay', () => {
    it('should update current stay information', async () => {
      await service.createGuestTwin({
        guest_id: 'G-006',
        profile: {
          name: 'Stay Test',
          email: 'stay@example.com',
          phone: '+1234567895',
          language_preference: 'en',
          accessibility_needs: [],
        },
      });

      const now = new Date().toISOString();
      const checkOut = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

      const result = await service.updateCurrentStay('G-006', {
        room_id: '201',
        check_in: now,
        check_out: checkOut,
        adults: 2,
        children: 1,
        rate_code: 'FAMILY-PACKAGE',
        special_requests: ['extra towels'],
        occasion: 'birthday',
      });

      expect(result.success).toBe(true);
      expect(result.data?.current_stay?.room_id).toBe('201');
      expect(result.data?.current_stay?.adults).toBe(2);
      expect(result.data?.current_stay?.occasion).toBe('birthday');
    });
  });

  describe('updateSentiment', () => {
    it('should update guest sentiment score', async () => {
      await service.createGuestTwin({
        guest_id: 'G-007',
        profile: {
          name: 'Sentiment Test',
          email: 'sentiment@example.com',
          phone: '+1234567896',
          language_preference: 'en',
          accessibility_needs: [],
        },
      });

      const result = await service.updateSentiment(
        'G-007',
        85,
        'improving',
        ['great_service', 'clean_room']
      );

      expect(result.success).toBe(true);
      expect(result.data?.sentiment.current_score).toBe(85);
      expect(result.data?.sentiment.trend).toBe('improving');
      expect(result.data?.sentiment.key_topics).toContain('great_service');
    });

    it('should clamp sentiment score between 0 and 100', async () => {
      await service.createGuestTwin({
        guest_id: 'G-008',
        profile: {
          name: 'Clamp Test',
          email: 'clamp@example.com',
          phone: '+1234567897',
          language_preference: 'en',
          accessibility_needs: [],
        },
      });

      const result = await service.updateSentiment('G-008', 150, 'stable');

      expect(result.data?.sentiment.current_score).toBe(100);

      const result2 = await service.updateSentiment('G-008', -20, 'stable');

      expect(result2.data?.sentiment.current_score).toBe(0);
    });
  });

  describe('deleteGuestTwin', () => {
    it('should delete an existing guest twin', async () => {
      await service.createGuestTwin({
        guest_id: 'G-009',
        profile: {
          name: 'Delete Test',
          email: 'delete@example.com',
          phone: '+1234567898',
          language_preference: 'en',
          accessibility_needs: [],
        },
      });

      const result = await service.deleteGuestTwin('G-009');

      expect(result.success).toBe(true);
      expect(result.data?.deleted).toBe(true);

      // Verify twin is deleted
      await expect(service.getGuestTwin('G-009')).rejects.toThrow('Guest Twin not found');
    });

    it('should throw TwinNotFoundError when deleting non-existent guest', async () => {
      await expect(service.deleteGuestTwin('NON-EXISTENT')).rejects.toThrow(
        'Guest Twin not found'
      );
    });
  });

  describe('getAllGuestTwins', () => {
    it('should return all guest twins', async () => {
      const result = await service.getAllGuestTwins();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });
});

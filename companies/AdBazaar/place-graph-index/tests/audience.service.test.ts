import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the dependencies before importing the service
jest.mock('../src/models/place.model.js', () => {
  const mockPlace = {
    placeId: 'place_test_123',
    name: 'Test Mall',
    type: 'mall',
    category: 'Shopping',
    address: { city: 'Bangalore' },
    location: { lat: 12.9352, lng: 77.7015 },
    attributes: { visitorCount: 10000 },
    audienceProfile: {
      demographics: {
        ageGroups: { '18-24': 30, '25-34': 40 },
        genderSplit: { male: 50, female: 50 },
        incomeLevel: 'upper-middle',
      },
      visitorPatterns: {
        peakHours: ['10:00-12:00'],
        busyDays: ['Saturday'],
        seasonalTrends: ['festival'],
      },
      commonPurposes: ['shopping', 'dining'],
    },
    toObject: jest.fn().mockReturnThis(),
  };

  return {
    Place: {
      findByPlaceId: jest.fn().mockResolvedValue(mockPlace),
    },
  };
});

jest.mock('../src/services/cache.service.js', () => ({
  cacheService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true),
    delete: jest.fn().mockResolvedValue(true),
    invalidatePattern: jest.fn().mockResolvedValue(1),
  },
}));

describe('AudienceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateAudienceEstimate', () => {
    it('should calculate audience estimate for a place', async () => {
      // Import after mocks are set up
      const { audienceService } = await import('../src/services/audience.service.js');

      const estimate = await audienceService.getAudienceEstimate('place_test_123');

      expect(estimate).toBeDefined();
      expect(estimate?.placeId).toBe('place_test_123');
      expect(estimate?.placeName).toBe('Test Mall');
      expect(estimate?.estimatedDaily).toBeGreaterThan(0);
      expect(estimate?.estimatedMonthly).toBeGreaterThan(0);
    });

    it('should return null for non-existent place', async () => {
      const { Place } = await import('../src/models/place.model.js');
      (Place.findByPlaceId as jest.Mock).mockResolvedValueOnce(null);

      const { audienceService } = await import('../src/services/audience.service.js');

      const estimate = await audienceService.getAudienceEstimate('non_existent');

      expect(estimate).toBeNull();
    });

    it('should include demographics in estimate', async () => {
      const { audienceService } = await import('../src/services/audience.service.js');

      const estimate = await audienceService.getAudienceEstimate('place_test_123');

      expect(estimate?.demographics).toBeDefined();
      expect(estimate?.demographics.ageGroups).toBeDefined();
      expect(estimate?.demographics.genderSplit).toBeDefined();
      expect(estimate?.demographics.incomeLevel).toBeDefined();
    });

    it('should include peak times in estimate', async () => {
      const { audienceService } = await import('../src/services/audience.service.js');

      const estimate = await audienceService.getAudienceEstimate('place_test_123');

      expect(estimate?.peakTimes).toBeDefined();
      expect(estimate?.peakTimes.morning).toBeGreaterThanOrEqual(0);
      expect(estimate?.peakTimes.afternoon).toBeGreaterThanOrEqual(0);
      expect(estimate?.peakTimes.evening).toBeGreaterThanOrEqual(0);
      expect(estimate?.peakTimes.night).toBeGreaterThanOrEqual(0);
    });

    it('should include reachability scores', async () => {
      const { audienceService } = await import('../src/services/audience.service.js');

      const estimate = await audienceService.getAudienceEstimate('place_test_123');

      expect(estimate?.reachability).toBeDefined();
      expect(estimate?.reachability.transitScore).toBeGreaterThan(0);
      expect(estimate?.reachability.parkingScore).toBeGreaterThan(0);
      expect(estimate?.reachability.accessibilityScore).toBeGreaterThan(0);
    });
  });

  describe('compareAudience', () => {
    it('should compare audience for multiple places', async () => {
      const { audienceService } = await import('../src/services/audience.service.js');

      const estimates = await audienceService.compareAudience(['place_test_123']);

      expect(estimates).toBeDefined();
      expect(Array.isArray(estimates)).toBe(true);
    });
  });
});

describe('EventBusService', () => {
  it('should export eventBus singleton', async () => {
    const { eventBus } = await import('../src/services/event-bus.service.js');

    expect(eventBus).toBeDefined();
    expect(typeof eventBus.publish).toBe('function');
    expect(typeof eventBus.subscribe).toBe('function');
  });

  it('should publish events', async () => {
    const { eventBus } = await import('../src/services/event-bus.service.js');

    const handler = jest.fn();
    eventBus.subscribe('place_created', handler);

    eventBus.publish('place_created', {
      placeId: 'test_123',
      data: { name: 'Test Place' },
    });

    expect(handler).toHaveBeenCalled();
  });
});
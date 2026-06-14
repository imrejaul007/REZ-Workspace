import { describe, it, expect } from 'vitest';
import {
  CreateEventSchema,
  UpdateEventSchema,
  NearbyEventsQuerySchema,
  EventGraphQuerySchema,
  EventTypeEnum,
  EventStatusEnum,
  LocationSchema
} from '../src/types/index.js';

describe('Type Schemas', () => {
  describe('EventTypeEnum', () => {
    it('should validate valid event types', () => {
      const validTypes = ['wedding', 'festival', 'conference', 'sports', 'religious', 'community', 'corporate', 'entertainment', 'political', 'other'];

      validTypes.forEach(type => {
        const result = EventTypeEnum.safeParse(type);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid event types', () => {
      const result = EventTypeEnum.safeParse('invalid_type');
      expect(result.success).toBe(false);
    });
  });

  describe('EventStatusEnum', () => {
    it('should validate valid statuses', () => {
      const validStatuses = ['planned', 'announced', 'active', 'completed', 'cancelled'];

      validStatuses.forEach(status => {
        const result = EventStatusEnum.safeParse(status);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('LocationSchema', () => {
    it('should validate valid location', () => {
      const location = {
        type: 'Point' as const,
        coordinates: [72.8777, 19.0760] as [number, number],
        city: 'Mumbai',
        state: 'Maharashtra'
      };

      const result = LocationSchema.safeParse(location);
      expect(result.success).toBe(true);
    });

    it('should reject invalid coordinates', () => {
      const location = {
        type: 'Point' as const,
        coordinates: [200, 100] as [number, number] // Invalid longitude
      };

      const result = LocationSchema.safeParse(location);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateEventSchema', () => {
    it('should validate a complete event', () => {
      const event = {
        name: 'IPL Finals Watch Party',
        type: 'sports',
        description: 'Watch the IPL finals with friends',
        date: '2026-06-15',
        expectedFootfall: 30000,
        location: {
          type: 'Point' as const,
          coordinates: [72.8777, 19.0760] as [number, number],
          city: 'Mumbai'
        },
        organizer: {
          name: 'REZ Sports Club',
          type: 'organization' as const
        },
        tags: ['sports', 'entertainment', 'watch party']
      };

      const result = CreateEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('should require name field', () => {
      const event = {
        type: 'sports',
        date: '2026-06-15',
        location: {
          type: 'Point' as const,
          coordinates: [72.8777, 19.0760] as [number, number]
        },
        organizer: {
          name: 'Test',
          type: 'individual' as const
        }
      };

      const result = CreateEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('should validate optional endDate', () => {
      const event = {
        name: 'Wedding Ceremony',
        type: 'wedding',
        date: '2026-07-15',
        endDate: '2026-07-16',
        location: {
          type: 'Point' as const,
          coordinates: [72.8777, 19.0760] as [number, number]
        },
        organizer: {
          name: 'John Doe',
          type: 'individual' as const
        }
      };

      const result = CreateEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('should reject negative footfall', () => {
      const event = {
        name: 'Test Event',
        type: 'festival',
        date: '2026-06-15',
        expectedFootfall: -100,
        location: {
          type: 'Point' as const,
          coordinates: [72.8777, 19.0760] as [number, number]
        },
        organizer: {
          name: 'Test',
          type: 'individual' as const
        }
      };

      const result = CreateEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });
  });

  describe('NearbyEventsQuerySchema', () => {
    it('should validate valid query', () => {
      const query = {
        lat: 19.0760,
        lng: 72.8777,
        radius: 5000,
        type: 'sports',
        limit: 20
      };

      const result = NearbyEventsQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it('should use default values', () => {
      const query = {
        lat: 19.0760,
        lng: 72.8777
      };

      const result = NearbyEventsQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.radius).toBe(5000);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should reject invalid latitude', () => {
      const query = {
        lat: 100, // Invalid
        lng: 72.8777
      };

      const result = NearbyEventsQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });

    it('should reject invalid longitude', () => {
      const query = {
        lat: 19.0760,
        lng: 200 // Invalid
      };

      const result = NearbyEventsQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });

    it('should cap limit at 100', () => {
      const query = {
        lat: 19.0760,
        lng: 72.8777,
        limit: 500 // Over max
      };

      const result = NearbyEventsQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });
  });

  describe('EventGraphQuerySchema', () => {
    it('should validate valid graph query', () => {
      const query = {
        type: 'wedding',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        city: 'Mumbai',
        limit: 50
      };

      const result = EventGraphQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it('should require type field', () => {
      const query = {
        city: 'Mumbai'
      };

      const result = EventGraphQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
    });
  });
});

describe('UpdateEventSchema', () => {
  it('should allow partial updates', () => {
    const update = {
      name: 'Updated Name',
      status: 'active' as const
    };

    const result = UpdateEventSchema.safeParse(update);
    expect(result.success).toBe(true);
  });

  it('should allow empty updates', () => {
    const update = {};

    const result = UpdateEventSchema.safeParse(update);
    expect(result.success).toBe(true);
  });
});
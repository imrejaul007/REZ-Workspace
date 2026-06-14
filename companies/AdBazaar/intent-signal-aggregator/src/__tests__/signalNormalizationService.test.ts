import { SignalNormalizationService } from '../services/SignalNormalizationService';
import { RawSignal } from '../types';

describe('SignalNormalizationService', () => {
  let service: SignalNormalizationService;

  beforeEach(() => {
    service = new SignalNormalizationService();
  });

  describe('normalize', () => {
    it('should normalize a valid signal', async () => {
      const rawSignal: RawSignal = {
        source: 'buzzlocal',
        sourceService: 'buzzlocal-app',
        userId: 'user-123',
        eventType: 'search',
        category: 'restaurant',
        intentKey: 'pizza near me',
        intentQuery: 'pizza delivery',
        metadata: { location: 'mumbai' },
      };

      const result = await service.normalize(rawSignal);

      expect(result).toBeDefined();
      expect(result.signalId).toBeDefined();
      expect(result.source).toBe('buzzlocal');
      expect(result.eventType).toBe('search');
      expect(result.category).toBe('DINING');
      expect(result.intentKey).toBe('pizza near me');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should map airzy travel signals correctly', async () => {
      const rawSignal: RawSignal = {
        source: 'airzy',
        sourceService: 'airzy-api',
        userId: 'user-456',
        eventType: 'view_flight',
        category: 'flight',
        intentKey: 'delhi to mumbai',
        metadata: { price: 5000 },
      };

      const result = await service.normalize(rawSignal);

      expect(result.eventType).toBe('view');
      expect(result.category).toBe('TRAVEL');
    });

    it('should handle unknown event types', async () => {
      const rawSignal: RawSignal = {
        source: 'rez-now',
        sourceService: 'rez-now-app',
        userId: 'user-789',
        eventType: 'custom_action',
        category: 'restaurant',
        intentKey: 'burger',
      };

      const result = await service.normalize(rawSignal);

      // Should default to 'view' for unknown event types
      expect(result.eventType).toBe('view');
    });

    it('should calculate confidence based on event type', async () => {
      const checkoutSignal: RawSignal = {
        source: 'rez-now',
        sourceService: 'rez-now-app',
        userId: 'user-123',
        eventType: 'checkout_start',
        category: 'restaurant',
        intentKey: 'order',
      };

      const viewSignal: RawSignal = {
        source: 'rez-now',
        sourceService: 'rez-now-app',
        userId: 'user-123',
        eventType: 'view',
        category: 'restaurant',
        intentKey: 'order',
      };

      const checkoutResult = await service.normalize(checkoutSignal);
      const viewResult = await service.normalize(viewSignal);

      expect(checkoutResult.confidence).toBeGreaterThan(viewResult.confidence);
    });

    it('should normalize timestamp if provided', async () => {
      const rawSignal: RawSignal = {
        source: 'buzzlocal',
        sourceService: 'buzzlocal-app',
        userId: 'user-123',
        eventType: 'search',
        category: 'restaurant',
        intentKey: 'test',
        timestamp: '2024-01-15T10:30:00Z',
      };

      const result = await service.normalize(rawSignal);

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should use current time if timestamp not provided', async () => {
      const rawSignal: RawSignal = {
        source: 'buzzlocal',
        sourceService: 'buzzlocal-app',
        userId: 'user-123',
        eventType: 'search',
        category: 'restaurant',
        intentKey: 'test',
      };

      const before = new Date();
      const result = await service.normalize(rawSignal);
      const after = new Date();

      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('normalizeBatch', () => {
    it('should normalize multiple signals', async () => {
      const rawSignals: RawSignal[] = [
        {
          source: 'buzzlocal',
          sourceService: 'buzzlocal-app',
          userId: 'user-1',
          eventType: 'search',
          category: 'restaurant',
          intentKey: 'pizza',
        },
        {
          source: 'airzy',
          sourceService: 'airzy-api',
          userId: 'user-2',
          eventType: 'view_hotel',
          category: 'hotel',
          intentKey: 'beach resort',
        },
      ];

      const results = await service.normalizeBatch(rawSignals);

      expect(results).toHaveLength(2);
      expect(results[0].source).toBe('buzzlocal');
      expect(results[1].source).toBe('airzy');
    });

    it('should skip invalid signals in batch', async () => {
      const rawSignals: RawSignal[] = [
        {
          source: 'buzzlocal',
          sourceService: 'buzzlocal-app',
          userId: 'user-1',
          eventType: 'search',
          category: 'restaurant',
          intentKey: 'pizza',
        },
        {
          // Missing required fields
          source: '',
          sourceService: '',
          userId: '',
          eventType: '',
          category: '',
          intentKey: '',
        } as RawSignal,
      ];

      const results = await service.normalizeBatch(rawSignals);

      expect(results).toHaveLength(1);
    });
  });
});
import { SignalEnrichmentService } from '../services/SignalEnrichmentService';
import { IntentSignal } from '../types';

describe('SignalEnrichmentService', () => {
  let service: SignalEnrichmentService;

  beforeEach(() => {
    service = new SignalEnrichmentService();
  });

  describe('enrich', () => {
    it('should enrich a signal with context', async () => {
      const signal: IntentSignal = {
        signalId: 'test-signal-123',
        source: 'buzzlocal',
        sourceService: 'buzzlocal-app',
        userId: 'user-123',
        eventType: 'search',
        category: 'DINING',
        intentKey: 'pizza',
        metadata: { location: 'mumbai' },
        confidence: 0.7,
        enriched: false,
        timestamp: new Date(),
      };

      const result = await service.enrich(signal);

      expect(result.enriched).toBe(true);
      expect(result.enrichmentData).toBeDefined();
    });

    it('should include predicted next actions', async () => {
      const signal: IntentSignal = {
        signalId: 'test-signal-456',
        source: 'airzy',
        sourceService: 'airzy-api',
        userId: 'user-456',
        eventType: 'view',
        category: 'TRAVEL',
        intentKey: 'beach hotel',
        metadata: {},
        confidence: 0.6,
        enriched: false,
        timestamp: new Date(),
      };

      const result = await service.enrich(signal);

      expect(result.enrichmentData?.predictedNextActions).toBeDefined();
      expect(Array.isArray(result.enrichmentData?.predictedNextActions)).toBe(true);
    });

    it('should determine intent clusters', async () => {
      const signal: IntentSignal = {
        signalId: 'test-signal-789',
        source: 'rez-now',
        sourceService: 'rez-now-app',
        userId: 'user-789',
        eventType: 'checkout_start',
        category: 'DINING',
        intentKey: 'order',
        metadata: {},
        confidence: 0.85,
        enriched: false,
        timestamp: new Date(),
      };

      const result = await service.enrich(signal);

      expect(result.enrichmentData?.intentClusters).toBeDefined();
      expect(result.enrichmentData?.intentClusters).toContain('category:dining');
      expect(result.enrichmentData?.intentClusters).toContain('conversion_phase');
    });
  });

  describe('enrichBatch', () => {
    it('should enrich multiple signals', async () => {
      const signals: IntentSignal[] = [
        {
          signalId: 'batch-signal-1',
          source: 'buzzlocal',
          sourceService: 'buzzlocal-app',
          userId: 'user-1',
          eventType: 'search',
          category: 'DINING',
          intentKey: 'pizza',
          metadata: {},
          confidence: 0.7,
          enriched: false,
          timestamp: new Date(),
        },
        {
          signalId: 'batch-signal-2',
          source: 'airzy',
          sourceService: 'airzy-api',
          userId: 'user-2',
          eventType: 'view',
          category: 'TRAVEL',
          intentKey: 'hotel',
          metadata: {},
          confidence: 0.6,
          enriched: false,
          timestamp: new Date(),
        },
      ];

      const results = await service.enrichBatch(signals);

      expect(results).toHaveLength(2);
      expect(results[0].enriched).toBe(true);
      expect(results[1].enriched).toBe(true);
    });
  });
});
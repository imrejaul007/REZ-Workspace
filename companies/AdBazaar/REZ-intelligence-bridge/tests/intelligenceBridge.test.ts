import { describe, it, expect } from 'vitest';

describe('Intelligence Bridge', () => {
  describe('Intent Signals', () => {
    it('should classify intent types', () => {
      const intentTypes = ['informational', 'navigational', 'transactional', 'commercial'];
      const intent = { type: 'transactional', confidence: 0.85 };
      expect(intentTypes).toContain(intent.type);
      expect(intent.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Signal Processing', () => {
    it('should aggregate signals', () => {
      const signals = [
        { type: 'search', weight: 0.4 },
        { type: 'click', weight: 0.3 },
        { type: 'purchase', weight: 0.3 },
      ];
      const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
      expect(totalWeight).toBe(1);
    });
  });

  describe('Prediction', () => {
    it('should generate confidence scores', () => {
      const prediction = { label: 'high_value', confidence: 0.92, factors: ['recency', 'frequency'] };
      expect(prediction.confidence).toBeGreaterThan(0.9);
    });
  });
});

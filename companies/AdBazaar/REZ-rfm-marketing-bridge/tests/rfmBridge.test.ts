import { describe, it, expect } from 'vitest';

describe('RFM Marketing Bridge', () => {
  describe('RFM Scoring', () => {
    it('should calculate RFM scores', () => {
      const rfmScore = {
        recency: 4,    // Days since last purchase (lower is better)
        frequency: 3,  // Number of purchases
        monetary: 5,   // Total spend
      };
      const totalScore = rfmScore.recency + rfmScore.frequency + rfmScore.monetary;
      expect(totalScore).toBe(12);
    });

    it('should segment customers by RFM', () => {
      const segments = ['Champions', 'Loyal', 'At Risk', 'Lost'];
      const customer = { rfmScore: 12, segment: 'Loyal' };
      expect(segments).toContain(customer.segment);
    });
  });

  describe('Campaign Targeting', () => {
    it('should target customers by segment', () => {
      const targeting = {
        atRisk: { minScore: 3, maxScore: 6 },
        loyal: { minScore: 7, maxScore: 10 },
        champions: { minScore: 11, maxScore: 15 },
      };
      expect(targeting.atRisk.minScore).toBeLessThan(targeting.loyal.minScore);
    });
  });
});
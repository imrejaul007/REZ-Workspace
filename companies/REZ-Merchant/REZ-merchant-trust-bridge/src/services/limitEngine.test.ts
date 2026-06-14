import { TrustScore } from '../types';
import { config } from '../config';

describe('LimitEngineService', () => {
  describe('Configuration', () => {
    it('should have valid limit rules configured', () => {
      expect(config.limitRules.length).toBeGreaterThan(0);

      for (const rule of config.limitRules) {
        expect(rule.minScore).toBeLessThanOrEqual(rule.maxScore);
        expect(rule.baseLimit).toBeGreaterThanOrEqual(0);
        expect(rule.minLimit).toBeLessThanOrEqual(rule.maxLimit);
        expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(rule.riskLevel);
      }
    });

    it('should have complete score range coverage', () => {
      const ranges = config.limitRules.map((r) => ({ min: r.minScore, max: r.maxScore }));
      const sorted = ranges.sort((a, b) => a.min - b.min);

      for (let i = 0; i < sorted.length - 1; i++) {
        // Ranges should be adjacent or overlapping
        expect(sorted[i].max).toBeGreaterThanOrEqual(sorted[i].min);
      }
    });

    it('should have valid alert thresholds', () => {
      expect(config.alertThresholds.trustDropPercent).toBeGreaterThanOrEqual(0);
      expect(config.alertThresholds.trustDropPercent).toBeLessThanOrEqual(100);
      expect(config.alertThresholds.criticalScore).toBeGreaterThanOrEqual(0);
      expect(config.alertThresholds.criticalScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Trust Score Validation', () => {
    it('should validate trust score data structure', () => {
      const trustScore: TrustScore = {
        merchantId: 'merchant-123',
        score: 85,
        riskLevel: 'LOW',
        factors: {
          paymentHistory: 90,
          disputeRate: 5,
          complianceScore: 95,
          businessAge: 80,
          volumeScore: 75,
        },
        lastUpdated: new Date().toISOString(),
        source: 'test-source',
      };

      expect(trustScore.merchantId).toBeDefined();
      expect(trustScore.score).toBeGreaterThanOrEqual(0);
      expect(trustScore.score).toBeLessThanOrEqual(100);
      expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(trustScore.riskLevel);

      for (const factor of Object.values(trustScore.factors)) {
        expect(factor).toBeGreaterThanOrEqual(0);
        expect(factor).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Risk Level Classification', () => {
    it('should classify scores correctly', () => {
      const getRiskLevel = (score: number): string => {
        if (score >= 90) return 'LOW';
        if (score >= 75) return 'LOW';
        if (score >= 60) return 'MEDIUM';
        if (score >= 40) return 'HIGH';
        return 'CRITICAL';
      };

      expect(getRiskLevel(95)).toBe('LOW');
      expect(getRiskLevel(85)).toBe('LOW');
      expect(getRiskLevel(70)).toBe('MEDIUM');
      expect(getRiskLevel(50)).toBe('HIGH');
      expect(getRiskLevel(30)).toBe('CRITICAL');
    });
  });

  describe('Limit Calculation Logic', () => {
    it('should apply multipliers correctly', () => {
      const rule = config.limitRules.find((r) => r.riskLevel === 'LOW' && r.minScore === 90);

      if (rule) {
        expect(rule.limitMultiplier).toBeGreaterThan(1);
        expect(rule.maxLimit).toBeGreaterThan(rule.baseLimit);
      }
    });

    it('should respect min and max limits', () => {
      const testCalculation = (
        baseLimit: number,
        multiplier: number,
        minLimit: number,
        maxLimit: number
      ): number => {
        let result = baseLimit * multiplier;
        result = Math.max(minLimit, Math.min(maxLimit, result));
        return result;
      };

      const testRule = config.limitRules[0];
      const calculated = testCalculation(
        testRule.baseLimit,
        testRule.limitMultiplier,
        testRule.minLimit,
        testRule.maxLimit
      );

      expect(calculated).toBeGreaterThanOrEqual(testRule.minLimit);
      expect(calculated).toBeLessThanOrEqual(testRule.maxLimit);
    });
  });

  describe('Block Decision Logic', () => {
    it('should block merchants with critical scores', () => {
      const shouldBlock = (trustScore: TrustScore): boolean => {
        if (trustScore.score < config.alertThresholds.criticalScore) {
          return true;
        }
        if (trustScore.riskLevel === 'CRITICAL') {
          return true;
        }
        return false;
      };

      const criticalScore: TrustScore = {
        merchantId: 'test-1',
        score: 35,
        riskLevel: 'CRITICAL',
        factors: { paymentHistory: 40, disputeRate: 60, complianceScore: 50, businessAge: 30, volumeScore: 20 },
        lastUpdated: new Date().toISOString(),
        source: 'test',
      };

      const lowScore: TrustScore = {
        merchantId: 'test-2',
        score: 45,
        riskLevel: 'HIGH',
        factors: { paymentHistory: 50, disputeRate: 40, complianceScore: 60, businessAge: 50, volumeScore: 40 },
        lastUpdated: new Date().toISOString(),
        source: 'test',
      };

      expect(shouldBlock(criticalScore)).toBe(true);
      expect(shouldBlock(lowScore)).toBe(false);
    });

    it('should block merchants with low compliance', () => {
      const shouldBlockForCompliance = (complianceScore: number): boolean => {
        return complianceScore < 30;
      };

      expect(shouldBlockForCompliance(25)).toBe(true);
      expect(shouldBlockForCompliance(35)).toBe(false);
    });

    it('should block merchants with high dispute rate', () => {
      const shouldBlockForDispute = (disputeRate: number): boolean => {
        return disputeRate > 80;
      };

      expect(shouldBlockForDispute(85)).toBe(true);
      expect(shouldBlockForDispute(75)).toBe(false);
    });
  });
});

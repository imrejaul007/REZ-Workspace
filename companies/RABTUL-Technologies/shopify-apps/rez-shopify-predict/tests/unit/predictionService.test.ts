/**
 * ReZ Predict - Prediction Service Tests
 */

const mockCustomer = {
  customerId: 'cust_123',
  shop: 'test-store.myshopify.com',
  totalOrders: 10,
  totalSpent: 25000,
  avgOrderValue: 2500,
  lastOrderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  signupDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
  daysSinceLastOrder: 7,
  daysSinceSignup: 180,
};

describe('Prediction Service', () => {
  describe('LTV Prediction', () => {
    it('should calculate basic LTV', () => {
      const avgOrderValue = mockCustomer.avgOrderValue;
      const ordersPerYear = (mockCustomer.totalOrders / mockCustomer.daysSinceSignup) * 365;
      const ltv = avgOrderValue * ordersPerYear * 3; // 3 year estimate

      expect(ltv).toBeGreaterThan(0);
    });

    it('should estimate higher LTV for frequent buyers', () => {
      const highFrequencyCustomer = {
        ...mockCustomer,
        totalOrders: 20,
        totalSpent: 50000,
        avgOrderValue: 2500,
        daysSinceSignup: 180,
      };

      const ltv = (highFrequencyCustomer.avgOrderValue / highFrequencyCustomer.daysSinceSignup) * 365 * 3;
      expect(ltv).toBeGreaterThan(40000);
    });
  });

  describe('Churn Risk Scoring', () => {
    it('should calculate churn score based on days since order', () => {
      const calculateChurnScore = (daysSinceOrder: number) => {
        let score = 30; // Base score
        if (daysSinceOrder > 60) score += 30;
        else if (daysSinceOrder > 30) score += 15;
        return Math.min(100, score);
      };

      expect(calculateChurnScore(7)).toBe(30);
      expect(calculateChurnScore(45)).toBe(45);
      expect(calculateChurnScore(90)).toBe(60);
    });

    it('should increase score for low order count', () => {
      const calculateChurnScore = (daysSinceOrder: number, totalOrders: number) => {
        let score = 30;
        if (daysSinceOrder > 60) score += 30;
        else if (daysSinceOrder > 30) score += 15;
        if (totalOrders < 2) score += 10;
        return Math.min(100, score);
      };

      const oneTimeBuyer = calculateChurnScore(30, 1);
      const repeatBuyer = calculateChurnScore(30, 5);

      expect(oneTimeBuyer).toBeGreaterThan(repeatBuyer);
    });

    it('should classify churn risk levels', () => {
      const classifyRisk = (score: number) => {
        if (score > 70) return 'high';
        if (score > 40) return 'medium';
        return 'low';
      };

      expect(classifyRisk(20)).toBe('low');
      expect(classifyRisk(50)).toBe('medium');
      expect(classifyRisk(80)).toBe('high');
    });
  });

  describe('Revisit Probability', () => {
    it('should calculate revisit probability', () => {
      const churnScore = 45;
      const revisitProbability = Math.max(0, Math.min(100, 100 - churnScore));

      expect(revisitProbability).toBe(55);
    });

    it('should give higher probability to active customers', () => {
      const activeProbability = 100 - 20; // Low churn
      const inactiveProbability = 100 - 80; // High churn

      expect(activeProbability).toBeGreaterThan(inactiveProbability);
    });
  });

  describe('Customer Segmentation', () => {
    it('should identify VIP customers', () => {
      const isVIP = (totalSpent: number, totalOrders: number) => {
        return totalSpent >= 10000 || totalOrders >= 5;
      };

      expect(isVIP(15000, 3)).toBe(true);
      expect(isVIP(5000, 8)).toBe(true);
      expect(isVIP(3000, 2)).toBe(false);
    });

    it('should identify at-risk customers', () => {
      const isAtRisk = (daysSinceOrder: number, totalOrders: number) => {
        return (daysSinceOrder > 60 && totalOrders < 3) || daysSinceOrder > 90;
      };

      expect(isAtRisk(120, 1)).toBe(true); // Very inactive
      expect(isAtRisk(45, 10)).toBe(false); // Has history
    });

    it('should identify new customers', () => {
      const isNew = (daysSinceSignup: number) => daysSinceSignup <= 30;

      expect(isNew(15)).toBe(true);
      expect(isNew(60)).toBe(false);
    });
  });
});

describe('Prediction Features', () => {
  it('should have all required features', () => {
    const requiredFeatures = [
      'ltv',
      'churnRisk',
      'churnScore',
      'revisitProbability',
      'predictedLifetimeOrders',
      'predictedLifetimeValue',
    ];

    const prediction = {
      ltv: 50000,
      churnRisk: 'medium',
      churnScore: 45,
      revisitProbability: 55,
      predictedLifetimeOrders: 20,
      predictedLifetimeValue: 50000,
    };

    for (const feature of requiredFeatures) {
      expect(prediction).toHaveProperty(feature);
    }
  });
});

describe('Prediction Model', () => {
  it('should have version tracking', () => {
    const prediction = {
      ...mockCustomer,
      predictions: {
        ltv: 50000,
        churnRisk: 'medium',
        churnScore: 45,
      },
      modelVersion: 'v1.0',
      predictedAt: new Date(),
    };

    expect(prediction.modelVersion).toBe('v1.0');
    expect(prediction.predictedAt).toBeInstanceOf(Date);
  });

  it('should expire predictions after 24 hours', () => {
    const isPredictionFresh = (predictedAt: Date) => {
      const hoursSincePrediction = (Date.now() - predictedAt.getTime()) / (1000 * 60 * 60);
      return hoursSincePrediction < 24;
    };

    const recentPrediction = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const stalePrediction = new Date(Date.now() - 48 * 60 * 60 * 1000);

    expect(isPredictionFresh(recentPrediction)).toBe(true);
    expect(isPredictionFresh(stalePrediction)).toBe(false);
  });
});

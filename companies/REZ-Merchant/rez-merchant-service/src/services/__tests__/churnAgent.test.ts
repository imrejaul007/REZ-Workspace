/**
 * Unit tests for ChurnAgent
 */

import { ChurnAgent, RFMScore } from '../churnAgent';

// Create mock functions
const mockOrderAggregate = jest.fn();
const mockStoreFind = jest.fn();

// Mock mongoose
jest.mock('mongoose', () => ({
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => id),
  },
}));

// Mock models
jest.mock('../../models/Order', () => ({
  Order: {
    aggregate: (...args: any[]) => mockOrderAggregate(...args),
  },
}));

jest.mock('../../models/Store', () => ({
  Store: {
    find: (...args: any[]) => mockStoreFind(...args),
  },
}));

jest.mock('../../models/CustomerMeta', () => ({}));

describe('ChurnAgent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('predictChurnProbability', () => {
    it('should predict low churn for high RFM scores', () => {
      const rfmScore: RFMScore = {
        userId: 'user1',
        recency: 5,
        frequency: 50,
        monetary: 10000,
        recencyScore: 5,
        frequencyScore: 5,
        monetaryScore: 5,
        totalScore: 15,
      };

      const probability = ChurnAgent.predictChurnProbability(rfmScore);

      expect(probability).toBeLessThan(20);
    });

    it('should predict high churn for low RFM scores', () => {
      const rfmScore: RFMScore = {
        userId: 'user2',
        recency: 90,
        frequency: 1,
        monetary: 100,
        recencyScore: 1,
        frequencyScore: 1,
        monetaryScore: 1,
        totalScore: 3,
      };

      const probability = ChurnAgent.predictChurnProbability(rfmScore);

      expect(probability).toBeGreaterThan(60);
    });

    it('should predict moderate churn for average scores', () => {
      const rfmScore: RFMScore = {
        userId: 'user3',
        recency: 30,
        frequency: 10,
        monetary: 1000,
        recencyScore: 3,
        frequencyScore: 3,
        monetaryScore: 3,
        totalScore: 9,
      };

      const probability = ChurnAgent.predictChurnProbability(rfmScore);

      expect(probability).toBeGreaterThanOrEqual(20);
      expect(probability).toBeLessThanOrEqual(60);
    });

    it('should return probability within 0-100 range', () => {
      const rfmScore: RFMScore = {
        userId: 'user4',
        recency: 0,
        frequency: 100,
        monetary: 50000,
        recencyScore: 5,
        frequencyScore: 5,
        monetaryScore: 5,
        totalScore: 15,
      };

      const probability = ChurnAgent.predictChurnProbability(rfmScore);

      expect(probability).toBeGreaterThanOrEqual(0);
      expect(probability).toBeLessThanOrEqual(100);
    });
  });

  describe('determineChurnRisk', () => {
    it('should return critical for probability >= 80', () => {
      expect(ChurnAgent.determineChurnRisk(80)).toBe('critical');
      expect(ChurnAgent.determineChurnRisk(95)).toBe('critical');
      expect(ChurnAgent.determineChurnRisk(100)).toBe('critical');
    });

    it('should return high for probability >= 60 and < 80', () => {
      expect(ChurnAgent.determineChurnRisk(60)).toBe('high');
      expect(ChurnAgent.determineChurnRisk(70)).toBe('high');
      expect(ChurnAgent.determineChurnRisk(79)).toBe('high');
    });

    it('should return medium for probability >= 40 and < 60', () => {
      expect(ChurnAgent.determineChurnRisk(40)).toBe('medium');
      expect(ChurnAgent.determineChurnRisk(50)).toBe('medium');
      expect(ChurnAgent.determineChurnRisk(59)).toBe('medium');
    });

    it('should return low for probability < 40', () => {
      expect(ChurnAgent.determineChurnRisk(0)).toBe('low');
      expect(ChurnAgent.determineChurnRisk(20)).toBe('low');
      expect(ChurnAgent.determineChurnRisk(39)).toBe('low');
    });
  });

  describe('predictChurnDate', () => {
    it('should return null for null lastOrderDate', () => {
      const result = ChurnAgent.predictChurnDate(null, 60);
      expect(result).toBeNull();
    });

    it('should return null for probability below 50', () => {
      const lastOrder = new Date();
      const result = ChurnAgent.predictChurnDate(lastOrder, 49);
      expect(result).toBeNull();
    });

    it('should return churn date for high probability', () => {
      const lastOrder = new Date('2024-01-01');
      const result = ChurnAgent.predictChurnDate(lastOrder, 75);

      expect(result).not.toBeNull();
      expect(result!.getTime()).toBeGreaterThan(lastOrder.getTime());
    });

    it('should predict earlier churn for higher probability', () => {
      const lastOrder = new Date('2024-01-01');
      const earlyChurn = ChurnAgent.predictChurnDate(lastOrder, 90);
      const lateChurn = ChurnAgent.predictChurnDate(lastOrder, 51);

      expect(earlyChurn!.getTime()).toBeLessThan(lateChurn!.getTime());
    });
  });

  describe('generateChurnReasons', () => {
    it('should include recency reason for old customers', () => {
      const rfmScore: RFMScore = {
        userId: 'user1',
        recency: 90,
        frequency: 10,
        monetary: 1000,
        recencyScore: 3,
        frequencyScore: 3,
        monetaryScore: 3,
        totalScore: 9,
      };

      const reasons = ChurnAgent.generateChurnReasons(rfmScore);

      expect(reasons.some((r) => r.includes('No order in 90 days'))).toBe(true);
    });

    it('should include low frequency reason', () => {
      const rfmScore: RFMScore = {
        userId: 'user2',
        recency: 10,
        frequency: 2,
        monetary: 500,
        recencyScore: 4,
        frequencyScore: 1,
        monetaryScore: 2,
        totalScore: 7,
      };

      const reasons = ChurnAgent.generateChurnReasons(rfmScore);

      expect(reasons).toContain('Low order frequency');
    });

    it('should include low monetary reason', () => {
      const rfmScore: RFMScore = {
        userId: 'user3',
        recency: 10,
        frequency: 10,
        monetary: 50,
        recencyScore: 4,
        frequencyScore: 3,
        monetaryScore: 1,
        totalScore: 8,
      };

      const reasons = ChurnAgent.generateChurnReasons(rfmScore);

      expect(reasons).toContain('Below average spending');
    });

    it('should include declining engagement for low total score', () => {
      const rfmScore: RFMScore = {
        userId: 'user4',
        recency: 60,
        frequency: 3,
        monetary: 200,
        recencyScore: 2,
        frequencyScore: 2,
        monetaryScore: 2,
        totalScore: 6,
      };

      const reasons = ChurnAgent.generateChurnReasons(rfmScore);

      expect(reasons).toContain('Declining engagement across all metrics');
    });

    it('should return default message for healthy customers', () => {
      const rfmScore: RFMScore = {
        userId: 'user5',
        recency: 5,
        frequency: 20,
        monetary: 5000,
        recencyScore: 5,
        frequencyScore: 4,
        monetaryScore: 4,
        totalScore: 13,
      };

      const reasons = ChurnAgent.generateChurnReasons(rfmScore);

      expect(reasons).toContain('Monitor for potential decline');
    });
  });

  describe('generateRecommendedActions', () => {
    it('should generate critical actions for critical risk', () => {
      const rfmScore: RFMScore = {
        userId: 'user1',
        recency: 90,
        frequency: 1,
        monetary: 100,
        recencyScore: 1,
        frequencyScore: 1,
        monetaryScore: 1,
        totalScore: 3,
      };

      const actions = ChurnAgent.generateRecommendedActions('critical', rfmScore);

      expect(actions).toContain('Send win-back offer with significant discount');
      expect(actions).toContain('Personal outreach via phone or SMS');
    });

    it('should generate high risk actions', () => {
      const rfmScore: RFMScore = {
        userId: 'user2',
        recency: 45,
        frequency: 5,
        monetary: 500,
        recencyScore: 2,
        frequencyScore: 2,
        monetaryScore: 2,
        totalScore: 6,
      };

      const actions = ChurnAgent.generateRecommendedActions('high', rfmScore);

      expect(actions).toContain('Send personalized re-engagement email');
      expect(actions).toContain('Offer loyalty points or cashback');
    });

    it('should generate medium risk actions', () => {
      const rfmScore: RFMScore = {
        userId: 'user3',
        recency: 20,
        frequency: 8,
        monetary: 1500,
        recencyScore: 3,
        frequencyScore: 3,
        monetaryScore: 3,
        totalScore: 9,
      };

      const actions = ChurnAgent.generateRecommendedActions('medium', rfmScore);

      expect(actions).toContain('Send targeted promotions');
      expect(actions).toContain('Invite to exclusive events');
    });

    it('should generate low risk actions', () => {
      const rfmScore: RFMScore = {
        userId: 'user4',
        recency: 5,
        frequency: 15,
        monetary: 3000,
        recencyScore: 5,
        frequencyScore: 4,
        monetaryScore: 4,
        totalScore: 13,
      };

      const actions = ChurnAgent.generateRecommendedActions('low', rfmScore);

      expect(actions).toContain('Continue regular engagement');
      expect(actions).toContain('Encourage referrals with rewards');
    });
  });

  describe('calculateRFMScores', () => {
    it('should return empty array when no customer data', async () => {
      mockOrderAggregate.mockResolvedValue([]);

      const result = await ChurnAgent.calculateRFMScores(
        'merchant123',
        ['store1' as any],
        180
      );

      expect(result).toEqual([]);
    });

    it('should calculate RFM scores from order data', async () => {
      const mockOrderData = [
        {
          _id: 'user1',
          totalOrders: 10,
          totalSpent: 5000,
          lastOrderDate: new Date('2024-01-15'),
        },
        {
          _id: 'user2',
          totalOrders: 5,
          totalSpent: 2000,
          lastOrderDate: new Date('2024-02-01'),
        },
      ];

      mockOrderAggregate.mockResolvedValue(mockOrderData);

      const result = await ChurnAgent.calculateRFMScores(
        'merchant123',
        ['store1' as any],
        180
      );

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('user1');
      expect(result[0].totalScore).toBeGreaterThan(0);
    });
  });

  describe('analyzeChurn', () => {
    it('should return empty result for merchant with no stores', async () => {
      mockStoreFind.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await ChurnAgent.analyzeChurn('merchant123');

      expect(result.totalCustomers).toBe(0);
      expect(result.atRiskCustomers).toEqual([]);
      expect(result.churnedCustomers).toEqual([]);
      expect(result.healthyCustomers).toEqual([]);
    });
  });

  describe('getCustomersByRiskLevel', () => {
    it('should filter customers by risk level', async () => {
      mockStoreFind.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([{ _id: 'store1' }]),
        }),
      });

      mockOrderAggregate.mockResolvedValue([
        {
          _id: 'user1',
          totalOrders: 2,
          totalSpent: 200,
          lastOrderDate: new Date('2024-01-01'),
        },
      ]);

      const result = await ChurnAgent.getCustomersByRiskLevel('merchant123', 'critical');

      expect(result).toBeDefined();
    });
  });
});

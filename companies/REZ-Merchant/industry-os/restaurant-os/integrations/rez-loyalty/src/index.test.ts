import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PointsService } from './services/PointsService';
import { TierService, TIER_BENEFITS, TierInfo } from './services/TierService';
import { CustomerPoints } from './models/CustomerPoints';
import { PointsTransaction } from './models/PointsTransaction';
import { LoyaltyProgram } from './models/LoyaltyProgram';
import { POINTS_PER_RUPEE, TIER_THRESHOLDS, TIER_NAMES } from './config/constants';

// Mock mongoose models
vi.mock('./models/CustomerPoints', () => {
  const mockSave = vi.fn().mockResolvedValue(undefined);
  const mockFindOne = vi.fn();

  const MockCustomerPoints = vi.fn().mockImplementation((data) => ({
    ...data,
    save: mockSave,
  }));

  (MockCustomerPoints as any).findOne = mockFindOne;
  (MockCustomerPoints as any).startSession = vi.fn().mockReturnValue({
    startTransaction: vi.fn(),
    commitTransaction: vi.fn(),
    abortTransaction: vi.fn(),
    endSession: vi.fn(),
  });

  return { CustomerPoints: MockCustomerPoints, ICustomerPoints: {} };
});

vi.mock('./models/PointsTransaction', () => {
  const mockCreate = vi.fn().mockResolvedValue([]);
  return { PointsTransaction: { create: mockCreate, find: vi.fn() } };
});

vi.mock('./models/LoyaltyProgram', () => ({
  LoyaltyProgram: { findOne: vi.fn() },
}));

// Mock Redis
const mockRedis = {
  get: vi.fn().mockResolvedValue(null),
  setex: vi.fn().mockResolvedValue('OK'),
};

describe('PointsService', () => {
  let pointsService: PointsService;

  beforeEach(() => {
    pointsService = new PointsService(mockRedis as any);
    vi.clearAllMocks();
  });

  describe('calculatePoints', () => {
    it('should return 0 for orders below minimum spend', () => {
      const points = pointsService.calculatePoints(50, 1.0); // Below MINIMUM_SPEND_FOR_POINTS

      expect(points).toBe(0);
    });

    it('should calculate points with tier multiplier', () => {
      const points = pointsService.calculatePoints(500, 2.0); // 500 rupees, 2x multiplier

      // 500 * POINTS_PER_RUPEE * 2 = 500 * 1 * 2 = 1000 points
      expect(points).toBe(1000);
    });

    it('should respect max points per transaction', () => {
      const points = pointsService.calculatePoints(100000, 5.0); // Very high amount

      expect(points).toBeLessThanOrEqual(100000); // Max cap
    });

    it('should floor fractional points', () => {
      const points = pointsService.calculatePoints(333, 1.0);

      expect(Number.isInteger(points)).toBe(true);
    });
  });

  describe('calculateTier', () => {
    it('should return BRONZE tier for new customers (0 points)', () => {
      const result = pointsService.calculateTier(0);

      expect(result.tier).toBe('BRONZE');
      expect(result.nextTier).toBe('SILVER');
    });

    it('should return SILVER tier for points >= 1000', () => {
      const result = pointsService.calculateTier(1500);

      expect(result.tier).toBe('SILVER');
      expect(result.nextTier).toBe('GOLD');
    });

    it('should return GOLD tier for points >= 5000', () => {
      const result = pointsService.calculateTier(7500);

      expect(result.tier).toBe('GOLD');
      expect(result.nextTier).toBe('PLATINUM');
    });

    it('should return PLATINUM tier for points >= 10000', () => {
      const result = pointsService.calculateTier(15000);

      expect(result.tier).toBe('PLATINUM');
      expect(result.nextTier).toBeNull();
    });

    it('should calculate correct tier progress percentage', () => {
      // 2500 points in SILVER (1000-5000 range = 4000 range)
      // Progress = (2500-1000) / 4000 * 100 = 37.5%
      const result = pointsService.calculateTier(2500);

      expect(result.tierProgress).toBeGreaterThan(30);
      expect(result.tierProgress).toBeLessThan(50);
    });

    it('should return 0 points to next tier at PLATINUM', () => {
      const result = pointsService.calculateTier(15000);

      expect(result.pointsToNextTier).toBe(0);
      expect(result.tierProgress).toBe(100);
    });
  });

  describe('getPointsSummary', () => {
    it('should return null for non-existent customer', async () => {
      (CustomerPoints.findOne as any).mockResolvedValue(null);

      const result = await pointsService.getPointsSummary('NON-EXISTENT', 'program-1');

      expect(result).toBeNull();
    });

    it('should use cached balance when available', async () => {
      const mockCustomer = {
        customerId: 'CUST-1',
        currentPoints: 500,
        toObject: () => ({ currentPoints: 500 }),
      };

      mockRedis.get.mockResolvedValueOnce('750'); // Cached value
      (CustomerPoints.findOne as any).mockResolvedValue(mockCustomer);
      (PointsTransaction.find as any).mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

      const result = await pointsService.getPointsSummary('CUST-1', 'program-1');

      expect(result?.currentPoints).toBe(750); // From cache
    });
  });

  describe('getTransactionHistory', () => {
    it('should return paginated transaction history', async () => {
      const mockTransactions = [
        { transactionId: 'TX-1', points: 100 },
        { transactionId: 'TX-2', points: 200 },
      ];

      (PointsTransaction.find as any)
        .mockReturnValue({
          sort: vi.fn().mockReturnThis(),
          skip: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue(mockTransactions),
        });
      (PointsTransaction.countDocuments as any).mockResolvedValue(50);

      const result = await pointsService.getTransactionHistory('CUST-1', 'program-1', {
        limit: 2,
        offset: 0,
      });

      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(50);
    });

    it('should filter by transaction type', async () => {
      (PointsTransaction.find as any)
        .mockReturnValue({
          sort: vi.fn().mockReturnThis(),
          skip: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue([]),
        });
      (PointsTransaction.countDocuments as any).mockResolvedValue(0);

      await pointsService.getTransactionHistory('CUST-1', 'program-1', {
        type: 'EARN',
      });

      expect(PointsTransaction.find).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'EARN' })
      );
    });
  });

  describe('getTierProgress', () => {
    it('should return null for non-existent customer', async () => {
      (CustomerPoints.findOne as any).mockResolvedValue(null);

      const result = await pointsService.getTierProgress('NON-EXISTENT', 'program-1');

      expect(result).toBeNull();
    });

    it('should return tier progress details', async () => {
      const mockCustomer = {
        customerId: 'CUST-1',
        programId: 'program-1',
        tier: 'GOLD',
        nextTier: 'PLATINUM',
        tierProgress: 50,
        pointsToNextTier: 5000,
        lifetimePoints: 7500,
      };

      (CustomerPoints.findOne as any).mockResolvedValue(mockCustomer);

      const result = await pointsService.getTierProgress('CUST-1', 'program-1');

      expect(result?.currentTier).toBe('GOLD');
      expect(result?.nextTier).toBe('PLATINUM');
      expect(result?.lifetimePoints).toBe(7500);
    });
  });

  describe('getRestaurantPooledPoints', () => {
    it('should return null for non-existent customer', async () => {
      (CustomerPoints.findOne as any).mockResolvedValue(null);

      const result = await pointsService.getRestaurantPooledPoints('NON-EXISTENT', 'program-1');

      expect(result).toBeNull();
    });

    it('should return restaurant points map', async () => {
      const mockMap = new Map([
        ['rest-1', 500],
        ['rest-2', 300],
      ]);

      const mockCustomer = {
        customerId: 'CUST-1',
        restaurantPoints: mockMap,
      };

      (CustomerPoints.findOne as any).mockResolvedValue(mockCustomer);

      const result = await pointsService.getRestaurantPooledPoints('CUST-1', 'program-1');

      expect(result?.get('rest-1')).toBe(500);
      expect(result?.get('rest-2')).toBe(300);
    });
  });
});

describe('TierService', () => {
  let tierService: TierService;

  beforeEach(() => {
    tierService = new TierService();
    vi.clearAllMocks();
  });

  describe('getAllTiers', () => {
    it('should return all tier information', () => {
      const tiers = tierService.getAllTiers();

      expect(tiers).toHaveLength(4); // BRONZE, SILVER, GOLD, PLATINUM
      expect(tiers.map((t: TierInfo) => t.name)).toEqual(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']);
    });

    it('should include benefits for each tier', () => {
      const tiers = tierService.getAllTiers();

      tiers.forEach((tier: TierInfo) => {
        expect(tier.benefits).toBeDefined();
        expect(tier.benefits.pointsMultiplier).toBeGreaterThan(0);
        expect(tier.threshold).toBeGreaterThanOrEqual(0);
        expect(tier.color).toBeDefined();
      });
    });

    it('should have increasing thresholds', () => {
      const tiers = tierService.getAllTiers();

      for (let i = 1; i < tiers.length; i++) {
        expect(tiers[i].threshold).toBeGreaterThan(tiers[i - 1].threshold);
      }
    });
  });

  describe('getTierBenefits', () => {
    it('should return correct benefits for BRONZE tier', () => {
      const benefits = tierService.getTierBenefits('BRONZE');

      expect(benefits.pointsMultiplier).toBe(1.0);
      expect(benefits.birthdayBonus).toBe(true);
      expect(benefits.prioritySupport).toBe(false);
    });

    it('should return correct benefits for SILVER tier', () => {
      const benefits = tierService.getTierBenefits('SILVER');

      expect(benefits.pointsMultiplier).toBe(1.5);
      expect(benefits.prioritySupport).toBe(true);
    });

    it('should return correct benefits for GOLD tier', () => {
      const benefits = tierService.getTierBenefits('GOLD');

      expect(benefits.pointsMultiplier).toBe(2.0);
      expect(benefits.freeDelivery).toBe(true);
      expect(benefits.exclusiveAccess).toBe(true);
    });

    it('should return correct benefits for PLATINUM tier', () => {
      const benefits = tierService.getTierBenefits('PLATINUM');

      expect(benefits.pointsMultiplier).toBe(3.0);
      expect(benefits.redemptionPercentage).toBe(100);
      expect(benefits.exclusiveAccess).toBe(true);
    });
  });

  describe('calculateTierFromPoints', () => {
    it('should calculate BRONZE tier at 0 points', () => {
      const result = tierService.calculateTierFromPoints(0);

      expect(result.tier).toBe('BRONZE');
      expect(result.nextTier).toBe('SILVER');
    });

    it('should calculate correct tier boundaries', () => {
      const testCases = [
        { points: 0, expectedTier: 'BRONZE' },
        { points: 500, expectedTier: 'BRONZE' },
        { points: 1000, expectedTier: 'SILVER' },
        { points: 3000, expectedTier: 'SILVER' },
        { points: 5000, expectedTier: 'GOLD' },
        { points: 8000, expectedTier: 'GOLD' },
        { points: 10000, expectedTier: 'PLATINUM' },
        { points: 50000, expectedTier: 'PLATINUM' },
      ];

      testCases.forEach(({ points, expectedTier }) => {
        const result = tierService.calculateTierFromPoints(points);
        expect(result.tier).toBe(expectedTier);
      });
    });

    it('should calculate progress towards next tier', () => {
      // 2500 points in SILVER (1000-5000 range)
      const result = tierService.calculateTierFromPoints(2500);

      expect(result.tier).toBe('SILVER');
      expect(result.tierProgress).toBeGreaterThan(35);
      expect(result.tierProgress).toBeLessThan(40);
      expect(result.pointsToNextTier).toBe(2500);
    });

    it('should handle PLATINUM correctly (no next tier)', () => {
      const result = tierService.calculateTierFromPoints(15000);

      expect(result.tier).toBe('PLATINUM');
      expect(result.nextTier).toBeNull();
      expect(result.pointsToNextTier).toBe(0);
      expect(result.tierProgress).toBe(100);
    });
  });

  describe('checkTierUpgrade', () => {
    it('should return no upgrade for non-existent customer', async () => {
      (CustomerPoints.findOne as any).mockResolvedValue(null);

      const result = await tierService.checkTierUpgrade('NON-EXISTENT', 'program-1');

      expect(result.upgraded).toBe(false);
      expect(result.newTier).toBeNull();
    });

    it('should detect tier upgrade needed', async () => {
      const mockCustomer = {
        customerId: 'CUST-1',
        programId: 'program-1',
        tier: 'BRONZE',
        lifetimePoints: 1500, // Should be SILVER
        save: vi.fn().mockResolvedValue(undefined),
      };

      (CustomerPoints.findOne as any).mockResolvedValue(mockCustomer);

      const result = await tierService.checkTierUpgrade('CUST-1', 'program-1');

      expect(result.upgraded).toBe(true);
      expect(result.newTier).toBe('SILVER');
      expect(mockCustomer.save).toHaveBeenCalled();
    });

    it('should not upgrade if already at correct tier', async () => {
      const mockCustomer = {
        customerId: 'CUST-1',
        programId: 'program-1',
        tier: 'GOLD',
        lifetimePoints: 6000, // Still GOLD range
        save: vi.fn(),
      };

      (CustomerPoints.findOne as any).mockResolvedValue(mockCustomer);

      const result = await tierService.checkTierUpgrade('CUST-1', 'program-1');

      expect(result.upgraded).toBe(false);
      expect(mockCustomer.save).not.toHaveBeenCalled();
    });
  });

  describe('calculatePointsValue', () => {
    it('should calculate value at 25% for BRONZE', () => {
      const value = tierService.calculatePointsValue(1000, 'BRONZE');

      // 1000 points / 100 * 1 * 0.25 = 2.5
      expect(value).toBe(2.5);
    });

    it('should calculate value at 50% for SILVER', () => {
      const value = tierService.calculatePointsValue(1000, 'SILVER');

      expect(value).toBe(5.0);
    });

    it('should calculate value at 75% for GOLD', () => {
      const value = tierService.calculatePointsValue(1000, 'GOLD');

      expect(value).toBe(7.5);
    });

    it('should calculate value at 100% for PLATINUM', () => {
      const value = tierService.calculatePointsValue(1000, 'PLATINUM');

      expect(value).toBe(10.0);
    });
  });

  describe('getEligibleOffers', () => {
    it('should return null for non-existent customer', async () => {
      (CustomerPoints.findOne as any).mockResolvedValue(null);

      const result = await tierService.getEligibleOffers('NON-EXISTENT', 'program-1');

      expect(result).toBeNull();
    });

    it('should return eligible offers for GOLD customer', async () => {
      const mockCustomer = {
        customerId: 'CUST-1',
        tier: 'GOLD',
      };

      (CustomerPoints.findOne as any).mockResolvedValue(mockCustomer);

      const result = await tierService.getEligibleOffers('CUST-1', 'program-1');

      expect(result?.tierExclusive).toContain('BRONZE');
      expect(result?.tierExclusive).toContain('SILVER');
      expect(result?.tierExclusive).toContain('GOLD');
      expect(result?.birthdayBonus).toBe(true);
      expect(result?.freeDelivery).toBe(true);
    });

    it('should not include higher tier offers', async () => {
      const mockCustomer = {
        customerId: 'CUST-1',
        tier: 'SILVER',
      };

      (CustomerPoints.findOne as any).mockResolvedValue(mockCustomer);

      const result = await tierService.getEligibleOffers('CUST-1', 'program-1');

      expect(result?.tierExclusive).not.toContain('GOLD');
      expect(result?.tierExclusive).not.toContain('PLATINUM');
      expect(result?.freeDelivery).toBe(false);
    });
  });

  describe('getCustomerTierSummary', () => {
    it('should return null for non-existent customer', async () => {
      (CustomerPoints.findOne as any).mockResolvedValue(null);

      const result = await tierService.getCustomerTierSummary('NON-EXISTENT', 'program-1');

      expect(result).toBeNull();
    });

    it('should return complete tier summary', async () => {
      const mockCustomer = {
        customerId: 'CUST-1',
        programId: 'program-1',
        tier: 'GOLD',
        nextTier: 'PLATINUM',
        tierProgress: 65,
        pointsToNextTier: 3500,
        lifetimePoints: 6500,
        updatedAt: new Date('2024-01-15'),
      };

      (PointsTransaction.find as any).mockReturnValue({
        sort: vi.fn().mockResolvedValue([]),
      });

      (CustomerPoints.findOne as any).mockResolvedValue(mockCustomer);

      const result = await tierService.getCustomerTierSummary('CUST-1', 'program-1');

      expect(result?.currentTier.name).toBe('GOLD');
      expect(result?.nextTier?.name).toBe('PLATINUM');
      expect(result?.progress).toBe(65);
      expect(result?.pointsToNextTier).toBe(3500);
      expect(result?.lifetimePoints).toBe(6500);
    });

    it('should include tier history', async () => {
      const mockCustomer = {
        customerId: 'CUST-1',
        programId: 'program-1',
        tier: 'GOLD',
        nextTier: 'PLATINUM',
        tierProgress: 50,
        pointsToNextTier: 5000,
        lifetimePoints: 7500,
        updatedAt: new Date('2024-06-01'),
      };

      const mockTransactions = [
        { metadata: { tierChange: true, newTier: 'BRONZE' }, createdAt: new Date('2024-01-01') },
        { metadata: { tierChange: true, newTier: 'SILVER' }, createdAt: new Date('2024-03-01') },
      ];

      (PointsTransaction.find as any).mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockTransactions),
      });

      (CustomerPoints.findOne as any).mockResolvedValue(mockCustomer);

      const result = await tierService.getCustomerTierSummary('CUST-1', 'program-1');

      expect(result?.tierHistory).toBeDefined();
      expect(result?.tierHistory.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('TIER_BENEFITS Constants', () => {
  it('should have increasing multipliers across tiers', () => {
    const tiers: Array<keyof typeof TIER_BENEFITS> = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

    for (let i = 1; i < tiers.length; i++) {
      expect(TIER_BENEFITS[tiers[i]].pointsMultiplier).toBeGreaterThan(
        TIER_BENEFITS[tiers[i - 1]].pointsMultiplier
      );
    }
  });

  it('should have increasing redemption percentages across tiers', () => {
    const tiers: Array<keyof typeof TIER_BENEFITS> = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

    for (let i = 1; i < tiers.length; i++) {
      expect(TIER_BENEFITS[tiers[i]].redemptionPercentage).toBeGreaterThan(
        TIER_BENEFITS[tiers[i - 1]].redemptionPercentage
      );
    }
  });

  it('should have birthday bonus for all tiers', () => {
    const tiers: Array<keyof typeof TIER_BENEFITS> = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

    tiers.forEach((tier) => {
      expect(TIER_BENEFITS[tier].birthdayBonus).toBe(true);
    });
  });

  it('should have exclusive access only for GOLD and PLATINUM', () => {
    expect(TIER_BENEFITS.BRONZE.exclusiveAccess).toBe(false);
    expect(TIER_BENEFITS.SILVER.exclusiveAccess).toBe(false);
    expect(TIER_BENEFITS.GOLD.exclusiveAccess).toBe(true);
    expect(TIER_BENEFITS.PLATINUM.exclusiveAccess).toBe(true);
  });

  it('should have free delivery only for GOLD and PLATINUM', () => {
    expect(TIER_BENEFITS.BRONZE.freeDelivery).toBe(false);
    expect(TIER_BENEFITS.SILVER.freeDelivery).toBe(false);
    expect(TIER_BENEFITS.GOLD.freeDelivery).toBe(true);
    expect(TIER_BENEFITS.PLATINUM.freeDelivery).toBe(true);
  });
});

describe('TIER_THRESHOLDS Constants', () => {
  it('should have increasing thresholds', () => {
    const tiers: Array<keyof typeof TIER_THRESHOLDS> = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

    for (let i = 1; i < tiers.length; i++) {
      expect(TIER_THRESHOLDS[tiers[i]]).toBeGreaterThan(TIER_THRESHOLDS[tiers[i - 1]]);
    }
  });

  it('should have BRONZE threshold at 0', () => {
    expect(TIER_THRESHOLDS.BRONZE).toBe(0);
  });

  it('should have PLATINUM as highest threshold', () => {
    expect(TIER_THRESHOLDS.PLATINUM).toBeGreaterThan(TIER_THRESHOLDS.GOLD);
    expect(TIER_THRESHOLDS.PLATINUM).toBeGreaterThan(10000);
  });
});

describe('POINTS_PER_RUPEE Constant', () => {
  it('should be defined and positive', () => {
    expect(POINTS_PER_RUPEE).toBeDefined();
    expect(POINTS_PER_RUPEE).toBeGreaterThan(0);
  });
});

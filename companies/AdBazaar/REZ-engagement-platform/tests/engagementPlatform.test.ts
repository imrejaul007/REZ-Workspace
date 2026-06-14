import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EngagementPlatform } from '../src/index';

// Mock winston logger
vi.mock('winston', () => ({
  default: {
    createLogger: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));

// Mock middleware
vi.mock('../src/middleware/auth', () => ({
  auth: (_req: unknown, _res: unknown, next: () => void) => next(),
  rateLimit: (_req: unknown, _res: unknown, next: () => void) => next(),
  requestId: (_req: unknown, _res: unknown, next: () => void) => next(),
  errorHandler: (_err: unknown, _req: unknown, res: { status: () => { json: (data: unknown) => unknown } }, _next: unknown) => {
    res.status(500).json({ error: 'test error' });
  },
}));

describe('EngagementPlatform', () => {
  let platform: EngagementPlatform;

  beforeEach(() => {
    platform = new EngagementPlatform();
  });

  describe('Initialization', () => {
    it('should create an instance without errors', () => {
      expect(platform).toBeDefined();
    });

    it('should accept valid configuration', async () => {
      const config = {
        port: 3000,
        loyaltyConfig: {
          tiers: [
            { name: 'Bronze', minPoints: 0, multiplier: 1.0 },
            { name: 'Silver', minPoints: 1000, multiplier: 1.25 },
          ],
          pointExpirationDays: 365,
          autoUpgrade: true,
        },
        offerConfig: {
          maxOffersPerUser: 10,
          offerTypes: ['discount', 'cashback'],
          validationRules: { minOrderValue: 0, maxDiscount: 100 },
        },
        gamificationConfig: {
          badges: [
            { id: 'first_purchase', name: 'First Purchase', points: 50 },
          ],
          streakConfig: {
            gracePeriodHours: 24,
            streakMilestones: [7, 14, 30],
          },
        },
        referralConfig: {
          referrerReward: 500,
          refereeReward: 250,
          maxReferralsPerUser: 10,
          referralCodeLength: 8,
        },
      };

      await expect(platform.initialize(config)).resolves.toBeUndefined();
    });

    it('should throw error if initialized twice', async () => {
      const config = {
        port: 3000,
        loyaltyConfig: {
          tiers: [],
          pointExpirationDays: 365,
          autoUpgrade: false,
        },
        offerConfig: {
          maxOffersPerUser: 10,
          offerTypes: ['discount'],
          validationRules: { minOrderValue: 0, maxDiscount: 100 },
        },
        gamificationConfig: {
          badges: [],
          streakConfig: { gracePeriodHours: 24, streakMilestones: [] },
        },
        referralConfig: {
          referrerReward: 100,
          refereeReward: 50,
          maxReferralsPerUser: 5,
          referralCodeLength: 6,
        },
      };

      await platform.initialize(config);
      await expect(platform.initialize(config)).rejects.toThrow('Platform already initialized');
    });
  });

  describe('Engine Access', () => {
    it('should provide access to all engines after initialization', async () => {
      const config = {
        port: 3000,
        loyaltyConfig: {
          tiers: [{ name: 'Bronze', minPoints: 0, multiplier: 1.0 }],
          pointExpirationDays: 365,
          autoUpgrade: false,
        },
        offerConfig: {
          maxOffersPerUser: 10,
          offerTypes: ['discount'],
          validationRules: { minOrderValue: 0, maxDiscount: 100 },
        },
        gamificationConfig: {
          badges: [],
          streakConfig: { gracePeriodHours: 24, streakMilestones: [] },
        },
        referralConfig: {
          referrerReward: 100,
          refereeReward: 50,
          maxReferralsPerUser: 5,
          referralCodeLength: 6,
        },
      };

      await platform.initialize(config);
      const engines = platform.getEngines();

      expect(engines.loyalty).toBeDefined();
      expect(engines.offers).toBeDefined();
      expect(engines.gamification).toBeDefined();
      expect(engines.referrals).toBeDefined();
      expect(engines.campaigns).toBeDefined();
    });
  });

  describe('Server Lifecycle', () => {
    it('should throw error when starting without initialization', () => {
      expect(() => platform.start(3000)).toThrow('Platform must be initialized before starting');
    });

    it('should start successfully after initialization', async () => {
      const config = {
        port: 3001,
        loyaltyConfig: {
          tiers: [{ name: 'Bronze', minPoints: 0, multiplier: 1.0 }],
          pointExpirationDays: 365,
          autoUpgrade: false,
        },
        offerConfig: {
          maxOffersPerUser: 10,
          offerTypes: ['discount'],
          validationRules: { minOrderValue: 0, maxDiscount: 100 },
        },
        gamificationConfig: {
          badges: [],
          streakConfig: { gracePeriodHours: 24, streakMilestones: [] },
        },
        referralConfig: {
          referrerReward: 100,
          refereeReward: 50,
          maxReferralsPerUser: 5,
          referralCodeLength: 6,
        },
      };

      await platform.initialize(config);
      expect(() => platform.start(3001)).not.toThrow();
    });
  });
});

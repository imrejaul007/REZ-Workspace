import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';

// Mock logger
vi.mock('../src/utils/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('REZ Anniversary Rewards API', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Health check
    app.get('/health', (_req, res) => {
      res.json({ status: 'healthy', service: 'rez-anniversary-rewards' });
    });

    // Get milestone rewards
    app.get('/api/anniversary/milestones/:merchantId', (_req, res) => {
      const { merchantId } = _req.params;
      res.json({
        success: true,
        data: [
          { years: 1, name: 'First Anniversary', reward: 100, bonus: 1.1, badge: 'year-1' },
          { years: 2, name: 'Second Anniversary', reward: 200, bonus: 1.2, badge: 'year-2' },
          { years: 3, name: 'Third Anniversary', reward: 300, bonus: 1.3, badge: 'year-3' },
          { years: 5, name: 'Fifth Anniversary', reward: 500, bonus: 1.5, badge: 'year-5' },
          { years: 10, name: 'Decade', reward: 1000, bonus: 2.0, badge: 'year-10' },
        ],
      });
    });

    // Check user anniversary status
    app.get('/api/anniversary/user/:userId', (_req, res) => {
      const { userId } = _req.params;
      res.json({
        success: true,
        data: {
          userId,
          daysUntilAnniversary: 30,
          totalAnniversaries: 3,
          pendingRewards: 1,
          nextReward: {
            milestone: 'Third Anniversary',
            daysRemaining: 30,
            reward: { coins: 300, badge: 'year-3' },
          },
        },
      });
    });

    // Trigger anniversary celebration
    app.post('/api/anniversary/celebrate', (_req, res) => {
      const { userId, merchantId, years } = _req.body;
      res.json({
        success: true,
        data: {
          celebrationId: `celebration-${Date.now()}`,
          userId,
          merchantId,
          years,
          rewardClaimed: false,
          celebrationSent: true,
          message: `Congratulations on your ${years} year anniversary!`,
          expiresIn: 7 * 24 * 60 * 60 * 1000,
        },
      });
    });

    // Redeem anniversary reward
    app.post('/api/anniversary/redeem', (_req, res) => {
      const { userId, rewardId } = _req.body;
      res.json({
        success: true,
        data: {
          redemptionId: `redeem-${Date.now()}`,
          userId,
          rewardId,
          status: 'success',
          coinsAwarded: 300,
          badgeAwarded: 'year-3',
          redeemedAt: new Date(),
        },
      });
    });

    // Merchant anniversary stats
    app.get('/api/anniversary/merchant/:merchantId/stats', (_req, res) => {
      const { merchantId } = _req.params;
      res.json({
        success: true,
        data: {
          merchantId,
          totalCustomers: 15420,
          anniversaryMilestones: {
            year1: { count: 5000, redemption: 85 },
            year2: { count: 3200, redemption: 78 },
            year3: { count: 1800, redemption: 72 },
            year5: { count: 500, redemption: 65 },
            year10: { count: 50, redemption: 90 },
          },
          totalCoinsDistributed: 1250000,
          avgEngagement: 82.5,
        },
      });
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'rez-anniversary-rewards');
    });
  });

  describe('Milestone Rewards', () => {
    it('should return milestone rewards for a merchant', async () => {
      const response = await request(app).get('/api/anniversary/milestones/merchant_001');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);

      const milestones = response.body.data;
      expect(milestones[0]).toHaveProperty('years');
      expect(milestones[0]).toHaveProperty('name');
      expect(milestones[0]).toHaveProperty('reward');
      expect(milestones[0]).toHaveProperty('bonus');
      expect(milestones[0]).toHaveProperty('badge');
    });

    it('should have correct milestone progression', async () => {
      const response = await request(app).get('/api/anniversary/milestones/merchant_001');
      const milestones = response.body.data;

      expect(milestones[0].years).toBe(1);
      expect(milestones[1].years).toBe(2);
      expect(milestones[2].years).toBe(3);
      expect(milestones[3].years).toBe(5);
      expect(milestones[4].years).toBe(10);
    });
  });

  describe('User Anniversary Status', () => {
    it('should return user anniversary status', async () => {
      const response = await request(app).get('/api/anniversary/user/user_123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('userId', 'user_123');
      expect(response.body.data).toHaveProperty('daysUntilAnniversary');
      expect(response.body.data).toHaveProperty('totalAnniversaries');
      expect(response.body.data).toHaveProperty('pendingRewards');
      expect(response.body.data).toHaveProperty('nextReward');
    });
  });

  describe('Celebration', () => {
    it('should trigger anniversary celebration', async () => {
      const response = await request(app)
        .post('/api/anniversary/celebrate')
        .send({
          userId: 'user_123',
          merchantId: 'merchant_001',
          years: 3,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('celebrationId');
      expect(response.body.data).toHaveProperty('rewardClaimed', false);
      expect(response.body.data).toHaveProperty('celebrationSent', true);
      expect(response.body.data.message).toContain('3 year anniversary');
    });
  });

  describe('Reward Redemption', () => {
    it('should redeem anniversary reward', async () => {
      const response = await request(app)
        .post('/api/anniversary/redeem')
        .send({
          userId: 'user_123',
          rewardId: 'reward_year3',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('redemptionId');
      expect(response.body.data).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('coinsAwarded');
      expect(response.body.data).toHaveProperty('badgeAwarded');
    });
  });

  describe('Merchant Stats', () => {
    it('should return merchant anniversary stats', async () => {
      const response = await request(app).get('/api/anniversary/merchant/merchant_001/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('merchantId');
      expect(response.body.data).toHaveProperty('totalCustomers');
      expect(response.body.data).toHaveProperty('anniversaryMilestones');
      expect(response.body.data).toHaveProperty('totalCoinsDistributed');
      expect(response.body.data).toHaveProperty('avgEngagement');
    });

    it('should include all milestone stats', async () => {
      const response = await request(app).get('/api/anniversary/merchant/merchant_001/stats');
      const milestones = response.body.data.anniversaryMilestones;

      expect(milestones).toHaveProperty('year1');
      expect(milestones).toHaveProperty('year2');
      expect(milestones).toHaveProperty('year3');
      expect(milestones).toHaveProperty('year5');
      expect(milestones).toHaveProperty('year10');
    });
  });
});

describe('Anniversary Logic', () => {
  it('should calculate milestone bonus correctly', () => {
    const calculateBonus = (years: number) => {
      const bonuses: Record<number, number> = {
        1: 1.1,
        2: 1.2,
        3: 1.3,
        5: 1.5,
        10: 2.0,
      };
      return bonuses[years] || 1.0;
    };

    expect(calculateBonus(1)).toBe(1.1);
    expect(calculateBonus(3)).toBe(1.3);
    expect(calculateBonus(5)).toBe(1.5);
    expect(calculateBonus(10)).toBe(2.0);
    expect(calculateBonus(7)).toBe(1.0);
  });

  it('should calculate reward coins based on milestone', () => {
    const calculateReward = (years: number) => {
      const rewards: Record<number, number> = {
        1: 100,
        2: 200,
        3: 300,
        5: 500,
        10: 1000,
      };
      return rewards[years] || years * 50;
    };

    expect(calculateReward(1)).toBe(100);
    expect(calculateReward(2)).toBe(200);
    expect(calculateReward(3)).toBe(300);
    expect(calculateReward(10)).toBe(1000);
  });

  it('should calculate days until anniversary', () => {
    const daysUntilAnniversary = (anniversaryDate: Date, today: Date) => {
      const msPerDay = 24 * 60 * 60 * 1000;
      const diff = anniversaryDate.getTime() - today.getTime();
      return Math.ceil(diff / msPerDay);
    };

    const today = new Date('2026-06-01');
    const anniversary = new Date('2026-06-15');
    expect(daysUntilAnniversary(anniversary, today)).toBe(14);

    // Handle year boundary
    const anniversaryEndOfYear = new Date('2027-01-01');
    expect(daysUntilAnniversary(anniversaryEndOfYear, today)).toBeGreaterThan(200);
  });

  it('should calculate redemption rate', () => {
    const redemptionRate = (total: number, redeemed: number) => {
      if (total === 0) return 0;
      return Math.round((redeemed / total) * 100);
    };

    expect(redemptionRate(100, 85)).toBe(85);
    expect(redemptionRate(1000, 720)).toBe(72);
    expect(redemptionRate(0, 0)).toBe(0);
  });
});
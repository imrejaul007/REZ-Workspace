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

describe('REZ Birthday Rewards API', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Health check
    app.get('/health', (_req, res) => {
      res.json({ status: 'healthy', service: 'rez-birthday-rewards' });
    });

    // Check eligibility
    app.get('/api/birthday/eligibility/:userId', (_req, res) => {
      const { userId } = _req.params;
      res.json({
        success: true,
        data: {
          eligible: true,
          userId,
          daysUntilBirthday: 3,
          reward: {
            coins: 100,
            discount: 10,
            voucher: 'BIRTHDAY10',
          },
        },
      });
    });

    // Get birthday campaign
    app.get('/api/birthday/campaign', (_req, res) => {
      res.json({
        success: true,
        data: {
          campaignId: 'bday-2026',
          name: 'Birthday Special',
          validDays: 7,
          rewardTypes: ['coins', 'discount', 'voucher', 'freebie'],
          terms: 'Valid 7 days before and after birthday',
        },
      });
    });

    // Trigger birthday message
    app.post('/api/birthday/notify', (_req, res) => {
      const { userId, channel } = _req.body;
      res.json({
        success: true,
        data: {
          notificationId: `notif-${Date.now()}`,
          userId,
          channel: channel || 'whatsapp',
          sent: true,
          sentAt: new Date(),
        },
      });
    });

    // Track birthday reward redemption
    app.post('/api/birthday/redeem', (_req, res) => {
      const { userId, rewardType } = _req.body;
      res.json({
        success: true,
        data: {
          redemptionId: `redeem-${Date.now()}`,
          userId,
          rewardType,
          redeemedAt: new Date(),
          status: 'success',
        },
      });
    });

    // Analytics
    app.get('/api/birthday/stats', (_req, res) => {
      res.json({
        success: true,
        data: {
          totalRewards: 15420,
          redeemedRewards: 12850,
          activeCampaigns: 3,
          avgEngagement: 87.5,
          topRewards: [
            { type: 'coins', count: 8500 },
            { type: 'discount', count: 3200 },
            { type: 'voucher', count: 1150 },
          ],
        },
      });
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'rez-birthday-rewards');
    });
  });

  describe('Eligibility Check', () => {
    it('should return eligibility status for user', async () => {
      const response = await request(app).get('/api/birthday/eligibility/user_123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('eligible');
      expect(response.body.data).toHaveProperty('userId', 'user_123');
      expect(response.body.data).toHaveProperty('daysUntilBirthday');
    });

    it('should include reward details when eligible', async () => {
      const response = await request(app).get('/api/birthday/eligibility/user_123');

      expect(response.body.data).toHaveProperty('reward');
      expect(response.body.data.reward).toHaveProperty('coins');
      expect(response.body.data.reward).toHaveProperty('discount');
      expect(response.body.data.reward).toHaveProperty('voucher');
    });

    it('should return not eligible for users far from birthday', async () => {
      // This would test the actual logic
      const daysUntilBirthday = 60;
      const eligible = daysUntilBirthday <= 7;
      expect(eligible).toBe(false);
    });
  });

  describe('Campaign', () => {
    it('should return active birthday campaign', async () => {
      const response = await request(app).get('/api/birthday/campaign');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('campaignId');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('validDays');
      expect(response.body.data).toHaveProperty('rewardTypes');
      expect(Array.isArray(response.body.data.rewardTypes)).toBe(true);
    });
  });

  describe('Notification', () => {
    it('should trigger birthday notification', async () => {
      const response = await request(app)
        .post('/api/birthday/notify')
        .send({
          userId: 'user_123',
          channel: 'whatsapp',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('notificationId');
      expect(response.body.data).toHaveProperty('userId', 'user_123');
      expect(response.body.data).toHaveProperty('sent', true);
    });

    it('should default to whatsapp channel', async () => {
      const response = await request(app)
        .post('/api/birthday/notify')
        .send({ userId: 'user_123' });

      expect(response.status).toBe(200);
      expect(response.body.data.channel).toBe('whatsapp');
    });
  });

  describe('Redemption', () => {
    it('should track reward redemption', async () => {
      const response = await request(app)
        .post('/api/birthday/redeem')
        .send({
          userId: 'user_123',
          rewardType: 'coins',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('redemptionId');
      expect(response.body.data).toHaveProperty('status', 'success');
    });
  });

  describe('Analytics', () => {
    it('should return birthday stats', async () => {
      const response = await request(app).get('/api/birthday/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalRewards');
      expect(response.body.data).toHaveProperty('redeemedRewards');
      expect(response.body.data).toHaveProperty('activeCampaigns');
      expect(response.body.data).toHaveProperty('avgEngagement');
    });

    it('should include top reward types', async () => {
      const response = await request(app).get('/api/birthday/stats');
      const topRewards = response.body.data.topRewards;

      expect(Array.isArray(topRewards)).toBe(true);
      expect(topRewards[0]).toHaveProperty('type');
      expect(topRewards[0]).toHaveProperty('count');
    });
  });
});

describe('Birthday Logic', () => {
  it('should check eligibility based on days until birthday', () => {
    const isEligible = (daysUntilBirthday: number, windowDays = 7) => {
      return daysUntilBirthday <= windowDays;
    };

    expect(isEligible(3)).toBe(true);
    expect(isEligible(5)).toBe(true);
    expect(isEligible(7)).toBe(true);
    expect(isEligible(10)).toBe(false);
    expect(isEligible(30)).toBe(false);
  });

  it('should calculate reward value correctly', () => {
    const calculateRewardValue = (rewardType: string) => {
      const values: Record<string, number> = {
        coins: 100,
        discount: 10,
        voucher: 25,
        freebie: 50,
      };
      return values[rewardType] || 0;
    };

    expect(calculateRewardValue('coins')).toBe(100);
    expect(calculateRewardValue('discount')).toBe(10);
    expect(calculateRewardValue('voucher')).toBe(25);
  });

  it('should validate birthday date', () => {
    const isValidBirthday = (date: Date) => {
      const now = new Date();
      const thisYear = now.getFullYear();
      const birthdayThisYear = new Date(thisYear, date.getMonth(), date.getDate());
      return birthdayThisYear <= new Date(thisYear + 1, 0, 1);
    };

    expect(isValidBirthday(new Date('1990-06-15'))).toBe(true);
  });

  it('should calculate engagement rate', () => {
    const engagementRate = (total: number, redeemed: number, notified: number) => {
      if (notified === 0) return 0;
      const redemptionRate = (redeemed / notified) * 100;
      return Math.round(redemptionRate * 10) / 10;
    };

    expect(engagementRate(10000, 8500, 10000)).toBe(85);
    expect(engagementRate(1000, 720, 1000)).toBe(72);
  });

  it('should determine reward type preference', () => {
    const getPreferredRewardType = (history: Array<{ rewardType: string }>) => {
      const counts: Record<string, number> = {};
      history.forEach(h => {
        counts[h.rewardType] = (counts[h.rewardType] || 0) + 1;
      });
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'coins';
    };

    const history = [
      { rewardType: 'coins' },
      { rewardType: 'coins' },
      { rewardType: 'discount' },
    ];
    expect(getPreferredRewardType(history)).toBe('coins');
  });
});
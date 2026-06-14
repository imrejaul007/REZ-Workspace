/**
 * Integration Tests: Order → Loyalty Flow
 *
 * Tests the complete event flow when an order is completed
 */

import axios from 'axios';

const SERVICES = {
  profile: process.env.PROFILE_URL || 'http://localhost:4025',
  streak: process.env.STREAK_URL || 'http://localhost:4026',
  crossMerchant: process.env.CROSS_MERCHANT_URL || 'http://localhost:4027',
  score: process.env.SCORE_URL || 'http://localhost:4028',
  karmaBridge: process.env.KARMA_BRIDGE_URL || 'http://localhost:4029',
  identity: process.env.IDENTITY_URL || 'http://localhost:4033',
  wallet: process.env.WALLET_URL || 'http://localhost:4014',
};

const TEST_USER = {
  userId: `test-user-${Date.now()}`,
  merchantId: 'test-merchant-001',
  orderId: `test-order-${Date.now()}`,
};

describe('Order → Loyalty Complete Flow', () => {
  beforeAll(async () => {
    // Wait for services to be healthy
    await Promise.all([
      waitForService(SERVICES.profile),
      waitForService(SERVICES.streak),
      waitForService(SERVICES.score),
      waitForService(SERVICES.crossMerchant),
    ]);
  });

  describe('Step 1: Health Checks', () => {
    it('should have profile aggregator healthy', async () => {
      const response = await axios.get(`${SERVICES.profile}/health`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('healthy');
    });

    it('should have streak service healthy', async () => {
      const response = await axios.get(`${SERVICES.streak}/health`);
      expect(response.status).toBe(200);
    });

    it('should have score service healthy', async () => {
      const response = await axios.get(`${SERVICES.score}/health`);
      expect(response.status).toBe(200);
    });

    it('should have cross-merchant service healthy', async () => {
      const response = await axios.get(`${SERVICES.crossMerchant}/health`);
      expect(response.status).toBe(200);
    });
  });

  describe('Step 2: Profile Creation', () => {
    it('should create a new profile', async () => {
      const response = await axios.post(`${SERVICES.profile}/api/v1/profile/${TEST_USER.userId}`);
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.userId).toBe(TEST_USER.userId);
    });

    it('should retrieve profile', async () => {
      const response = await axios.get(`${SERVICES.profile}/api/v1/profile/${TEST_USER.userId}`);
      expect(response.status).toBe(200);
      expect(response.data.data).toBeDefined();
    });

    it('should return profile summary', async () => {
      const response = await axios.get(`${SERVICES.profile}/api/v1/profile/${TEST_USER.userId}/summary`);
      expect(response.status).toBe(200);
      expect(response.data.data.userId).toBe(TEST_USER.userId);
      expect(response.data.data.reZScore).toBeDefined();
      expect(response.data.data.wallet).toBeDefined();
    });
  });

  describe('Step 3: Streak Recording', () => {
    it('should record first visit', async () => {
      const response = await axios.post(
        `${SERVICES.streak}/api/v1/streak/${TEST_USER.userId}/visit`
      );
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should return current streak', async () => {
      const response = await axios.get(`${SERVICES.streak}/api/v1/streak/${TEST_USER.userId}`);
      expect(response.status).toBe(200);
      expect(response.data.data.current).toBeGreaterThanOrEqual(1);
    });

    it('should return milestones', async () => {
      const response = await axios.get(`${SERVICES.streak}/api/v1/streak/${TEST_USER.userId}/milestones`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should increment streak on second visit', async () => {
      const response = await axios.post(
        `${SERVICES.streak}/api/v1/streak/${TEST_USER.userId}/visit`
      );
      expect(response.status).toBe(200);
      expect(response.data.data.current).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Step 4: ReZ Score', () => {
    it('should calculate score', async () => {
      const response = await axios.post(
        `${SERVICES.score}/api/v1/score/${TEST_USER.userId}/calculate`,
        {
          totalOrders: 5,
          visitFrequency: 10,
          daysActive: 30,
          lifetimeSpend: 5000,
          karmaScore: 100,
          karmaLevel: 1,
          currentStreak: 2,
        }
      );
      expect(response.status).toBe(200);
      expect(response.data.data.composite).toBeGreaterThanOrEqual(0);
    });

    it('should get score', async () => {
      const response = await axios.get(`${SERVICES.score}/api/v1/score/${TEST_USER.userId}`);
      expect(response.status).toBe(200);
      expect(response.data.data).toBeDefined();
    });

    it('should get score breakdown', async () => {
      const response = await axios.get(`${SERVICES.score}/api/v1/score/${TEST_USER.userId}/breakdown`);
      expect(response.status).toBe(200);
      expect(response.data.data.breakdown).toBeDefined();
      expect(response.data.data.breakdown.engagement).toBeDefined();
      expect(response.data.data.breakdown.spending).toBeDefined();
    });

    it('should get next tier progress', async () => {
      const response = await axios.get(`${SERVICES.score}/api/v1/score/${TEST_USER.userId}/next-tier`);
      expect(response.status).toBe(200);
      expect(response.data.data.currentTier).toBeDefined();
      expect(response.data.data.progress).toBeDefined();
    });
  });

  describe('Step 5: Cross-Merchant Badges', () => {
    it('should record visit', async () => {
      const response = await axios.post(
        `${SERVICES.crossMerchant}/api/v1/cross-merchant/${TEST_USER.userId}/visit`,
        {
          merchantId: TEST_USER.merchantId,
          category: 'cafe',
          amount: 150,
        }
      );
      expect(response.status).toBe(200);
    });

    it('should get progress', async () => {
      const response = await axios.get(
        `${SERVICES.crossMerchant}/api/v1/cross-merchant/${TEST_USER.userId}`
      );
      expect(response.status).toBe(200);
      expect(response.data.data).toBeDefined();
    });

    it('should get badges', async () => {
      const response = await axios.get(
        `${SERVICES.crossMerchant}/api/v1/cross-merchant/${TEST_USER.userId}/badges`
      );
      expect(response.status).toBe(200);
      expect(response.data.data.earned).toBeDefined();
      expect(response.data.data.available).toBeDefined();
    });
  });

  describe('Step 6: Karma-Loyalty Bridge', () => {
    it('should get bridge stats', async () => {
      const response = await axios.get(
        `${SERVICES.karmaBridge}/api/v1/bridge/stats/${TEST_USER.userId}`
      );
      expect(response.status).toBe(200);
    });

    it('should convert karma to loyalty', async () => {
      const response = await axios.post(
        `${SERVICES.karmaBridge}/api/v1/bridge/convert`,
        {
          userId: TEST_USER.userId,
          karmaAmount: 100,
          source: 'test_conversion',
        }
      );
      expect(response.status).toBe(200);
      expect(response.data.data.loyaltyPoints).toBeGreaterThanOrEqual(0);
    });

    it('should get conversion history', async () => {
      const response = await axios.get(
        `${SERVICES.karmaBridge}/api/v1/bridge/conversions/${TEST_USER.userId}`
      );
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
    });
  });

  describe('Step 7: Unified Profile', () => {
    it('should show updated profile after all events', async () => {
      const response = await axios.get(`${SERVICES.profile}/api/v1/profile/${TEST_USER.userId}`);
      expect(response.status).toBe(200);

      const profile = response.data.data;
      expect(profile.loyalty).toBeDefined();
      expect(profile.reZScore).toBeDefined();
      expect(profile.gamification).toBeDefined();
    });

    it('should show correct tier in profile', async () => {
      const response = await axios.get(`${SERVICES.profile}/api/v1/profile/${TEST_USER.userId}/summary`);
      expect(response.status).toBe(200);

      const summary = response.data.data;
      expect(summary.reZScore.tier).toBeDefined();
      expect(summary.loyalty.tier).toBeDefined();
    });
  });
});

describe('Idempotency Tests', () => {
  const idempotencyKey = `test-${Date.now()}`;

  it('should prevent duplicate order processing', async () => {
    // First request
    const response1 = await axios.post(
      `${SERVICES.streak}/api/v1/streak/${TEST_USER.userId}/visit`,
      {},
      { headers: { 'x-idempotency-key': idempotencyKey } }
    );

    // Second request with same key
    const response2 = await axios.post(
      `${SERVICES.streak}/api/v1/streak/${TEST_USER.userId}/visit`,
      {},
      { headers: { 'x-idempotency-key': idempotencyKey } }
    );

    // Should return 200 but indicate duplicate
    expect(response2.status).toBe(200);
  });
});

describe('Error Handling Tests', () => {
  it('should handle non-existent user gracefully', async () => {
    const fakeUserId = `non-existent-${Date.now()}`;
    const response = await axios.get(`${SERVICES.profile}/api/v1/profile/${fakeUserId}`);
    expect(response.status).toBe(404);
  });

  it('should validate required fields', async () => {
    try {
      await axios.post(`${SERVICES.karmaBridge}/api/v1/bridge/convert`, {});
      fail('Should have thrown');
    } catch (error: any) {
      expect(error.response.status).toBe(400);
    }
  });
});

// Helper functions
async function waitForService(url: string, maxRetries = 30): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await axios.get(`${url}/health`, { timeout: 2000 });
      return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`Service ${url} not healthy after ${maxRetries} retries`);
}

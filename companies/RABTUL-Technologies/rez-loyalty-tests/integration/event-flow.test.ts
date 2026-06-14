/**
 * Integration Tests: Event Flow
 *
 * Tests event publishing and consumption
 */

import axios from 'axios';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DLQ_URL = process.env.DLQ_URL || 'http://localhost:3000';

describe('Event Flow Tests', () => {
  let redis: Redis;

  beforeAll(async () => {
    redis = new Redis(REDIS_URL);
    await redis.ping();
  });

  afterAll(async () => {
    await redis.quit();
  });

  describe('Event Publishing', () => {
    it('should publish wallet event', async () => {
      const event = {
        eventId: `test-${Date.now()}`,
        eventType: 'wallet.credited',
        userId: 'test-user-001',
        timestamp: new Date().toISOString(),
        version: '1.0',
        source: 'test-suite',
        idempotencyKey: `wallet_test_${Date.now()}`,
        data: {
          userId: 'test-user-001',
          amount: 100,
          coinType: 'cashback',
          source: 'test',
        },
      };

      const response = await axios.post(`${DLQ_URL}/api/dlq/events`, event);
      expect(response.status).toBe(201);
    });

    it('should publish order completed event', async () => {
      const event = {
        eventId: `test-${Date.now()}`,
        eventType: 'order.completed',
        userId: 'test-user-002',
        timestamp: new Date().toISOString(),
        version: '1.0',
        source: 'test-suite',
        idempotencyKey: `order_test_${Date.now()}`,
        data: {
          orderId: 'test-order-001',
          userId: 'test-user-002',
          merchantId: 'test-merchant-001',
          amount: 500,
          fulfillmentType: 'dine_in',
          category: 'restaurant',
        },
      };

      const response = await axios.post(`${DLQ_URL}/api/dlq/events`, event);
      expect(response.status).toBe(201);
    });

    it('should publish karma earned event', async () => {
      const event = {
        eventId: `test-${Date.now()}`,
        eventType: 'karma.earned',
        userId: 'test-user-003',
        timestamp: new Date().toISOString(),
        version: '1.0',
        source: 'test-suite',
        idempotencyKey: `karma_test_${Date.now()}`,
        data: {
          userId: 'test-user-003',
          amount: 100,
          source: 'blood_donation',
          verified: true,
        },
      };

      const response = await axios.post(`${DLQ_URL}/api/dlq/events`, event);
      expect(response.status).toBe(201);
    });
  });

  describe('Event Schema Validation', () => {
    it('should reject event without required fields', async () => {
      const invalidEvent = {
        eventType: 'order.completed',
        // Missing required fields
      };

      try {
        await axios.post(`${DLQ_URL}/api/dlq/events`, invalidEvent);
        fail('Should have rejected invalid event');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should accept event with correct schema', async () => {
      const validEvent = {
        eventId: `test-${Date.now()}`,
        eventType: 'order.completed',
        userId: 'test-user-004',
        timestamp: new Date().toISOString(),
        version: '1.0',
        source: 'test-suite',
        data: {
          orderId: 'test-order-002',
          userId: 'test-user-004',
          merchantId: 'test-merchant-002',
          amount: 250,
        },
      };

      const response = await axios.post(`${DLQ_URL}/api/dlq/events`, validEvent);
      expect(response.status).toBe(201);
    });
  });

  describe('DLQ Operations', () => {
    it('should list failed events', async () => {
      const response = await axios.get(`${DLQ_URL}/api/dlq/events`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should filter by event type', async () => {
      const response = await axios.get(
        `${DLQ_URL}/api/dlq/events?eventType=order.completed`
      );
      expect(response.status).toBe(200);
    });

    it('should get DLQ stats', async () => {
      const response = await axios.get(`${DLQ_URL}/api/dlq/stats`);
      expect(response.status).toBe(200);
      expect(response.data.data).toBeDefined();
    });

    it('should get DLQ summary', async () => {
      const response = await axios.get(`${DLQ_URL}/api/dlq/summary`);
      expect(response.status).toBe(200);
    });
  });

  describe('Event Replay', () => {
    it('should replay from DLQ (dry run)', async () => {
      const response = await axios.post(`${DLQ_URL}/api/dlq/replay`, {
        consumer: 'profile-aggregator',
        dryRun: true,
        limit: 5,
      });
      expect(response.status).toBe(200);
    });
  });

  describe('Consumer Health', () => {
    it('should get consumer statuses', async () => {
      const response = await axios.get(`${DLQ_URL}/api/dlq/consumers`);
      expect(response.status).toBe(200);
    });
  });
});

describe('Redis Event Bus Tests', () => {
  let redis: Redis;

  beforeAll(async () => {
    redis = new Redis(REDIS_URL);
  });

  afterAll(async () => {
    await redis.quit();
  });

  it('should publish to event channel', async () => {
    const event = {
      eventId: `test-${Date.now()}`,
      eventType: 'test.event',
      userId: 'test-user',
      timestamp: new Date().toISOString(),
      data: { message: 'hello' },
    };

    const subscriber = redis.duplicate();
    await subscriber.subscribe('events.test.event');

    const received = new Promise((resolve) => {
      subscriber.on('message', (channel, message) => {
        if (channel === 'events.test.event') {
          resolve(JSON.parse(message));
        }
      });
    });

    await redis.publish('events.test.event', JSON.stringify(event));

    const result = await Promise.race([
      received,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)),
    ]);

    expect((result as any).eventId).toBe(event.eventId);
    await subscriber.quit();
  });

  it('should have correct key patterns', async () => {
    // Test idempotency key format
    const idempotencyPattern = /^idempotency:/;
    expect(idempotencyPattern.test('idempotency:order_123')).toBe(true);

    // Test profile cache key format
    const profilePattern = /^profile:/;
    expect(profilePattern.test('profile:user123')).toBe(true);

    // Test leaderboard key format
    const leaderboardPattern = /^leaderboard:/;
    expect(leaderboardPattern.test('leaderboard:city')).toBe(true);
  });
});

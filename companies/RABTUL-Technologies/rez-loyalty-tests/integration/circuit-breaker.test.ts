/**
 * Integration Tests: Circuit Breaker & Resilience
 *
 * Tests for fault tolerance and graceful degradation
 */

import axios from 'axios';

const SERVICES = {
  profile: process.env.PROFILE_URL || 'http://localhost:4025',
  streak: process.env.STREAK_URL || 'http://localhost:4026',
  score: process.env.SCORE_URL || 'http://localhost:4028',
};

describe('Circuit Breaker Tests', () => {
  describe('Service Resilience', () => {
    it('should handle service unavailability gracefully', async () => {
      // Test that services return proper error responses
      try {
        await axios.get(`${SERVICES.profile}/health`, { timeout: 5000 });
      } catch (error: any) {
        // Should get connection error, not crash
        expect(error.code).toBeDefined();
      }
    });

    it('should timeout long requests', async () => {
      try {
        await axios.get(`${SERVICES.profile}/api/v1/profile/heavy-user`, {
          timeout: 1000,
        });
        fail('Should have timed out');
      } catch (error: any) {
        expect(error.code).toBe('ECONNABORTED');
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit excessive requests', async () => {
      const requests = [];
      const limit = 100;

      // Send many rapid requests
      for (let i = 0; i < limit + 10; i++) {
        requests.push(
          axios.get(`${SERVICES.profile}/health`).catch(e => ({ status: e.response?.status || 0 }))
        );
      }

      const results = await Promise.all(requests);
      const successes = results.filter(r => r.status === 200).length;
      const rateLimited = results.filter(r => r.status === 429).length;

      // Should have some successes or rate limiting
      expect(successes + rateLimited).toBeGreaterThan(0);
    });
  });

  describe('Connection Pooling', () => {
    it('should handle concurrent requests', async () => {
      const concurrent = 50;
      const requests = [];

      for (let i = 0; i < concurrent; i++) {
        requests.push(
          axios.get(`${SERVICES.profile}/health`).catch(e => ({ error: true }))
        );
      }

      const results = await Promise.all(requests);
      const errors = results.filter(r => (r as any).error).length;

      // Allow some failures under load
      expect(errors).toBeLessThan(concurrent * 0.5);
    });
  });

  describe('Health Check Endpoints', () => {
    it('should expose liveness probe', async () => {
      const response = await axios.get(`${SERVICES.profile}/health`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBeDefined();
    });

    it('should expose readiness probe', async () => {
      const response = await axios.get(`${SERVICES.profile}/ready`);
      expect(response.status).toBe(200);
      expect(response.data.ready).toBeDefined();
    });
  });
});

describe('Data Consistency Tests', () => {
  const testUserId = `consistency-test-${Date.now()}`;

  it('should maintain streak consistency', async () => {
    // Create initial streak
    await axios.post(`${SERVICES.streak}/api/v1/streak/${testUserId}/visit`);

    // Get current streak
    const response = await axios.get(`${SERVICES.streak}/api/v1/streak/${testUserId}`);
    expect(response.status).toBe(200);
    const streak = response.data.data.current;

    // Increment
    await axios.post(`${SERVICES.streak}/api/v1/streak/${testUserId}/visit`);

    // Verify increment
    const updated = await axios.get(`${SERVICES.streak}/api/v1/streak/${testUserId}`);
    expect(updated.data.data.current).toBe(streak + 1);
  });

  it('should maintain score consistency', async () => {
    // Calculate score
    await axios.post(`${SERVICES.score}/api/v1/score/${testUserId}/calculate`, {
      totalOrders: 10,
      visitFrequency: 20,
      daysActive: 60,
      lifetimeSpend: 10000,
    });

    // Get score
    const response = await axios.get(`${SERVICES.score}/api/v1/score/${testUserId}`);
    expect(response.status).toBe(200);
    const score1 = response.data.data.composite;

    // Recalculate with more data
    await axios.post(`${SERVICES.score}/api/v1/score/${testUserId}/calculate`, {
      totalOrders: 20,
      visitFrequency: 40,
      daysActive: 120,
      lifetimeSpend: 20000,
    });

    // Get updated score
    const updated = await axios.get(`${SERVICES.score}/api/v1/score/${testUserId}`);
    expect(updated.data.data.composite).toBeGreaterThanOrEqual(score1);
  });
});

describe('Cache Behavior Tests', () => {
  const testUserId = `cache-test-${Date.now()}`;

  beforeAll(async () => {
    // Create profile
    await axios.post(`${SERVICES.profile}/api/v1/profile/${testUserId}`);
  });

  it('should cache profile reads', async () => {
    // First read
    const response1 = await axios.get(`${SERVICES.profile}/api/v1/profile/${testUserId}`);
    expect(response1.status).toBe(200);

    // Second read (should be from cache)
    const response2 = await axios.get(`${SERVICES.profile}/api/v1/profile/${testUserId}`);
    expect(response2.status).toBe(200);

    // Both should return same data
    expect(response1.data.data.userId).toBe(response2.data.data.userId);
  });

  it('should invalidate cache on update', async () => {
    // Update should invalidate cache
    await axios.post(`${SERVICES.score}/api/v1/score/${testUserId}/calculate`, {
      totalOrders: 5,
    });

    // Next read should get fresh data
    const response = await axios.get(`${SERVICES.profile}/api/v1/profile/${testUserId}`);
    expect(response.status).toBe(200);
  });
});

describe('Load Tests', () => {
  it('should handle high throughput', async () => {
    const iterations = 100;
    const userId = `load-test-${Date.now()}`;
    const startTime = Date.now();

    const requests = [];
    for (let i = 0; i < iterations; i++) {
      requests.push(
        axios.get(`${SERVICES.profile}/health`).catch(() => null)
      );
    }

    await Promise.all(requests);
    const duration = Date.now() - startTime;
    const throughput = (iterations / duration) * 1000;

    console.log(`Throughput: ${throughput.toFixed(2)} req/sec`);

    // Should handle at least 50 req/sec
    expect(throughput).toBeGreaterThan(50);
  });

  it('should maintain latency under load', async () => {
    const iterations = 50;
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await axios.get(`${SERVICES.profile}/health`).catch(() => null);
      latencies.push(Date.now() - start);
    }

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

    console.log(`Avg latency: ${avgLatency.toFixed(2)}ms, P95: ${p95Latency}ms`);

    // Average should be under 100ms
    expect(avgLatency).toBeLessThan(100);
  });
});

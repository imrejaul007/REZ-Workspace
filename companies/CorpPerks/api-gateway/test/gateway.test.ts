import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/index';

// Mock the services for testing
jest.mock('../src/middleware/rateLimit', () => ({
  createDynamicRateLimiter: () => (_req: any, _res: any, next: any) => next(),
  closeRateLimiter: jest.fn().mockResolvedValue(undefined),
}));

describe('CorpPerks API Gateway', () => {
  describe('Health Endpoints', () => {
    it('GET /health should return basic health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('uptime');
    });

    it('GET /ready should return readiness status', async () => {
      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ready');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('GET /metrics should return request metrics', async () => {
      const response = await request(app).get('/metrics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalRequests');
      expect(response.body).toHaveProperty('successfulRequests');
      expect(response.body).toHaveProperty('failedRequests');
      expect(response.body).toHaveProperty('successRate');
      expect(response.body).toHaveProperty('avgLatency');
      expect(response.body).toHaveProperty('activeConnections');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown/route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      expect(response.body.error).toHaveProperty('requestId');
    });
  });

  describe('Request ID', () => {
    it('should generate request ID if not provided', async () => {
      const response = await request(app).get('/health');

      expect(response.headers).toHaveProperty('x-request-id');
      expect(response.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should use provided request ID', async () => {
      const customId = 'custom-request-id-123';
      const response = await request(app)
        .get('/health')
        .set('X-Request-Id', customId);

      expect(response.headers['x-request-id']).toBe(customId);
    });
  });

  describe('Authentication', () => {
    it('should return 401 for protected routes without token', async () => {
      const response = await request(app).get('/api/employees');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should allow public routes without auth', async () => {
      const response = await request(app).get('/api/sso/login');

      // Will get 404 since route doesn't exist, but not 401
      expect(response.status).not.toBe(401);
    });
  });

  describe('CORS', () => {
    it('should handle OPTIONS preflight requests', async () => {
      const response = await request(app)
        .options('/health')
        .set('Origin', 'http://example.com')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});

describe('Route Configuration', () => {
  it('should have correct number of routes defined', async () => {
    const { routes } = await import('../src/routes');

    expect(routes.length).toBe(20);
  });

  it('should have all required paths', async () => {
    const { routes } = await import('../src/routes');

    const paths = routes.map((r) => r.path);

    expect(paths).toContain('/api/employees');
    expect(paths).toContain('/api/payroll');
    expect(paths).toContain('/api/performance');
    expect(paths).toContain('/api/crm');
    expect(paths).toContain('/api/projects');
  });

  it('should have rate limits configured', async () => {
    const { routes } = await import('../src/routes');

    const routesWithRateLimit = routes.filter((r) => r.rateLimit);

    expect(routesWithRateLimit.length).toBeGreaterThan(0);
  });

  it('should have timeout configured', async () => {
    const { routes } = await import('../src/routes');

    routes.forEach((route) => {
      expect(route.timeout).toBeGreaterThan(0);
      expect(route.retries).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Auth Middleware', () => {
  it('should validate JWT token format', async () => {
    // Test with malformed token
    const response = await request(app)
      .get('/api/employees')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });
});

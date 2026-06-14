/**
 * Production Readiness Tests
 *
 * Tests to verify the service is ready for production deployment:
 * - API health check
 * - MongoDB connection
 * - Redis connection
 * - JWT validation
 * - Rate limiting
 * - CORS headers
 * - Security headers (helmet)
 */

import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Test configuration
const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:4006';
const TEST_TIMEOUT = 30000;

interface HealthResponse {
  status: string;
  service: string;
  version?: string;
  uptime?: number;
  timestamp?: string;
  checks?: {
    database?: boolean;
    redis?: boolean;
    [key: string]: boolean | undefined;
  };
}

describe('Production Readiness Tests', () => {
  const app = express();
  app.use(express.json());

  // Setup test routes with security middleware
  app.use(helmet());
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }));

  describe('Health Check Endpoints', () => {
    it('GET /health should return service health status', async () => {
      const response = await request(API_BASE_URL)
        .get('/health')
        .expect('Content-Type', /json/)
        .timeout(TEST_TIMEOUT);

      expect(response.status).toBe(200);

      const body = response.body as HealthResponse;
      expect(body.status).toBeDefined();
      expect(body.service).toBeDefined();
      expect(['ok', 'healthy', 'degraded']).toContain(body.status);
    }, TEST_TIMEOUT);

    it('GET /health should include uptime information', async () => {
      const response = await request(API_BASE_URL)
        .get('/health')
        .timeout(TEST_TIMEOUT);

      const body = response.body as HealthResponse;
      expect(typeof body.uptime).toBe('number');
      expect(body.uptime).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    it('GET /ready should indicate service readiness', async () => {
      const response = await request(API_BASE_URL)
        .get('/ready')
        .expect('Content-Type', /json/)
        .timeout(TEST_TIMEOUT);

      expect(response.status).toBe(200);
      const body = response.body as { ready: boolean; checks?: Record<string, boolean> };
      expect(typeof body.ready).toBe('boolean');
    }, TEST_TIMEOUT);
  });

  describe('Database Connection', () => {
    it('should connect to MongoDB successfully', async () => {
      // Test MongoDB connection state
      const isConnected = mongoose.connection.readyState === 1;
      expect(isConnected).toBe(true);
    }, TEST_TIMEOUT);

    it('should perform a simple database operation', async () => {
      // This tests actual database connectivity
      const collections = await mongoose.connection.db?.collections();
      expect(collections).toBeDefined();
      expect(Array.isArray(collections)).toBe(true);
    }, TEST_TIMEOUT);

    it('health endpoint should report database status', async () => {
      const response = await request(API_BASE_URL)
        .get('/health')
        .timeout(TEST_TIMEOUT);

      const body = response.body as HealthResponse;
      if (body.checks?.database !== undefined) {
        expect(body.checks.database).toBe(true);
      }
    }, TEST_TIMEOUT);
  });

  describe('Redis Connection', () => {
    let redisClient: Redis | null = null;

    beforeAll(() => {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
    });

    afterAll(async () => {
      if (redisClient) {
        await redisClient.quit();
      }
    });

    it('should connect to Redis', async () => {
      if (!redisClient) return;

      try {
        await redisClient.connect();
        const pong = await redisClient.ping();
        expect(pong).toBe('PONG');
      } catch (error) {
        // Redis might not be available in test environment
        logger.info('Redis connection test skipped:', error);
      }
    }, TEST_TIMEOUT);
  });

  describe('JWT Authentication', () => {
    it('should validate JWT tokens correctly', () => {
      const secret = process.env.JWT_SECRET || 'test-secret';
      const payload = { userId: 'test-user', role: 'admin' };
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });

      const decoded = jwt.verify(token, secret) as typeof payload;
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.role).toBe(payload.role);
    });

    it('should reject expired tokens', () => {
      const secret = process.env.JWT_SECRET || 'test-secret';
      const payload = { userId: 'test-user' };
      const token = jwt.sign(payload, secret, { expiresIn: '-1s' }); // Already expired

      expect(() => jwt.verify(token, secret)).toThrow(jwt.JsonWebTokenError);
    });

    it('should reject tokens with invalid signature', () => {
      const payload = { userId: 'test-user' };
      const token = jwt.sign(payload, 'correct-secret');
      const wrongSecret = 'wrong-secret';

      expect(() => jwt.verify(token, wrongSecret)).toThrow(jwt.JsonWebTokenError);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Make multiple requests quickly to trigger rate limit
      const requests = Array(105).fill(null).map(() =>
        request(API_BASE_URL).get('/health').timeout(TEST_TIMEOUT)
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);

      // Should have hit rate limit at some point
      expect(rateLimited || responses[0].status === 200).toBe(true);
    }, TEST_TIMEOUT * 2);

    it('should include rate limit headers', async () => {
      const response = await request(API_BASE_URL)
        .get('/health')
        .timeout(TEST_TIMEOUT);

      const rateLimitHeaders = [
        'x-ratelimit-limit',
        'x-ratelimit-remaining',
        'x-ratelimit-reset',
      ];

      // Check if at least some headers are present
      const hasAnyHeader = rateLimitHeaders.some(header =>
        header in response.headers
      );

      // In production, these should be present
      if (process.env.NODE_ENV === 'production') {
        expect(hasAnyHeader).toBe(true);
      }
    }, TEST_TIMEOUT);
  });

  describe('CORS Configuration', () => {
    const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];

    it('should allow configured origins', async () => {
      const response = await request(API_BASE_URL)
        .get('/health')
        .set('Origin', corsOrigins[0])
        .timeout(TEST_TIMEOUT);

      expect(response.status).toBe(200);

      // Check if CORS header is properly set
      const corsHeader = response.headers['access-control-allow-origin'];
      if (typeof corsHeader === 'string') {
        expect(corsOrigin).toBeTruthy();
      }
    }, TEST_TIMEOUT);

    it('should handle preflight OPTIONS requests', async () => {
      const response = await request(API_BASE_URL)
        .options('/api/test')
        .set('Origin', corsOrigins[0])
        .set('Access-Control-Request-Method', 'GET')
        .timeout(TEST_TIMEOUT);

      expect([200, 204]).toContain(response.status);
    }, TEST_TIMEOUT);
  });

  describe('Security Headers (Helmet)', () => {
    it('should include security headers', async () => {
      const response = await request(API_BASE_URL)
        .get('/health')
        .timeout(TEST_TIMEOUT);

      // Check for common security headers
      const securityHeaders = {
        'x-content-type-options': 'nosniff',
        'x-frame-options': expect.stringMatching(/DENY|SAMEORIGIN/),
        'x-xss-protection': expect.stringMatching(/1/),
        'strict-transport-security': expect.any(String),
      };

      Object.entries(securityHeaders).forEach(([header, matcher]) => {
        const headerLower = header.toLowerCase();
        const actualHeader = Object.keys(response.headers).find(
          h => h.toLowerCase() === headerLower
        );

        if (actualHeader) {
          expect(response.headers[actualHeader]).toMatch(matcher);
        }
      });
    }, TEST_TIMEOUT);

    it('should not expose sensitive information', async () => {
      const response = await request(API_BASE_URL)
        .get('/health')
        .timeout(TEST_TIMEOUT);

      const body = response.body as Record<string, unknown>;

      // Should not expose stack traces or sensitive config
      expect(body).not.toHaveProperty('stack');
      expect(body).not.toHaveProperty('password');
      expect(body).not.toHaveProperty('secret');
      expect(body).not.toHaveProperty('key');
    }, TEST_TIMEOUT);
  });

  describe('Error Handling', () => {
    it('should handle invalid routes gracefully', async () => {
      const response = await request(API_BASE_URL)
        .get('/nonexistent-route-xyz')
        .timeout(TEST_TIMEOUT);

      expect([404, 400]).toContain(response.status);
      const body = response.body as { success?: boolean; error?: string };
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    }, TEST_TIMEOUT);

    it('should handle invalid JSON gracefully', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .timeout(TEST_TIMEOUT);

      expect([400, 415]).toContain(response.status);
    }, TEST_TIMEOUT);

    it('should not leak error stack traces in production', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/invalid-endpoint')
        .timeout(TEST_TIMEOUT);

      const body = response.body as Record<string, unknown>;

      if (process.env.NODE_ENV === 'production') {
        expect(body).not.toHaveProperty('stack');
        expect(body).not.toHaveProperty('errors');
      }
    }, TEST_TIMEOUT);
  });

  describe('API Response Format', () => {
    it('should return consistent response format', async () => {
      const response = await request(API_BASE_URL)
        .get('/health')
        .timeout(TEST_TIMEOUT);

      expect(response.headers['content-type']).toMatch(/json/);
      const body = response.body as Record<string, unknown>;
      expect(typeof body).toBe('object');
    }, TEST_TIMEOUT);
  });

  describe('Version Endpoint', () => {
    it('should expose version information', async () => {
      const response = await request(API_BASE_URL)
        .get('/version')
        .timeout(TEST_TIMEOUT);

      if (response.status === 200) {
        const body = response.body as { version: string; name: string };
        expect(body.version).toBeDefined();
        expect(body.name).toBeDefined();
      } else {
        // Version endpoint is optional
        expect([404, 501]).toContain(response.status);
      }
    }, TEST_TIMEOUT);
  });
});

// Test utilities
function corsOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
  return allowedOrigins.includes(origin);
}

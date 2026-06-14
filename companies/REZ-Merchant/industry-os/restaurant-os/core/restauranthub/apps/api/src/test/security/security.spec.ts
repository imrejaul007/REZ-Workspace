import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { SecurityMiddleware } from '../../common/middleware/security.middleware';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { BruteForceGuard } from '../../common/guards/brute-force.guard';
import { SecurityUtils } from '../../common/decorators/validators';

describe('Security Integration Tests', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      // Add your module imports here
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Security Headers', () => {
    it('should set security headers on all responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should remove server information headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.headers['x-powered-by']).toBeUndefined();
      expect(response.headers['server']).toBeUndefined();
    });
  });

  describe('Input Validation', () => {
    it('should sanitize XSS attempts', () => {
      const maliciousInput = '<script>alert("xss")</script>test';
      const sanitized = SecurityUtils.sanitizeString(maliciousInput);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toBe('test');
    });

    it('should detect SQL injection patterns', () => {
      const sqlInjection = "' OR 1=1 --";
      const sanitized = SecurityUtils.sanitizeString(sqlInjection);

      expect(sanitized).not.toContain('OR 1=1');
      expect(sanitized).not.toContain('--');
    });

    it('should validate strong passwords', () => {
      const weakPassword = 'password';
      const strongPassword = 'StrongP@ssw0rd!';

      const weakResult = SecurityUtils.validatePassword(weakPassword);
      const strongResult = SecurityUtils.validatePassword(strongPassword);

      expect(weakResult.isValid).toBe(false);
      expect(weakResult.errors.length).toBeGreaterThan(0);
      expect(strongResult.isValid).toBe(true);
      expect(strongResult.errors.length).toBe(0);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to authentication endpoints', async () => {
      const loginData = { email: 'test@example.com', password: 'wrongpassword' };

      // Make multiple requests to exceed rate limit
      const requests = Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginData)
      );

      const responses = await Promise.all(requests);

      // At least some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should have stricter limits for sensitive endpoints', async () => {
      const resetData = { email: 'test@example.com' };

      // Make multiple requests to password reset
      const requests = Array.from({ length: 5 }, () =>
        request(app.getHttpServer())
          .post('/api/v1/auth/forgot-password')
          .send(resetData)
      );

      const responses = await Promise.all(requests);

      // Should be rate limited faster than regular endpoints
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('CORS Configuration', () => {
    it('should block requests from unauthorized origins in production', async () => {
      // Simulate production environment
      process.env.NODE_ENV = 'production';

      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('Origin', 'https://malicious-site.com')
        .expect(403); // Should be blocked by CORS

      expect(response.body.message).toContain('Not allowed by CORS');
    });

    it('should allow requests from authorized origins', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should not expose sensitive information in error responses', async () => {
      // Trigger a database error
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'invalid' })
        .expect(400);

      expect(response.body.error.message).not.toContain('database');
      expect(response.body.error.message).not.toContain('prisma');
      expect(response.body.error.message).not.toContain('password');
    });

    it('should return generic error messages in production', async () => {
      process.env.NODE_ENV = 'production';

      const response = await request(app.getHttpServer())
        .get('/api/v1/nonexistent')
        .expect(404);

      expect(response.body.error.message).toBe('Not Found');
      expect(response.body.error).not.toHaveProperty('stack');
    });
  });

  describe('Authentication Security', () => {
    it('should reject malformed JWT tokens', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/protected-route')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.error.message).toContain('Invalid token');
    });

    it('should reject expired JWT tokens', async () => {
      // Create an expired token for testing
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

      const response = await request(app.getHttpServer())
        .get('/api/v1/protected-route')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error.message).toContain('expired');
    });
  });

  describe('API Key Authentication', () => {
    it('should require API key for protected endpoints', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/stats')
        .expect(401);

      expect(response.body.error.message).toContain('API key is required');
    });

    it('should reject invalid API keys', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/stats')
        .set('X-API-Key', 'invalid-key')
        .expect(401);

      expect(response.body.error.message).toContain('Invalid API key');
    });
  });

  describe('Content Security Policy', () => {
    it('should set CSP headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/docs')
        .expect(200);

      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });
  });

  describe('Request Size Limits', () => {
    it('should reject requests that exceed size limits', async () => {
      const largePayload = 'x'.repeat(11 * 1024 * 1024); // 11MB

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ data: largePayload })
        .expect(413); // Request Entity Too Large

      expect(response.body.error.code).toContain('REQUEST_TOO_LARGE');
    });
  });
});

describe('Security Utils Unit Tests', () => {
  describe('Password Validation', () => {
    it('should validate password strength correctly', () => {
      const testCases = [
        { password: 'weak', expected: false },
        { password: 'WeakPassword', expected: false },
        { password: 'WeakPassword123', expected: false },
        { password: 'StrongP@ssw0rd!', expected: true },
        { password: 'Anoth3r$trongP@ss', expected: true },
      ];

      testCases.forEach(({ password, expected }) => {
        const result = SecurityUtils.validatePassword(password);
        expect(result.isValid).toBe(expected);
      });
    });
  });

  describe('String Sanitization', () => {
    it('should sanitize various XSS payloads', () => {
      const testCases = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert("xss")>',
        'javascript:alert("xss")',
        '<iframe src="javascript:alert(\'xss\')"></iframe>',
        'onload=alert("xss")',
      ];

      testCases.forEach(payload => {
        const sanitized = SecurityUtils.sanitizeString(payload);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror=');
        expect(sanitized).not.toContain('onload=');
      });
    });
  });
});
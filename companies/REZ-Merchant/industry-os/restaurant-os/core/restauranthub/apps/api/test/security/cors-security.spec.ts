import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('CORS Security Tests', () => {
  let app: INestApplication;
  let httpServer: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('CORS Configuration', () => {
    it('should handle valid origin requests', async () => {
      const validOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://restopapa.com',
        'https://app.restopapa.com',
      ];

      for (const origin of validOrigins) {
        const response = await request(httpServer)
          .options('/auth/login')
          .set('Origin', origin)
          .set('Access-Control-Request-Method', 'POST')
          .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

        expect([200, 204]).toContain(response.status);
        expect(response.headers['access-control-allow-origin']).toBeDefined();
      }
    });

    it('should reject requests from unauthorized origins', async () => {
      const maliciousOrigins = [
        'https://evil.com',
        'http://malicious-site.com',
        'https://phishing-restaurant.com',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
      ];

      for (const origin of maliciousOrigins) {
        const response = await request(httpServer)
          .post('/auth/login')
          .set('Origin', origin)
          .send({
            email: 'test@example.com',
            password: 'password123',
          });

        // Should either reject with CORS error or not include CORS headers
        if (response.headers['access-control-allow-origin']) {
          expect(response.headers['access-control-allow-origin']).not.toBe(origin);
        }
      }
    });

    it('should include proper CORS headers in response', async () => {
      const response = await request(httpServer)
        .post('/auth/login')
        .set('Origin', 'http://localhost:3001')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });

    it('should not allow credentials from untrusted origins', async () => {
      const response = await request(httpServer)
        .post('/auth/login')
        .set('Origin', 'https://untrusted.com')
        .set('Cookie', 'sessionId=malicious')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      // Should not include credentials in CORS response
      expect(response.headers['access-control-allow-credentials']).not.toBe('true');
    });
  });

  describe('Preflight Request Handling', () => {
    it('should handle complex preflight requests', async () => {
      const response = await request(httpServer)
        .options('/users/profile')
        .set('Origin', 'http://localhost:3001')
        .set('Access-Control-Request-Method', 'PUT')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization, X-Custom-Header');

      expect([200, 204]).toContain(response.status);
      expect(response.headers['access-control-allow-methods']).toMatch(/PUT/);
      expect(response.headers['access-control-max-age']).toBeDefined();
    });

    it('should reject preflight with disallowed methods', async () => {
      const response = await request(httpServer)
        .options('/users/profile')
        .set('Origin', 'http://localhost:3001')
        .set('Access-Control-Request-Method', 'TRACE')
        .set('Access-Control-Request-Headers', 'Content-Type');

      // TRACE method should be rejected
      if (response.status === 200 || response.status === 204) {
        expect(response.headers['access-control-allow-methods']).not.toMatch(/TRACE/);
      }
    });

    it('should handle preflight caching correctly', async () => {
      const firstResponse = await request(httpServer)
        .options('/auth/refresh')
        .set('Origin', 'http://localhost:3001')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type');

      expect(firstResponse.headers['access-control-max-age']).toBeDefined();

      const maxAge = parseInt(firstResponse.headers['access-control-max-age']);
      expect(maxAge).toBeGreaterThan(0);
      expect(maxAge).toBeLessThanOrEqual(86400); // Should not exceed 24 hours
    });
  });

  describe('CORS Security Headers', () => {
    it('should include security headers with CORS responses', async () => {
      const response = await request(httpServer)
        .get('/health')
        .set('Origin', 'http://localhost:3001');

      // Security headers should be present
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    it('should not expose sensitive headers', async () => {
      const response = await request(httpServer)
        .get('/users/profile')
        .set('Origin', 'http://localhost:3001')
        .set('Authorization', 'Bearer invalid-token');

      // Sensitive headers should not be exposed
      expect(response.headers['access-control-expose-headers']).not.toMatch(/x-powered-by/i);
      expect(response.headers['access-control-expose-headers']).not.toMatch(/server/i);
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('JSONP Attack Prevention', () => {
    it('should prevent JSONP hijacking attempts', async () => {
      const jsonpAttempts = [
        '?callback=maliciousFunction',
        '?jsonp=evilCallback',
        '?cb=stealData',
        '&callback=<script>alert(1)</script>',
      ];

      for (const query of jsonpAttempts) {
        const response = await request(httpServer)
          .get(`/users/profile${query}`)
          .set('Origin', 'http://localhost:3001')
          .set('Authorization', 'Bearer valid-token');

        // Response should not be wrapped in callback function
        expect(response.text).not.toMatch(/^[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/);
        expect(response.headers['content-type']).toMatch(/application\/json/);
      }
    });

    it('should reject suspicious callback parameters', async () => {
      const response = await request(httpServer)
        .get('/auth/profile?callback=alert(document.cookie)')
        .set('Origin', 'http://localhost:3001');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Subdomain and Port Variations', () => {
    it('should handle subdomain CORS correctly', async () => {
      const subdomains = [
        'https://api.restopapa.com',
        'https://admin.restopapa.com',
        'https://dashboard.restopapa.com',
      ];

      for (const subdomain of subdomains) {
        const response = await request(httpServer)
          .options('/auth/login')
          .set('Origin', subdomain)
          .set('Access-Control-Request-Method', 'POST');

        // Check if subdomain is properly handled
        expect([200, 204]).toContain(response.status);
      }
    });

    it('should reject wildcard subdomain attacks', async () => {
      const wildcardAttempts = [
        'https://evil.restopapa.com.attacker.com',
        'https://restopapa.com.evil.com',
        'https://restopapacom.evil.com',
        'https://xrestopapa.com',
      ];

      for (const attempt of wildcardAttempts) {
        const response = await request(httpServer)
          .post('/auth/login')
          .set('Origin', attempt)
          .send({
            email: 'test@example.com',
            password: 'password123',
          });

        // Should not allow these origins
        if (response.headers['access-control-allow-origin']) {
          expect(response.headers['access-control-allow-origin']).not.toBe(attempt);
        }
      }
    });
  });

  describe('Content-Type Validation', () => {
    it('should validate Content-Type in CORS requests', async () => {
      const response = await request(httpServer)
        .post('/auth/login')
        .set('Origin', 'http://localhost:3001')
        .set('Content-Type', 'text/plain')
        .send('email=test@example.com&password=password123');

      // Should reject non-JSON content for API endpoints
      expect(response.status).toBe(415);
    });

    it('should allow valid Content-Types', async () => {
      const validContentTypes = [
        'application/json',
        'application/json; charset=utf-8',
        'application/x-www-form-urlencoded',
      ];

      for (const contentType of validContentTypes) {
        const response = await request(httpServer)
          .options('/auth/login')
          .set('Origin', 'http://localhost:3001')
          .set('Access-Control-Request-Method', 'POST')
          .set('Access-Control-Request-Headers', `Content-Type`)
          .set('Content-Type', contentType);

        expect([200, 204]).toContain(response.status);
      }
    });
  });

  describe('CORS Error Handling', () => {
    it('should provide clear error messages for CORS failures', async () => {
      const response = await request(httpServer)
        .post('/auth/login')
        .set('Origin', 'https://malicious.com')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      // Should not expose detailed CORS configuration in errors
      expect(JSON.stringify(response.body)).not.toMatch(/cors.*config/i);
      expect(JSON.stringify(response.body)).not.toMatch(/allowed.*origins/i);
    });

    it('should handle null origin correctly', async () => {
      const response = await request(httpServer)
        .post('/auth/login')
        .set('Origin', 'null')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      // Null origin should be handled securely
      expect(response.headers['access-control-allow-origin']).not.toBe('null');
    });
  });
});
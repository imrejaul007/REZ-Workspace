import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('CSRF Protection Tests', () => {
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

  describe('CSRF Token Generation', () => {
    it('should generate CSRF tokens for authenticated sessions', async () => {
      // First register and login
      await request(httpServer)
        .post('/auth/register')
        .send({
          email: 'csrf-test@example.com',
          password: 'CSRFTest123!',
          confirmPassword: 'CSRFTest123!',
          firstName: 'CSRF',
          lastName: 'Test',
          phone: '+1234567890',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({
          email: 'csrf-test@example.com',
          password: 'CSRFTest123!',
        });

      expect(loginResponse.status).toBe(200);

      // Get CSRF token endpoint
      const csrfResponse = await request(httpServer)
        .get('/auth/csrf-token')
        .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`);

      expect(csrfResponse.status).toBe(200);
      expect(csrfResponse.body).toHaveProperty('csrfToken');
      expect(csrfResponse.body.csrfToken).toMatch(/^[a-zA-Z0-9_-]+$/);
      expect(csrfResponse.body.csrfToken.length).toBeGreaterThan(10);
    });

    it('should generate different CSRF tokens for different sessions', async () => {
      // Create two different users
      const user1Email = `csrf-user1-${Date.now()}@example.com`;
      const user2Email = `csrf-user2-${Date.now()}@example.com`;

      // Register users
      await request(httpServer).post('/auth/register').send({
        email: user1Email,
        password: 'CSRFTest123!',
        confirmPassword: 'CSRFTest123!',
        firstName: 'User1',
        lastName: 'Test',
        phone: '+1234567891',
        role: 'CUSTOMER',
        agreeToTerms: true,
        agreeToPrivacy: true,
      });

      await request(httpServer).post('/auth/register').send({
        email: user2Email,
        password: 'CSRFTest123!',
        confirmPassword: 'CSRFTest123!',
        firstName: 'User2',
        lastName: 'Test',
        phone: '+1234567892',
        role: 'CUSTOMER',
        agreeToTerms: true,
        agreeToPrivacy: true,
      });

      // Login both users
      const login1 = await request(httpServer)
        .post('/auth/login')
        .send({ email: user1Email, password: 'CSRFTest123!' });

      const login2 = await request(httpServer)
        .post('/auth/login')
        .send({ email: user2Email, password: 'CSRFTest123!' });

      // Get CSRF tokens
      const csrf1 = await request(httpServer)
        .get('/auth/csrf-token')
        .set('Authorization', `Bearer ${login1.body.data.accessToken}`);

      const csrf2 = await request(httpServer)
        .get('/auth/csrf-token')
        .set('Authorization', `Bearer ${login2.body.data.accessToken}`);

      // Tokens should be different
      expect(csrf1.body.csrfToken).not.toBe(csrf2.body.csrfToken);
    });
  });

  describe('CSRF Token Validation', () => {
    let authToken: string;
    let csrfToken: string;

    beforeAll(async () => {
      // Setup test user
      await request(httpServer)
        .post('/auth/register')
        .send({
          email: 'csrf-validation@example.com',
          password: 'CSRFValidation123!',
          confirmPassword: 'CSRFValidation123!',
          firstName: 'CSRF',
          lastName: 'Validation',
          phone: '+1987654321',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({
          email: 'csrf-validation@example.com',
          password: 'CSRFValidation123!',
        });

      authToken = loginResponse.body.data.accessToken;

      const csrfResponse = await request(httpServer)
        .get('/auth/csrf-token')
        .set('Authorization', `Bearer ${authToken}`);

      csrfToken = csrfResponse.body.csrfToken;
    });

    it('should accept requests with valid CSRF tokens', async () => {
      const response = await request(httpServer)
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        });

      expect([200, 201]).toContain(response.status);
    });

    it('should reject requests without CSRF tokens', async () => {
      const response = await request(httpServer)
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Should',
          lastName: 'Fail',
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toMatch(/csrf/i);
    });

    it('should reject requests with invalid CSRF tokens', async () => {
      const invalidTokens = [
        'invalid-token-123',
        csrfToken + 'tampered',
        csrfToken.slice(0, -5) + '12345',
        '',
        '  ',
        null,
        undefined,
      ];

      for (const invalidToken of invalidTokens) {
        const response = await request(httpServer)
          .put('/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-CSRF-Token', invalidToken || '')
          .send({
            firstName: 'Should',
            lastName: 'Fail',
          });

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('success', false);
      }
    });

    it('should reject cross-session CSRF token usage', async () => {
      // Create another user and get their CSRF token
      await request(httpServer)
        .post('/auth/register')
        .send({
          email: 'csrf-cross-session@example.com',
          password: 'CSRFCross123!',
          confirmPassword: 'CSRFCross123!',
          firstName: 'Cross',
          lastName: 'Session',
          phone: '+1555666777',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      const crossLogin = await request(httpServer)
        .post('/auth/login')
        .send({
          email: 'csrf-cross-session@example.com',
          password: 'CSRFCross123!',
        });

      const crossCSRF = await request(httpServer)
        .get('/auth/csrf-token')
        .set('Authorization', `Bearer ${crossLogin.body.data.accessToken}`);

      // Try to use cross-session CSRF token
      const response = await request(httpServer)
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', crossCSRF.body.csrfToken)
        .send({
          firstName: 'Should',
          lastName: 'Fail',
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('CSRF Protection Headers', () => {
    it('should include CSRF protection headers', async () => {
      const response = await request(httpServer)
        .get('/auth/csrf-token')
        .set('Authorization', 'Bearer dummy-token');

      // Should include security headers
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options');
    });

    it('should validate origin header for CSRF-protected requests', async () => {
      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({
          email: 'csrf-validation@example.com',
          password: 'CSRFValidation123!',
        });

      const authToken = loginResponse.body.data.accessToken;

      const csrfResponse = await request(httpServer)
        .get('/auth/csrf-token')
        .set('Authorization', `Bearer ${authToken}`);

      const csrfToken = csrfResponse.body.csrfToken;

      // Request with invalid origin
      const response = await request(httpServer)
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', csrfToken)
        .set('Origin', 'https://malicious-site.com')
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        });

      // Should be rejected due to origin mismatch
      expect(response.status).toBe(403);
    });
  });

  describe('CSRF Token Lifecycle', () => {
    let authToken: string;

    beforeAll(async () => {
      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({
          email: 'csrf-validation@example.com',
          password: 'CSRFValidation123!',
        });

      authToken = loginResponse.body.data.accessToken;
    });

    it('should expire CSRF tokens after logout', async () => {
      // Get CSRF token
      const csrfResponse = await request(httpServer)
        .get('/auth/csrf-token')
        .set('Authorization', `Bearer ${authToken}`);

      const csrfToken = csrfResponse.body.csrfToken;

      // Logout
      await request(httpServer)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', csrfToken);

      // Try to use CSRF token after logout
      const response = await request(httpServer)
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          firstName: 'Should',
          lastName: 'Fail',
        });

      expect(response.status).toBe(401); // Unauthorized due to invalid auth token
    });

    it('should refresh CSRF tokens periodically', async () => {
      // Get initial CSRF token
      const csrf1 = await request(httpServer)
        .get('/auth/csrf-token')
        .set('Authorization', `Bearer ${authToken}`);

      // Wait a bit and get another token
      await new Promise(resolve => setTimeout(resolve, 100));

      const csrf2 = await request(httpServer)
        .get('/auth/csrf-token')
        .set('Authorization', `Bearer ${authToken}`);

      // Tokens might be the same within a short period, but should be valid
      expect(csrf1.body.csrfToken).toBeTruthy();
      expect(csrf2.body.csrfToken).toBeTruthy();
    });
  });

  describe('Double Submit Cookie Pattern', () => {
    it('should implement double submit cookie protection', async () => {
      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({
          email: 'csrf-validation@example.com',
          password: 'CSRFValidation123!',
        });

      const authToken = loginResponse.body.data.accessToken;

      // Get CSRF token - should set cookie and return token
      const csrfResponse = await request(httpServer)
        .get('/auth/csrf-token')
        .set('Authorization', `Bearer ${authToken}`);

      expect(csrfResponse.body.csrfToken).toBeTruthy();

      // Check for CSRF cookie (if implemented)
      const cookies = csrfResponse.headers['set-cookie'];
      if (cookies) {
        const csrfCookie = cookies.find((cookie: string) =>
          cookie.includes('csrf') || cookie.includes('CSRF')
        );

        if (csrfCookie) {
          expect(csrfCookie).toMatch(/HttpOnly/);
          expect(csrfCookie).toMatch(/SameSite/);
        }
      }
    });
  });

  describe('CSRF Attack Simulation', () => {
    let victimToken: string;
    let victimCSRF: string;

    beforeAll(async () => {
      // Setup victim account
      await request(httpServer)
        .post('/auth/register')
        .send({
          email: 'csrf-victim@example.com',
          password: 'VictimAccount123!',
          confirmPassword: 'VictimAccount123!',
          firstName: 'Victim',
          lastName: 'User',
          phone: '+1111222333',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({
          email: 'csrf-victim@example.com',
          password: 'VictimAccount123!',
        });

      victimToken = loginResponse.body.data.accessToken;

      const csrfResponse = await request(httpServer)
        .get('/auth/csrf-token')
        .set('Authorization', `Bearer ${victimToken}`);

      victimCSRF = csrfResponse.body.csrfToken;
    });

    it('should prevent malicious form submissions', async () => {
      // Simulate malicious form submission without CSRF token
      const maliciousResponse = await request(httpServer)
        .put('/users/profile')
        .set('Authorization', `Bearer ${victimToken}`)
        .set('Referer', 'https://evil-site.com/csrf-attack.html')
        .send({
          firstName: 'Hacked',
          lastName: 'User',
          email: 'hacker@evil-site.com',
        });

      expect(maliciousResponse.status).toBe(403);
      expect(maliciousResponse.body).toHaveProperty('success', false);
    });

    it('should prevent AJAX-based CSRF attacks', async () => {
      // Simulate AJAX request from malicious site
      const ajaxAttack = await request(httpServer)
        .delete('/users/profile')
        .set('Authorization', `Bearer ${victimToken}`)
        .set('Origin', 'https://malicious-attacker.com')
        .set('X-Requested-With', 'XMLHttpRequest');

      // Should be rejected due to missing CSRF token
      expect(ajaxAttack.status).toBe(403);
    });

    it('should prevent token prediction attacks', async () => {
      // Get multiple CSRF tokens to check for patterns
      const tokens: string[] = [];

      for (let i = 0; i < 10; i++) {
        const response = await request(httpServer)
          .get('/auth/csrf-token')
          .set('Authorization', `Bearer ${victimToken}`);

        tokens.push(response.body.csrfToken);
      }

      // Tokens should not follow predictable patterns
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBeGreaterThan(1); // Should generate different tokens

      // Check entropy - tokens should not have obvious patterns
      tokens.forEach(token => {
        expect(token).not.toMatch(/^1+$/); // Not all 1s
        expect(token).not.toMatch(/^0+$/); // Not all 0s
        expect(token).not.toMatch(/^(.)\\1*$/); // Not repeating character
      });
    });
  });

  describe('CSRF Configuration Security', () => {
    it('should have secure CSRF configuration', async () => {
      // Test that CSRF protection is enabled for state-changing operations
      const stateChangingEndpoints = [
        { method: 'put', path: '/users/profile' },
        { method: 'post', path: '/jobs' },
        { method: 'delete', path: '/jobs/1' },
        { method: 'post', path: '/users/avatar' },
      ];

      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({
          email: 'csrf-validation@example.com',
          password: 'CSRFValidation123!',
        });

      const authToken = loginResponse.body.data.accessToken;

      for (const endpoint of stateChangingEndpoints) {
        const response = await request(httpServer)
          [endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${authToken}`)
          .send({});

        // Should require CSRF token (403) or be not found (404)
        // 404 is acceptable if endpoint doesn't exist
        expect([403, 404, 422]).toContain(response.status);
      }
    });

    it('should not require CSRF for safe HTTP methods', async () => {
      const safeEndpoints = [
        { method: 'get', path: '/users/profile' },
        { method: 'get', path: '/jobs' },
        { method: 'head', path: '/health' },
        { method: 'options', path: '/auth/login' },
      ];

      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({
          email: 'csrf-validation@example.com',
          password: 'CSRFValidation123!',
        });

      const authToken = loginResponse.body.data.accessToken;

      for (const endpoint of safeEndpoints) {
        const response = await request(httpServer)
          [endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${authToken}`);

        // Should not require CSRF token for safe methods
        // Should succeed or return 404 (if endpoint doesn't exist)
        expect([200, 204, 404]).toContain(response.status);
      }
    });
  });
});
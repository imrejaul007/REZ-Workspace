const { Test } = require('@nestjs/testing');
const request = require('supertest');
const { AppModule } = require('../../src/app.module');

describe('Auth Security Tests', () => {
  let app;
  let httpServer;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('SQL Injection Protection', () => {
    it('should prevent SQL injection in login email field', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "admin'--",
        "' OR 1=1 --",
      ];

      for (const payload of sqlInjectionPayloads) {
        const response = await request(httpServer)
          .post('/auth/login')
          .send({
            email: payload,
            password: 'anypassword',
          });

        // Should not cause server error, should return 400 or 401
        expect([400, 401]).toContain(response.status);
        expect(response.body).toHaveProperty('success', false);
      }
    });

    it('should prevent SQL injection in registration fields', async () => {
      const response = await request(httpServer)
        .post('/auth/register')
        .send({
          email: "'; DROP TABLE users; --",
          password: 'Password123!',
          confirmPassword: 'Password123!',
          firstName: "'; DELETE FROM profiles; --",
          lastName: "' OR '1'='1",
          phone: '+1234567890',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      expect([400, 401]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('XSS Protection', () => {
    it('should sanitize XSS attempts in registration', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        '"><script>alert(1)</script>',
      ];

      for (const payload of xssPayloads) {
        const response = await request(httpServer)
          .post('/auth/register')
          .send({
            email: `xss-test-${Date.now()}@example.com`,
            password: 'Password123!',
            confirmPassword: 'Password123!',
            firstName: payload,
            lastName: 'Test',
            phone: '+1234567890',
            role: 'CUSTOMER',
            agreeToTerms: true,
            agreeToPrivacy: true,
          });

        // Should either reject the input or sanitize it
        if (response.status === 201) {
          // If accepted, the data should be sanitized
          expect(response.body.data.user.firstName).not.toContain('<script>');
          expect(response.body.data.user.firstName).not.toContain('javascript:');
          expect(response.body.data.user.firstName).not.toContain('onerror');
        } else {
          // Should be rejected with 400
          expect(response.status).toBe(400);
        }
      }
    });
  });

  describe('Brute Force Protection', () => {
    const bruteForceEmail = 'brute-force-test@example.com';

    beforeAll(async () => {
      // Create test user for brute force testing
      await request(httpServer)
        .post('/auth/register')
        .send({
          email: bruteForceEmail,
          password: 'BruteForceTest123!',
          confirmPassword: 'BruteForceTest123!',
          firstName: 'Brute',
          lastName: 'Force',
          phone: '+1111222333',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });
    });

    it('should implement rate limiting after multiple failed attempts', async () => {
      const failedAttempts = [];

      // Make multiple failed login attempts
      for (let i = 0; i < 15; i++) {
        failedAttempts.push(
          request(httpServer)
            .post('/auth/login')
            .send({
              email: bruteForceEmail,
              password: 'WrongPassword123!',
            })
        );
      }

      const responses = await Promise.all(failedAttempts);
      const statusCodes = responses.map(r => r.status);

      // Should start getting 429 (Too Many Requests) after several attempts
      const rateLimitedResponses = statusCodes.filter(s => s === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      // Check rate limit headers in the last response
      const lastResponse = responses[responses.length - 1];
      if (lastResponse.status === 429) {
        expect(lastResponse.headers).toHaveProperty('x-ratelimit-limit');
        expect(lastResponse.headers).toHaveProperty('x-ratelimit-remaining');
        expect(lastResponse.headers).toHaveProperty('x-ratelimit-reset');
      }
    });

    it('should allow successful login after rate limit period', async () => {
      // Wait for rate limit to reset (adjust timing as needed)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await request(httpServer)
        .post('/auth/login')
        .send({
          email: bruteForceEmail,
          password: 'BruteForceTest123!',
        });

      // Should either succeed or be rate limited, but not permanent ban
      expect([200, 429]).toContain(response.status);
    });
  });

  describe('JWT Security', () => {
    let testTokens;

    beforeAll(async () => {
      // Create user and get tokens for JWT tests
      await request(httpServer)
        .post('/auth/register')
        .send({
          email: 'jwt-security-test@example.com',
          password: 'JWTSecurityTest123!',
          confirmPassword: 'JWTSecurityTest123!',
          firstName: 'JWT',
          lastName: 'Security',
          phone: '+1999888777',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({
          email: 'jwt-security-test@example.com',
          password: 'JWTSecurityTest123!',
        });

      testTokens = loginResponse.body.data;
    });

    it('should reject tampered JWT tokens', async () => {
      const tamperedToken = testTokens.accessToken.slice(0, -10) + 'tampered123';

      const response = await request(httpServer)
        .get('/users/profile')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject expired JWT tokens', async () => {
      // Create an obviously expired token (this would need to be implemented based on your JWT service)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.expired';

      const response = await request(httpServer)
        .get('/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject JWT with wrong algorithm', async () => {
      // Token signed with different algorithm
      const wrongAlgToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.';

      const response = await request(httpServer)
        .get('/users/profile')
        .set('Authorization', `Bearer ${wrongAlgToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Input Validation Security', () => {
    it('should reject oversized input fields', async () => {
      const oversizedString = 'a'.repeat(10000);

      const response = await request(httpServer)
        .post('/auth/register')
        .send({
          email: `oversized-${Date.now()}@example.com`,
          password: 'Password123!',
          confirmPassword: 'Password123!',
          firstName: oversizedString,
          lastName: 'Test',
          phone: '+1234567890',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject null byte injection', async () => {
      const nullBytePayload = 'test\\x00malicious';

      const response = await request(httpServer)
        .post('/auth/register')
        .send({
          email: `nullbyte-${Date.now()}@example.com`,
          password: 'Password123!',
          confirmPassword: 'Password123!',
          firstName: nullBytePayload,
          lastName: 'Test',
          phone: '+1234567890',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      expect([400, 201]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body.data.user.firstName).not.toContain('\\x00');
      }
    });

    it('should validate email format strictly', async () => {
      const invalidEmails = [
        'notanemail',
        '@domain.com',
        'user@',
        'user..double.dot@domain.com',
        'user@domain',
        'user@.com',
        '',
        ' ',
        'user name@domain.com',
      ];

      for (const email of invalidEmails) {
        const response = await request(httpServer)
          .post('/auth/register')
          .send({
            email,
            password: 'Password123!',
            confirmPassword: 'Password123!',
            firstName: 'Test',
            lastName: 'User',
            phone: '+1234567890',
            role: 'CUSTOMER',
            agreeToTerms: true,
            agreeToPrivacy: true,
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
      }
    });
  });

  describe('Password Security', () => {
    it('should enforce password complexity requirements', async () => {
      const weakPasswords = [
        '123',
        'password',
        'Password',
        '12345678',
        'abcdefgh',
        'ABCDEFGH',
        'password123',
        'PASSWORD123',
      ];

      for (const password of weakPasswords) {
        const response = await request(httpServer)
          .post('/auth/register')
          .send({
            email: `weak-password-${Date.now()}@example.com`,
            password,
            confirmPassword: password,
            firstName: 'Weak',
            lastName: 'Password',
            phone: '+1234567890',
            role: 'CUSTOMER',
            agreeToTerms: true,
            agreeToPrivacy: true,
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
      }
    });

    it('should hash passwords securely', async () => {
      const response = await request(httpServer)
        .post('/auth/register')
        .send({
          email: `hash-test-${Date.now()}@example.com`,
          password: 'SecurePassword123!',
          confirmPassword: 'SecurePassword123!',
          firstName: 'Hash',
          lastName: 'Test',
          phone: '+1234567890',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      if (response.status === 201) {
        // Password should never appear in response
        expect(JSON.stringify(response.body)).not.toContain('SecurePassword123!');
        expect(response.body.data.user).not.toHaveProperty('password');
        expect(response.body.data.user).not.toHaveProperty('passwordHash');
      }
    });
  });

  describe('Session Security', () => {
    let sessionTestTokens;

    beforeAll(async () => {
      await request(httpServer)
        .post('/auth/register')
        .send({
          email: 'session-security-test@example.com',
          password: 'SessionSecurityTest123!',
          confirmPassword: 'SessionSecurityTest123!',
          firstName: 'Session',
          lastName: 'Security',
          phone: '+1777888999',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({
          email: 'session-security-test@example.com',
          password: 'SessionSecurityTest123!',
        });

      sessionTestTokens = loginResponse.body.data;
    });

    it('should invalidate tokens after logout', async () => {
      // Logout
      await request(httpServer)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${sessionTestTokens.accessToken}`)
        .send({
          refreshToken: sessionTestTokens.refreshToken,
        })
        .expect(200);

      // Try to use invalidated token
      const response = await request(httpServer)
        .get('/users/profile')
        .set('Authorization', `Bearer ${sessionTestTokens.accessToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject reused refresh tokens', async () => {
      // Create new session for this test
      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({
          email: 'session-security-test@example.com',
          password: 'SessionSecurityTest123!',
        });

      const tokens = loginResponse.body.data;

      // Use refresh token once
      const firstRefresh = await request(httpServer)
        .post('/auth/refresh')
        .send({
          refreshToken: tokens.refreshToken,
        });

      expect(firstRefresh.status).toBe(200);

      // Try to use the same refresh token again
      const secondRefresh = await request(httpServer)
        .post('/auth/refresh')
        .send({
          refreshToken: tokens.refreshToken,
        });

      expect(secondRefresh.status).toBe(401);
    });
  });

  describe('CORS Security', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(httpServer)
        .options('/auth/login')
        .set('Origin', 'https://example.com')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type');

      expect(response.status).toBe(204);
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should include security headers', async () => {
      const response = await request(httpServer)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      // Check for security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });
});
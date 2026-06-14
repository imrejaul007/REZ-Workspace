const { Test } = require('@nestjs/testing');
const { INestApplication } = require('@nestjs/common');
const request = require('supertest');
const { AppModule } = require('../../../src/app.module');

describe('Auth Integration Tests', () => {
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

  describe('POST /auth/register', () => {
    const validRegistrationData = {
      email: 'integration-test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      firstName: 'Integration',
      lastName: 'Test',
      phone: '+1234567890',
      role: 'CUSTOMER',
      agreeToTerms: true,
      agreeToPrivacy: true,
    };

    it('should register a new user successfully', async () => {
      const response = await request(httpServer)
        .post('/auth/register')
        .send(validRegistrationData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(validRegistrationData.email);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should reject registration with invalid email', async () => {
      const invalidData = {
        ...validRegistrationData,
        email: 'invalid-email',
      };

      const response = await request(httpServer)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message');
    });

    it('should reject registration with weak password', async () => {
      const weakPasswordData = {
        ...validRegistrationData,
        email: 'weak-password@example.com',
        password: '123',
        confirmPassword: '123',
      };

      const response = await request(httpServer)
        .post('/auth/register')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject registration with mismatched passwords', async () => {
      const mismatchedData = {
        ...validRegistrationData,
        email: 'mismatched@example.com',
        confirmPassword: 'DifferentPassword123!',
      };

      const response = await request(httpServer)
        .post('/auth/register')
        .send(mismatchedData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject duplicate email registration', async () => {
      // First registration
      await request(httpServer)
        .post('/auth/register')
        .send({
          ...validRegistrationData,
          email: 'duplicate@example.com',
        })
        .expect(201);

      // Duplicate registration
      const response = await request(httpServer)
        .post('/auth/register')
        .send({
          ...validRegistrationData,
          email: 'duplicate@example.com',
        })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toMatch(/already exists/i);
    });
  });

  describe('POST /auth/login', () => {
    const testUser = {
      email: 'login-test@example.com',
      password: 'LoginTest123!',
      firstName: 'Login',
      lastName: 'Test',
    };

    beforeAll(async () => {
      // Create test user for login tests
      await request(httpServer)
        .post('/auth/register')
        .send({
          ...testUser,
          confirmPassword: testUser.password,
          phone: '+1987654321',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(httpServer)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should reject login with invalid email', async () => {
      const response = await request(httpServer)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toMatch(/invalid/i);
    });

    it('should reject login with invalid password', async () => {
      const response = await request(httpServer)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(httpServer)
        .post('/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /auth/refresh', () => {
    let testTokens;
    const refreshTestUser = {
      email: 'refresh-test@example.com',
      password: 'RefreshTest123!',
    };

    beforeAll(async () => {
      // Create user and get tokens
      await request(httpServer)
        .post('/auth/register')
        .send({
          ...refreshTestUser,
          confirmPassword: refreshTestUser.password,
          firstName: 'Refresh',
          lastName: 'Test',
          phone: '+1555666777',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send(refreshTestUser);

      testTokens = loginResponse.body.data;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(httpServer)
        .post('/auth/refresh')
        .send({
          refreshToken: testTokens.refreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('expiresIn');
      expect(response.body.data.accessToken).not.toBe(testTokens.accessToken);
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(httpServer)
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject refresh with missing token', async () => {
      const response = await request(httpServer)
        .post('/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /auth/logout', () => {
    let logoutTestTokens;
    const logoutTestUser = {
      email: 'logout-test@example.com',
      password: 'LogoutTest123!',
    };

    beforeEach(async () => {
      // Create fresh user and tokens for each test
      await request(httpServer)
        .post('/auth/register')
        .send({
          ...logoutTestUser,
          email: `logout-${Date.now()}@example.com`,
          confirmPassword: logoutTestUser.password,
          firstName: 'Logout',
          lastName: 'Test',
          phone: `+1${Math.floor(Math.random() * 1000000000)}`,
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({
          ...logoutTestUser,
          email: `logout-${Date.now()}@example.com`,
        });

      logoutTestTokens = loginResponse.body.data;
    });

    it('should logout successfully with valid token', async () => {
      const response = await request(httpServer)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${logoutTestTokens.accessToken}`)
        .send({
          refreshToken: logoutTestTokens.refreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.message).toMatch(/logged out/i);
    });

    it('should reject logout without authorization header', async () => {
      const response = await request(httpServer)
        .post('/auth/logout')
        .send({
          refreshToken: logoutTestTokens.refreshToken,
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /auth/forgot-password', () => {
    const forgotPasswordUser = {
      email: 'forgot-password@example.com',
      password: 'ForgotTest123!',
    };

    beforeAll(async () => {
      // Create user for forgot password tests
      await request(httpServer)
        .post('/auth/register')
        .send({
          ...forgotPasswordUser,
          confirmPassword: forgotPasswordUser.password,
          firstName: 'Forgot',
          lastName: 'Test',
          phone: '+1444555666',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });
    });

    it('should handle forgot password request for existing user', async () => {
      const response = await request(httpServer)
        .post('/auth/forgot-password')
        .send({
          email: forgotPasswordUser.email,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.message).toMatch(/password reset link/i);
    });

    it('should handle forgot password request for non-existent user (security)', async () => {
      const response = await request(httpServer)
        .post('/auth/forgot-password')
        .send({
          email: 'nonexistent-forgot@example.com',
        })
        .expect(200);

      // Should return same message for security (don't reveal if email exists)
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.message).toMatch(/password reset link/i);
    });

    it('should reject forgot password with invalid email format', async () => {
      const response = await request(httpServer)
        .post('/auth/forgot-password')
        .send({
          email: 'invalid-email-format',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Authentication Headers', () => {
    let protectedTestTokens;

    beforeAll(async () => {
      // Create user for protected endpoint tests
      await request(httpServer)
        .post('/auth/register')
        .send({
          email: 'protected-test@example.com',
          password: 'ProtectedTest123!',
          confirmPassword: 'ProtectedTest123!',
          firstName: 'Protected',
          lastName: 'Test',
          phone: '+1333444555',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({
          email: 'protected-test@example.com',
          password: 'ProtectedTest123!',
        });

      protectedTestTokens = loginResponse.body.data;
    });

    it('should accept valid Bearer token', async () => {
      const response = await request(httpServer)
        .get('/users/profile')
        .set('Authorization', `Bearer ${protectedTestTokens.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should reject invalid Bearer token', async () => {
      const response = await request(httpServer)
        .get('/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject malformed Authorization header', async () => {
      const response = await request(httpServer)
        .get('/users/profile')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject requests without Authorization header', async () => {
      const response = await request(httpServer)
        .get('/users/profile')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle multiple login attempts within limits', async () => {
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(httpServer)
            .post('/auth/login')
            .send({
              email: 'rate-limit-test@example.com',
              password: 'TestPassword123!',
            })
        );
      }

      const responses = await Promise.all(requests);

      // Most should be 401 (invalid credentials) rather than 429 (rate limited)
      // This tests that normal failed auth attempts don't trigger rate limiting immediately
      const statusCodes = responses.map(r => r.status);
      expect(statusCodes.filter(s => s === 401).length).toBeGreaterThan(0);
      expect(statusCodes.filter(s => s === 429).length).toBeLessThan(5);
    });
  });
});
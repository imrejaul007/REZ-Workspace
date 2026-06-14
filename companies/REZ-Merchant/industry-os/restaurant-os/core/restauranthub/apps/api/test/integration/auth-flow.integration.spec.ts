import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Authentication Flow Integration Tests', () => {
  let app: INestApplication;
  let httpServer: any;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = app.get<PrismaService>(PrismaService);

    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.user.deleteMany({
      where: {
        email: {
          contains: 'integration-test',
        },
      },
    });
    await app.close();
  });

  describe('Complete User Registration → Login → Dashboard Flow', () => {
    const testUser = {
      email: `integration-test-${Date.now()}@example.com`,
      password: 'IntegrationTest123!',
      firstName: 'Integration',
      lastName: 'Test',
      phone: '+1234567890',
      role: 'CUSTOMER',
    };

    let authTokens: any;
    let userId: string;

    it('should complete full registration process', async () => {
      // Step 1: Register user
      const registrationResponse = await request(httpServer)
        .post('/auth/register')
        .send({
          ...testUser,
          confirmPassword: testUser.password,
          agreeToTerms: true,
          agreeToPrivacy: true,
        })
        .expect(201);

      expect(registrationResponse.body).toHaveProperty('success', true);
      expect(registrationResponse.body.data).toHaveProperty('user');
      expect(registrationResponse.body.data.user.email).toBe(testUser.email);
      expect(registrationResponse.body.data.user).not.toHaveProperty('password');

      userId = registrationResponse.body.data.user.id;

      // Step 2: Verify user exists in database
      const dbUser = await prismaService.user.findUnique({
        where: { email: testUser.email },
      });

      expect(dbUser).toBeTruthy();
      expect(dbUser?.email).toBe(testUser.email);
      expect(dbUser?.firstName).toBe(testUser.firstName);
      expect(dbUser?.isVerified).toBe(false); // Should be unverified initially
    });

    it('should login user and return valid tokens', async () => {
      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('success', true);
      expect(loginResponse.body.data).toHaveProperty('accessToken');
      expect(loginResponse.body.data).toHaveProperty('refreshToken');
      expect(loginResponse.body.data).toHaveProperty('user');

      authTokens = loginResponse.body.data;

      // Verify token format
      expect(authTokens.accessToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      expect(authTokens.refreshToken).toBeTruthy();
    });

    it('should access protected dashboard route', async () => {
      const dashboardResponse = await request(httpServer)
        .get('/users/profile')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      expect(dashboardResponse.body).toHaveProperty('success', true);
      expect(dashboardResponse.body.data).toHaveProperty('id', userId);
      expect(dashboardResponse.body.data).toHaveProperty('email', testUser.email);
    });

    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Updated Integration',
        lastName: 'Updated Test',
        bio: 'Updated bio for integration testing',
      };

      const updateResponse = await request(httpServer)
        .put('/users/profile')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body).toHaveProperty('success', true);
      expect(updateResponse.body.data.firstName).toBe(updateData.firstName);
      expect(updateResponse.body.data.lastName).toBe(updateData.lastName);

      // Verify in database
      const updatedUser = await prismaService.user.findUnique({
        where: { id: userId },
      });

      expect(updatedUser?.firstName).toBe(updateData.firstName);
      expect(updatedUser?.lastName).toBe(updateData.lastName);
    });

    it('should refresh access token', async () => {
      const refreshResponse = await request(httpServer)
        .post('/auth/refresh')
        .send({
          refreshToken: authTokens.refreshToken,
        })
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('success', true);
      expect(refreshResponse.body.data).toHaveProperty('accessToken');
      expect(refreshResponse.body.data).toHaveProperty('refreshToken');

      // New access token should be different
      expect(refreshResponse.body.data.accessToken).not.toBe(authTokens.accessToken);

      // Update tokens for subsequent tests
      authTokens = refreshResponse.body.data;
    });

    it('should logout user and invalidate tokens', async () => {
      const logoutResponse = await request(httpServer)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send({
          refreshToken: authTokens.refreshToken,
        })
        .expect(200);

      expect(logoutResponse.body).toHaveProperty('success', true);

      // Verify tokens are invalidated
      const protectedResponse = await request(httpServer)
        .get('/users/profile')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(401);

      expect(protectedResponse.body).toHaveProperty('success', false);
    });
  });

  describe('Password Reset Flow', () => {
    const resetTestUser = {
      email: `reset-integration-test-${Date.now()}@example.com`,
      password: 'ResetTest123!',
      firstName: 'Reset',
      lastName: 'Test',
      phone: '+1987654321',
      role: 'CUSTOMER',
    };

    beforeAll(async () => {
      // Register user for password reset testing
      await request(httpServer)
        .post('/auth/register')
        .send({
          ...resetTestUser,
          confirmPassword: resetTestUser.password,
          agreeToTerms: true,
          agreeToPrivacy: true,
        });
    });

    it('should initiate password reset', async () => {
      const resetInitResponse = await request(httpServer)
        .post('/auth/forgot-password')
        .send({
          email: resetTestUser.email,
        })
        .expect(200);

      expect(resetInitResponse.body).toHaveProperty('success', true);
      expect(resetInitResponse.body.message).toMatch(/reset.*email/i);
    });

    it('should handle invalid email for password reset', async () => {
      const invalidResetResponse = await request(httpServer)
        .post('/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200); // Should return 200 to prevent email enumeration

      expect(invalidResetResponse.body).toHaveProperty('success', true);
      expect(invalidResetResponse.body.message).toMatch(/reset.*email/i);
    });

    // Note: In a real integration test, you would:
    // 1. Mock email service or use a test email service
    // 2. Extract reset token from email
    // 3. Test the complete password reset flow
    // For this example, we'll test the endpoint structure
    it('should validate password reset token format', async () => {
      const invalidTokenResponse = await request(httpServer)
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        })
        .expect(400);

      expect(invalidTokenResponse.body).toHaveProperty('success', false);
      expect(invalidTokenResponse.body.message).toMatch(/token.*invalid/i);
    });
  });

  describe('Social Authentication Flow', () => {
    // Note: These tests would typically require mocking OAuth providers
    it('should provide Google OAuth URL', async () => {
      const googleAuthResponse = await request(httpServer)
        .get('/auth/google')
        .expect(302); // Redirect to Google

      expect(googleAuthResponse.headers.location).toMatch(/google/);
    });

    it('should provide GitHub OAuth URL', async () => {
      const githubAuthResponse = await request(httpServer)
        .get('/auth/github')
        .expect(302); // Redirect to GitHub

      expect(githubAuthResponse.headers.location).toMatch(/github/);
    });

    // In a real test environment, you would mock the OAuth callbacks
    it('should handle OAuth callback errors', async () => {
      const errorCallbackResponse = await request(httpServer)
        .get('/auth/google/callback?error=access_denied')
        .expect(302); // Should redirect to frontend with error

      expect(errorCallbackResponse.headers.location).toMatch(/error/);
    });
  });

  describe('Email Verification Flow', () => {
    const verificationUser = {
      email: `verification-test-${Date.now()}@example.com`,
      password: 'VerificationTest123!',
      firstName: 'Verification',
      lastName: 'Test',
      phone: '+1555444333',
      role: 'CUSTOMER',
    };

    let verificationUserId: string;

    it('should register user with unverified email', async () => {
      const registrationResponse = await request(httpServer)
        .post('/auth/register')
        .send({
          ...verificationUser,
          confirmPassword: verificationUser.password,
          agreeToTerms: true,
          agreeToPrivacy: true,
        })
        .expect(201);

      verificationUserId = registrationResponse.body.data.user.id;

      // User should be unverified initially
      const dbUser = await prismaService.user.findUnique({
        where: { id: verificationUserId },
      });

      expect(dbUser?.isVerified).toBe(false);
    });

    it('should resend verification email', async () => {
      const resendResponse = await request(httpServer)
        .post('/auth/resend-verification')
        .send({
          email: verificationUser.email,
        })
        .expect(200);

      expect(resendResponse.body).toHaveProperty('success', true);
      expect(resendResponse.body.message).toMatch(/verification.*sent/i);
    });

    it('should limit verification email resending', async () => {
      // Attempt multiple resends rapidly
      const rapidResends = [];
      for (let i = 0; i < 5; i++) {
        rapidResends.push(
          request(httpServer)
            .post('/auth/resend-verification')
            .send({
              email: verificationUser.email,
            })
        );
      }

      const responses = await Promise.all(rapidResends);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Session Management', () => {
    const sessionUser = {
      email: `session-test-${Date.now()}@example.com`,
      password: 'SessionTest123!',
      firstName: 'Session',
      lastName: 'Test',
      phone: '+1777888999',
      role: 'CUSTOMER',
    };

    let userTokens: any;

    beforeAll(async () => {
      // Register and login user
      await request(httpServer)
        .post('/auth/register')
        .send({
          ...sessionUser,
          confirmPassword: sessionUser.password,
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({
          email: sessionUser.email,
          password: sessionUser.password,
        });

      userTokens = loginResponse.body.data;
    });

    it('should list active sessions', async () => {
      const sessionsResponse = await request(httpServer)
        .get('/auth/sessions')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(sessionsResponse.body).toHaveProperty('success', true);
      expect(sessionsResponse.body.data).toBeInstanceOf(Array);
      expect(sessionsResponse.body.data.length).toBeGreaterThan(0);

      // Each session should have required fields
      sessionsResponse.body.data.forEach((session: any) => {
        expect(session).toHaveProperty('id');
        expect(session).toHaveProperty('createdAt');
        expect(session).toHaveProperty('userAgent');
        expect(session).toHaveProperty('ipAddress');
      });
    });

    it('should revoke specific session', async () => {
      // Get active sessions
      const sessionsResponse = await request(httpServer)
        .get('/auth/sessions')
        .set('Authorization', `Bearer ${userTokens.accessToken}`);

      const sessionId = sessionsResponse.body.data[0].id;

      // Revoke session
      const revokeResponse = await request(httpServer)
        .delete(`/auth/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(revokeResponse.body).toHaveProperty('success', true);
    });

    it('should revoke all sessions except current', async () => {
      // Create multiple sessions
      const session2 = await request(httpServer)
        .post('/auth/login')
        .send({
          email: sessionUser.email,
          password: sessionUser.password,
        });

      const session3 = await request(httpServer)
        .post('/auth/login')
        .send({
          email: sessionUser.email,
          password: sessionUser.password,
        });

      // Revoke all other sessions
      const revokeAllResponse = await request(httpServer)
        .delete('/auth/sessions/all')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);

      expect(revokeAllResponse.body).toHaveProperty('success', true);

      // Other sessions should be invalid
      await request(httpServer)
        .get('/users/profile')
        .set('Authorization', `Bearer ${session2.body.data.accessToken}`)
        .expect(401);

      await request(httpServer)
        .get('/users/profile')
        .set('Authorization', `Bearer ${session3.body.data.accessToken}`)
        .expect(401);

      // Current session should still work
      await request(httpServer)
        .get('/users/profile')
        .set('Authorization', `Bearer ${userTokens.accessToken}`)
        .expect(200);
    });
  });

  describe('Authentication Error Scenarios', () => {
    it('should handle malformed JWT tokens', async () => {
      const malformedTokens = [
        'invalid.token.here',
        'Bearer malformed-token',
        'not-a-jwt-token',
        '',
      ];

      for (const token of malformedTokens) {
        const response = await request(httpServer)
          .get('/users/profile')
          .set('Authorization', `Bearer ${token}`)
          .expect(401);

        expect(response.body).toHaveProperty('success', false);
        expect(response.body.message).toMatch(/token.*invalid|unauthorized/i);
      }
    });

    it('should handle concurrent login attempts', async () => {
      const concurrentUser = {
        email: `concurrent-test-${Date.now()}@example.com`,
        password: 'ConcurrentTest123!',
        firstName: 'Concurrent',
        lastName: 'Test',
        phone: '+1333222111',
        role: 'CUSTOMER',
      };

      // Register user
      await request(httpServer)
        .post('/auth/register')
        .send({
          ...concurrentUser,
          confirmPassword: concurrentUser.password,
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      // Make concurrent login requests
      const concurrentLogins = [];
      for (let i = 0; i < 5; i++) {
        concurrentLogins.push(
          request(httpServer)
            .post('/auth/login')
            .send({
              email: concurrentUser.email,
              password: concurrentUser.password,
            })
        );
      }

      const results = await Promise.all(concurrentLogins);
      const successfulLogins = results.filter(r => r.status === 200);

      // All concurrent logins should succeed
      expect(successfulLogins.length).toBe(5);

      // Each should have valid tokens
      successfulLogins.forEach(result => {
        expect(result.body.data).toHaveProperty('accessToken');
        expect(result.body.data).toHaveProperty('refreshToken');
      });
    });

    it('should handle token refresh race conditions', async () => {
      const raceUser = {
        email: `race-test-${Date.now()}@example.com`,
        password: 'RaceTest123!',
        firstName: 'Race',
        lastName: 'Test',
        phone: '+1444555666',
        role: 'CUSTOMER',
      };

      // Register and login
      await request(httpServer)
        .post('/auth/register')
        .send({
          ...raceUser,
          confirmPassword: raceUser.password,
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({
          email: raceUser.email,
          password: raceUser.password,
        });

      const refreshToken = loginResponse.body.data.refreshToken;

      // Make concurrent refresh requests
      const concurrentRefreshes = [];
      for (let i = 0; i < 3; i++) {
        concurrentRefreshes.push(
          request(httpServer)
            .post('/auth/refresh')
            .send({ refreshToken })
        );
      }

      const refreshResults = await Promise.all(concurrentRefreshes);
      const successfulRefreshes = refreshResults.filter(r => r.status === 200);

      // Only one refresh should succeed (token rotation)
      expect(successfulRefreshes.length).toBe(1);

      const failedRefreshes = refreshResults.filter(r => r.status === 401);
      expect(failedRefreshes.length).toBe(2);
    });
  });
});
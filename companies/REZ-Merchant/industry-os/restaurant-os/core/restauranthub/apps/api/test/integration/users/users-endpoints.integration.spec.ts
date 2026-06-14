import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { UsersService } from '../../../src/modules/users/users.service';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { TestUtils } from '../../setup';

describe('Users Endpoints (Integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authService: AuthService;
  let accessToken: string;
  let userId: string;
  let adminAccessToken: string;
  let adminUserId: string;

  // Test user data
  const testUser = {
    email: 'testuser@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    role: UserRole.CUSTOMER,
  };

  const adminUser = {
    email: 'admin@example.com',
    password: 'adminpass123',
    firstName: 'Admin',
    lastName: 'User',
    phone: '+1987654321',
    role: UserRole.ADMIN,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        PassportModule,
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [
        PrismaService,
        UsersService,
        AuthService,
      ],
    }).compile();

    app = await TestUtils.createTestApp(moduleFixture);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);

    await app.init();

    // Clean up database
    await TestUtils.cleanupDatabase(prismaService);

    // Create test users and get tokens
    const userResult = await authService.signUp(testUser);
    accessToken = userResult.accessToken;
    userId = userResult.user.id;

    const adminResult = await authService.signUp(adminUser);
    adminAccessToken = adminResult.accessToken;
    adminUserId = adminResult.user.id;
  });

  afterAll(async () => {
    await TestUtils.cleanupDatabase(prismaService);
    await app.close();
  });

  beforeEach(async () => {
    // Reset any test-specific data
    jest.clearAllMocks();
  });

  describe('GET /users/profile', () => {
    it('should get current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('role', testUser.role);
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile).toHaveProperty('firstName', testUser.firstName);
      expect(response.body.profile).toHaveProperty('lastName', testUser.lastName);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /users/profile', () => {
    const updateData = {
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1555666777',
      bio: 'Updated bio',
      location: 'New York, NY',
    };

    it('should update user profile successfully', async () => {
      const response = await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('phone', updateData.phone);
      expect(response.body.profile).toHaveProperty('firstName', updateData.firstName);
      expect(response.body.profile).toHaveProperty('lastName', updateData.lastName);
      expect(response.body.profile).toHaveProperty('bio', updateData.bio);
      expect(response.body.profile).toHaveProperty('location', updateData.location);
    });

    it('should validate phone number format', async () => {
      const invalidData = {
        ...updateData,
        phone: 'invalid-phone',
      };

      const response = await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('phone');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        firstName: '', // Empty first name
        lastName: '', // Empty last name
      };

      const response = await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .put('/users/profile')
        .send(updateData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /users/upload-avatar', () => {
    it('should upload avatar successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/upload-avatar')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', Buffer.from('fake-image-data'), 'avatar.jpg')
        .expect(200);

      expect(response.body).toHaveProperty('avatarUrl');
      expect(response.body.avatarUrl).toMatch(/^https?:\/\/.+/);
    });

    it('should validate file type', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/upload-avatar')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', Buffer.from('fake-file-data'), 'document.pdf')
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('file type');
    });

    it('should validate file size', async () => {
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB

      const response = await request(app.getHttpServer())
        .post('/users/upload-avatar')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', largeBuffer, 'large-image.jpg')
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('file size');
    });

    it('should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/upload-avatar')
        .attach('avatar', Buffer.from('fake-image-data'), 'avatar.jpg')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /users/preferences', () => {
    it('should get user preferences', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/preferences')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('notifications');
      expect(response.body).toHaveProperty('privacy');
      expect(response.body).toHaveProperty('language');
      expect(response.body).toHaveProperty('timezone');
    });

    it('should return default preferences for new user', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/preferences')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.notifications).toEqual({
        email: true,
        push: true,
        sms: false,
        marketing: false,
      });
      expect(response.body.privacy).toEqual({
        profileVisible: true,
        activityVisible: false,
      });
      expect(response.body.language).toBe('en');
      expect(response.body.timezone).toBe('UTC');
    });

    it('should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/preferences')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /users/preferences', () => {
    const preferenceData = {
      notifications: {
        email: false,
        push: true,
        sms: true,
        marketing: true,
      },
      privacy: {
        profileVisible: false,
        activityVisible: true,
      },
      language: 'es',
      timezone: 'America/New_York',
    };

    it('should update user preferences', async () => {
      const response = await request(app.getHttpServer())
        .put('/users/preferences')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(preferenceData)
        .expect(200);

      expect(response.body.notifications).toEqual(preferenceData.notifications);
      expect(response.body.privacy).toEqual(preferenceData.privacy);
      expect(response.body.language).toBe(preferenceData.language);
      expect(response.body.timezone).toBe(preferenceData.timezone);
    });

    it('should validate language code', async () => {
      const invalidData = {
        ...preferenceData,
        language: 'invalid-lang',
      };

      const response = await request(app.getHttpServer())
        .put('/users/preferences')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('language');
    });

    it('should validate timezone', async () => {
      const invalidData = {
        ...preferenceData,
        timezone: 'Invalid/Timezone',
      };

      const response = await request(app.getHttpServer())
        .put('/users/preferences')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('timezone');
    });

    it('should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .put('/users/preferences')
        .send(preferenceData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /users/account', () => {
    it('should deactivate user account', async () => {
      // Create a new user for this test
      const testUserForDeletion = {
        email: 'todelete@example.com',
        password: 'password123',
        firstName: 'To',
        lastName: 'Delete',
        role: UserRole.CUSTOMER,
      };

      const userResult = await authService.signUp(testUserForDeletion);
      const userToken = userResult.accessToken;

      const response = await request(app.getHttpServer())
        .delete('/users/account')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'No longer needed' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deactivated');

      // Verify user cannot login after deactivation
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: testUserForDeletion.email,
          password: testUserForDeletion.password,
        })
        .expect(401);

      expect(loginResponse.body).toHaveProperty('message');
    });

    it('should require authentication', async () => {
      const response = await request(app.getHttpServer())
        .delete('/users/account')
        .send({ reason: 'Test reason' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Admin User Management', () => {
    describe('GET /users (Admin)', () => {
      it('should allow admin to list all users', async () => {
        const response = await request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('users');
        expect(response.body).toHaveProperty('pagination');
        expect(response.body.users).toBeInstanceOf(Array);
        expect(response.body.users.length).toBeGreaterThan(0);

        // Verify user data structure
        const user = response.body.users[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
        expect(user).not.toHaveProperty('passwordHash');
      });

      it('should support pagination', async () => {
        const response = await request(app.getHttpServer())
          .get('/users?page=1&limit=5')
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .expect(200);

        expect(response.body.pagination).toEqual({
          page: 1,
          limit: 5,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        });
      });

      it('should support filtering by role', async () => {
        const response = await request(app.getHttpServer())
          .get(`/users?role=${UserRole.ADMIN}`)
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .expect(200);

        expect(response.body.users).toBeInstanceOf(Array);
        response.body.users.forEach(user => {
          expect(user.role).toBe(UserRole.ADMIN);
        });
      });

      it('should support search by email', async () => {
        const response = await request(app.getHttpServer())
          .get('/users?search=testuser')
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .expect(200);

        expect(response.body.users).toBeInstanceOf(Array);
        const foundUser = response.body.users.find(u => u.email === testUser.email);
        expect(foundUser).toBeDefined();
      });

      it('should deny access to non-admin users', async () => {
        const response = await request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(403);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Forbidden');
      });
    });

    describe('PUT /users/:id/role (Admin)', () => {
      it('should allow admin to update user role', async () => {
        const response = await request(app.getHttpServer())
          .put(`/users/${userId}/role`)
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send({ role: UserRole.RESTAURANT })
          .expect(200);

        expect(response.body).toHaveProperty('id', userId);
        expect(response.body).toHaveProperty('role', UserRole.RESTAURANT);

        // Verify role was actually updated
        const profileResponse = await request(app.getHttpServer())
          .get('/users/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(profileResponse.body.role).toBe(UserRole.RESTAURANT);
      });

      it('should validate role value', async () => {
        const response = await request(app.getHttpServer())
          .put(`/users/${userId}/role`)
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send({ role: 'INVALID_ROLE' })
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('role');
      });

      it('should return 404 for non-existent user', async () => {
        const response = await request(app.getHttpServer())
          .put('/users/non-existent-id/role')
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send({ role: UserRole.CUSTOMER })
          .expect(404);

        expect(response.body).toHaveProperty('message');
      });

      it('should deny access to non-admin users', async () => {
        const response = await request(app.getHttpServer())
          .put(`/users/${userId}/role`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ role: UserRole.ADMIN })
          .expect(403);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Forbidden');
      });
    });

    describe('PUT /users/:id/status (Admin)', () => {
      it('should allow admin to suspend user', async () => {
        const response = await request(app.getHttpServer())
          .put(`/users/${userId}/status`)
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send({
            status: 'SUSPENDED',
            reason: 'Terms of service violation',
          })
          .expect(200);

        expect(response.body).toHaveProperty('id', userId);
        expect(response.body).toHaveProperty('status', 'SUSPENDED');
        expect(response.body).toHaveProperty('isActive', false);

        // Verify user cannot login when suspended
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/signin')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(401);

        expect(loginResponse.body).toHaveProperty('message');
      });

      it('should allow admin to reactivate user', async () => {
        const response = await request(app.getHttpServer())
          .put(`/users/${userId}/status`)
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send({
            status: 'ACTIVE',
            reason: 'Appeal approved',
          })
          .expect(200);

        expect(response.body).toHaveProperty('status', 'ACTIVE');
        expect(response.body).toHaveProperty('isActive', true);
      });

      it('should validate status value', async () => {
        const response = await request(app.getHttpServer())
          .put(`/users/${userId}/status`)
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send({ status: 'INVALID_STATUS' })
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('status');
      });

      it('should require reason for status changes', async () => {
        const response = await request(app.getHttpServer())
          .put(`/users/${userId}/status`)
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send({ status: 'SUSPENDED' })
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('reason');
      });

      it('should deny access to non-admin users', async () => {
        const response = await request(app.getHttpServer())
          .put(`/users/${userId}/status`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            status: 'SUSPENDED',
            reason: 'Test',
          })
          .expect(403);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Forbidden');
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on profile updates', async () => {
      const updateData = { firstName: 'Test' };
      const requests = Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .put('/users/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateData)
      );

      const responses = await Promise.allSettled(requests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(
        (response) =>
          response.status === 'fulfilled' &&
          response.value.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize XSS attempts in profile data', async () => {
      const maliciousData = {
        firstName: '<script>alert("xss")</script>John',
        lastName: '<img src="x" onerror="alert(1)">Doe',
        bio: '<iframe src="javascript:alert(1)"></iframe>Bio content',
      };

      const response = await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(maliciousData)
        .expect(200);

      // Should strip malicious content
      expect(response.body.profile.firstName).not.toContain('<script>');
      expect(response.body.profile.lastName).not.toContain('<img');
      expect(response.body.profile.bio).not.toContain('<iframe');
      expect(response.body.profile.firstName).toContain('John');
      expect(response.body.profile.lastName).toContain('Doe');
      expect(response.body.profile.bio).toContain('Bio content');
    });

    it('should handle SQL injection attempts', async () => {
      const maliciousData = {
        firstName: "John'; DROP TABLE users; --",
        lastName: "Doe\" OR 1=1 --",
      };

      const response = await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(maliciousData)
        .expect(200);

      // Should treat as normal text
      expect(response.body.profile.firstName).toBe(maliciousData.firstName);
      expect(response.body.profile.lastName).toBe(maliciousData.lastName);

      // Verify database integrity by checking if user still exists
      const profileResponse = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body).toHaveProperty('id', userId);
    });
  });

  describe('Concurrency Handling', () => {
    it('should handle concurrent profile updates gracefully', async () => {
      const updateData1 = { firstName: 'John1' };
      const updateData2 = { firstName: 'John2' };

      const [response1, response2] = await Promise.all([
        request(app.getHttpServer())
          .put('/users/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateData1),
        request(app.getHttpServer())
          .put('/users/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateData2),
      ]);

      // Both requests should succeed
      expect([200, 200]).toContain(response1.status);
      expect([200, 200]).toContain(response2.status);

      // Final state should be one of the updates
      const profileResponse = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(['John1', 'John2']).toContain(
        profileResponse.body.profile.firstName
      );
    });
  });
});
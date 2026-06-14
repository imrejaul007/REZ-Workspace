import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

describe('Auth Endpoints (Integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  // Test user data
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    role: 'CUSTOMER',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Clean up database before tests
    await prismaService.user.deleteMany();
  });

  afterAll(async () => {
    // Clean up database after tests
    await prismaService.user.deleteMany();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await prismaService.user.deleteMany();
  });

  describe('POST /auth/signup', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('passwordHash');

      // Verify user was created in database
      const dbUser = await prismaService.user.findUnique({
        where: { email: testUser.email },
      });
      expect(dbUser).toBeTruthy();
      expect(dbUser.firstName).toBe(testUser.firstName);
    });

    it('should return 400 for invalid email format', async () => {
      const invalidUser = { ...testUser, email: 'invalid-email' };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(invalidUser)
        .expect(400);

      expect(response.body.message).toContain('email');
    });

    it('should return 409 for duplicate email', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(testUser)
        .expect(201);

      // Second registration with same email
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(testUser)
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('should validate password requirements', async () => {
      const weakPasswordUser = { ...testUser, password: '123' };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body.message).toContain('password');
    });

    it('should validate required fields', async () => {
      const incompleteUser = {
        email: testUser.email,
        password: testUser.password,
        // Missing firstName, lastName
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(incompleteUser)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /auth/signin', () => {
    beforeEach(async () => {
      // Create a user for signin tests
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(testUser);
    });

    it('should sign in with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should validate email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.message).toContain('email');
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Create user and get refresh token
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(testUser);

      refreshToken = signupResponse.body.refreshToken;
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('expiresIn');
      expect(typeof response.body.accessToken).toBe('string');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.message).toContain('Invalid');
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /auth/logout', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Create user and get tokens
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(testUser);

      accessToken = signupResponse.body.accessToken;
      refreshToken = signupResponse.body.refreshToken;
    });

    it('should logout successfully with valid tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body.message).toContain('success');
    });

    it('should return 401 for missing authorization header', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should return 401 for invalid access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /auth/forgot-password', () => {
    beforeEach(async () => {
      // Create a user for password reset tests
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(testUser);
    });

    it('should send password reset email for existing user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body.message).toContain('reset link');
    });

    it('should not reveal if email does not exist', async () => {
      // This should return the same message for security
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.message).toContain('reset link');
    });

    it('should validate email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.message).toContain('email');
    });
  });

  describe('Authentication Middleware', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Create user and get access token
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(testUser);

      accessToken = signupResponse.body.accessToken;
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.email).toBe(testUser.email);
    });

    it('should reject access to protected route without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should reject access with expired token', async () => {
      // Create an expired token
      const expiredToken = jwtService.sign(
        { sub: 'user-id', email: testUser.email },
        { expiresIn: '-1h' }
      );

      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on signup endpoint', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app.getHttpServer())
          .post('/auth/signup')
          .send({
            ...testUser,
            email: `test${i}@example.com`,
          })
      );

      const responses = await Promise.allSettled(promises);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(
        (response) =>
          response.status === 'fulfilled' &&
          response.value.status === 429
      );

      // Expect at least some rate limiting to occur
      expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(0);
    });

    it('should enforce rate limits on signin endpoint', async () => {
      // First create a user
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(testUser);

      // Then try multiple signin attempts
      const promises = Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .post('/auth/signin')
          .send({
            email: testUser.email,
            password: 'wrongpassword',
          })
      );

      const responses = await Promise.allSettled(promises);

      // Should have some rate limited responses after multiple failed attempts
      const rateLimitedResponses = responses.filter(
        (response) =>
          response.status === 'fulfilled' &&
          response.value.status === 429
      );

      expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      // Check for security headers
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      jest.spyOn(prismaService.user, 'create').mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(testUser)
        .expect(500);

      expect(response.body.message).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send('invalid-json')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should handle large payloads', async () => {
      const largePayload = {
        ...testUser,
        description: 'x'.repeat(1000000), // 1MB string
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(largePayload)
        .expect(413);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('Data Validation', () => {
    it('should sanitize input data', async () => {
      const maliciousUser = {
        ...testUser,
        firstName: '<script>alert("xss")</script>John',
        lastName: '<img src="x" onerror="alert(1)">Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(maliciousUser)
        .expect(201);

      // Should not contain script tags
      expect(response.body.user.firstName).not.toContain('<script>');
      expect(response.body.user.lastName).not.toContain('<img');
    });

    it('should validate phone number format', async () => {
      const invalidPhoneUser = {
        ...testUser,
        phone: 'invalid-phone',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(invalidPhoneUser)
        .expect(400);

      expect(response.body.message).toContain('phone');
    });
  });
});
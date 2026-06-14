/**
 * Unit Tests for Authentication Routes
 */

import express from 'express';
import request from 'supertest';

// Mock the database
jest.mock('../../src/config/database', () => ({
  connectMongoDB: jest.fn().mockResolvedValue({}),
  disconnectMongoDB: jest.fn().mockResolvedValue({}),
  connectRedis: jest.fn().mockResolvedValue({}),
  disconnectRedis: jest.fn().mockResolvedValue({}),
  isMongoConnected: jest.fn().mockReturnValue(true),
  getRedisClient: jest.fn().mockReturnValue({
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    isOpen: true,
  }),
}));

// Mock the hub client
jest.mock('../../src/hub-client', () => ({
  rezWorkspaceHub: {
    verifyUser: jest.fn().mockResolvedValue({ valid: true }),
    getUserProfile: jest.fn().mockResolvedValue({}),
    trackEvent: jest.fn().mockResolvedValue({}),
  },
}));

import authRoutes from '../../src/routes/auth';
import { registerSchema, loginSchema } from '../../src/middleware/validation';

describe('Authentication Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should reject duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'duplicate@example.com',
          password: 'password123',
        });

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User 2',
          email: 'duplicate@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Register first
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Login Test',
          email: 'login@example.com',
          password: 'password123',
        });

      // Then login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject login with wrong password', async () => {
      // Register first
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Password Test',
          email: 'password@example.com',
          password: 'correctpassword',
        });

      // Try login with wrong password
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'password@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'some-token' });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      // Register and login to get tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@rtnm.digital',
          password: 'demo123',
        });

      const refreshToken = loginResponse.body.refreshToken;

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.accessToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info with valid token', async () => {
      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@rtnm.digital',
          password: 'demo123',
        });

      const accessToken = loginResponse.body.accessToken;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/auth/me/status', () => {
    it('should update user status successfully', async () => {
      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@rtnm.digital',
          password: 'demo123',
        });

      const accessToken = loginResponse.body.accessToken;

      const response = await request(app)
        .patch('/api/auth/me/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'away' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('away');
    });

    it('should reject invalid status values', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@rtnm.digital',
          password: 'demo123',
        });

      const accessToken = loginResponse.body.accessToken;

      const response = await request(app)
        .patch('/api/auth/me/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'invalid' });

      expect(response.status).toBe(400);
    });
  });
});

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject short name', () => {
      const invalidData = {
        name: 'A',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing email', () => {
      const invalidData = {
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
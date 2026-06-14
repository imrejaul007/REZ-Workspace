/**
 * Health API Tests for Instagram Shop Integration Service
 */

import request from 'supertest';
import express, { Express } from 'express';
import mongoose from 'mongoose';

// Mock mongoose
jest.mock('mongoose', () => {
  const mConnection = {
    readyState: 1, // Connected
    db: {
      admin: () => ({
        ping: jest.fn().mockResolvedValue({ ok: 1 }),
      }),
    },
    close: jest.fn().mockResolvedValue(undefined),
  };
  return {
    connection: mConnection,
    connect: jest.fn().mockResolvedValue(undefined),
    Types: {
      ObjectId: {
        isValid: jest.fn().mockReturnValue(true),
      },
    },
  };
});

// Create a test app
const createTestApp = (): Express => {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req, res) => {
    const mongoStatus =
      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    res.json({
      status: 'healthy',
      service: 'instagram-shop-integration',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      mongodb: mongoStatus,
    });
  });

  // Readiness check
  app.get('/ready', async (_req, res) => {
    try {
      await mongoose.connection.db?.admin().ping();
      res.json({
        status: 'ready',
        mongodb: 'connected',
      });
    } catch {
      res.status(503).json({
        status: 'not ready',
        mongodb: 'disconnected',
      });
    }
  });

  return app;
};

describe('Health API', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /health', () => {
    it('should return 200 with healthy status when MongoDB is connected', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('instagram-shop-integration');
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.mongodb).toBe('connected');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should include all required health fields', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('mongodb');
    });
  });

  describe('GET /ready', () => {
    it('should return 200 when database is ready', async () => {
      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
      expect(response.body.mongodb).toBe('connected');
    });
  });
});

describe('Health API with disconnected MongoDB', () => {
  let app: Express;

  beforeAll(() => {
    // Mock disconnected state
    (mongoose.connection.readyState as number) = 0;

    app = createTestApp();
  });

  afterAll(() => {
    // Restore connected state
    (mongoose.connection.readyState as number) = 1;
  });

  it('should return disconnected status when MongoDB is not connected', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.mongodb).toBe('disconnected');
  });
});

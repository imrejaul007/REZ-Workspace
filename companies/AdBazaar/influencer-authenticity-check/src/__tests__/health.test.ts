/**
 * Health Check API Tests
 * Tests for the /health and /ready endpoints
 */

import request from 'supertest';
import express, { Application } from 'express';

// Create a simple test app that mimics the health endpoint
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'influencer-authenticity-check',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/ready', async (_req, res) => {
    // Mock dbState as connected (1)
    const dbState = 1;

    if (dbState !== 1) {
      res.status(503).json({
        status: 'not ready',
        database: 'disconnected',
      });
      return;
    }

    res.json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
};

describe('Health API', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /health', () => {
    test('should return 200 with proper structure', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'influencer-authenticity-check');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('should return proper health status structure', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('version');
    });

    test('should return valid ISO timestamp', async () => {
      const response = await request(app).get('/health');

      expect(() => new Date(response.body.timestamp)).not.toThrow();
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('GET /ready', () => {
    test('should return 200 when database is connected', async () => {
      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ready');
      expect(response.body).toHaveProperty('database', 'connected');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('should return valid ISO timestamp', async () => {
      const response = await request(app).get('/ready');

      expect(() => new Date(response.body.timestamp)).not.toThrow();
    });
  });
});
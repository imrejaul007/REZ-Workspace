/**
 * Health Check API Tests
 * Tests for the /health and /ready endpoints
 */

import request from 'supertest';
import express, { Application } from 'express';

// Create a simple test app that mimics the health endpoint
const createTestApp = (mongoState: number = 1): Application => {
  const app = express();
  app.use(express.json());

  app.get('/health', async (_req, res) => {
    const mongoOk = mongoState === 1;
    res.json({
      status: mongoOk ? 'healthy' : 'degraded',
      service: 'brand-partnership-portal',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      mongodb: mongoOk ? 'connected' : 'disconnected',
    });
  });

  app.get('/ready', async (_req, res) => {
    const mongoOk = mongoState === 1;
    if (!mongoOk) {
      res.status(503).json({ ready: false, error: 'MongoDB not connected' });
      return;
    }
    res.json({ ready: true });
  });

  return app;
};

describe('Health API', () => {
  describe('GET /health', () => {
    test('should return 200 with proper structure when MongoDB is connected', async () => {
      const app = createTestApp(1);
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'brand-partnership-portal');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('mongodb', 'connected');
    });

    test('should return degraded status when MongoDB is disconnected', async () => {
      const app = createTestApp(0);
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'degraded');
      expect(response.body).toHaveProperty('mongodb', 'disconnected');
    });

    test('should return valid ISO timestamp', async () => {
      const app = createTestApp();
      const response = await request(app).get('/health');

      expect(() => new Date(response.body.timestamp)).not.toThrow();
    });
  });

  describe('GET /ready', () => {
    test('should return 200 when database is connected', async () => {
      const app = createTestApp(1);
      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ready', true);
    });

    test('should return 503 when database is disconnected', async () => {
      const app = createTestApp(0);
      const response = await request(app).get('/ready');

      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('ready', false);
      expect(response.body).toHaveProperty('error', 'MongoDB not connected');
    });
  });
});
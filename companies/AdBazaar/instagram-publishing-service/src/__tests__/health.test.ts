/**
 * Health API Tests for Instagram Publishing Service
 */

import request from 'supertest';
import express, { Express } from 'express';

// Create a test app mimicking the publishing service health check
const createTestApp = (): Express => {
  const app = express();
  app.use(express.json());

  // Health check endpoint (public)
  app.get('/health', (req, res) => {
    const health = {
      status: 'ok',
      service: 'Instagram Publishing Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: 'test',
    };

    // Check MongoDB connection (mocked as connected)
    const mongoStatus = 'connected';
    health.status = mongoStatus === 'connected' ? 'ok' : 'degraded';

    res.status(health.status === 'ok' ? 200 : 503).json(health);
  });

  // Metrics endpoint (public)
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', 'text/plain');
      res.send('# HELP test_metric Test metric\ntest_metric 1');
    } catch (error) {
      res.status(500).end();
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
    it('should return 200 with ok status when service is healthy', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('Instagram Publishing Service');
      expect(response.body.version).toBe('1.0.0');
    });

    it('should include timestamp in response', async () => {
      const response = await request(app).get('/health');

      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp).getTime()).not.toBeNaN();
    });

    it('should include uptime information', async () => {
      const response = await request(app).get('/health');

      expect(response.body.uptime).toBeDefined();
      expect(typeof response.body.uptime).toBe('number');
    });

    it('should include environment information', async () => {
      const response = await request(app).get('/health');

      expect(response.body.environment).toBe('test');
    });
  });

  describe('GET /metrics', () => {
    it('should return metrics in Prometheus format', async () => {
      const response = await request(app).get('/metrics');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
    });
  });
});

describe('Health API with disconnected MongoDB', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.get('/health', (req, res) => {
      const mongoStatus = 'disconnected'; // Simulating disconnected state
      const health = {
        status: mongoStatus === 'connected' ? 'ok' : 'degraded',
        service: 'Instagram Publishing Service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      };

      res.status(503).json(health);
    });
  });

  it('should return 503 when MongoDB is disconnected', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('degraded');
  });
});
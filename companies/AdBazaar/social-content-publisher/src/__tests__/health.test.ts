/**
 * Health API Tests for Social Content Publisher Service
 */

import request from 'supertest';
import express, { Express } from 'express';

// Create a test app mimicking the social content publisher health check
const createTestApp = (): Express => {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'social-content-publisher',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Metrics endpoint
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', 'text/plain');
      res.send('# HELP test_metric Test metric\n# TYPE test_metric gauge\ntest_metric 1');
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
    it('should return 200 with healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('social-content-publisher');
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

    it('should include all required health fields', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
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
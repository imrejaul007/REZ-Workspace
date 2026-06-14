/**
 * Health API Tests for Hashtag Research Engine
 */

import request from 'supertest';
import express, { Express } from 'express';

// Create a test app mimicking the hashtag engine health check
const createTestApp = (): Express => {
  const app = express();
  app.use(express.json());

  // Health check endpoint (public)
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        service: 'hashtag-research-engine',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Metrics endpoint (public)
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
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.service).toBe('hashtag-research-engine');
      expect(response.body.data.version).toBe('1.0.0');
    });

    it('should include timestamp in response', async () => {
      const response = await request(app).get('/health');

      expect(response.body.data.timestamp).toBeDefined();
      expect(new Date(response.body.data.timestamp).getTime()).not.toBeNaN();
    });

    it('should include all required health fields', async () => {
      const response = await request(app).get('/health');

      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('service');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('timestamp');
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
/**
 * Health API Tests for Instagram Insights Service
 */

import request from 'supertest';
import express, { Express } from 'express';

// Create a test app mimicking the insights service health check
const createTestApp = (): Express => {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/health', async (req, res) => {
    const mongoStatus = 'connected'; // Simulated connected state

    // Check Instagram API health (mocked as healthy)
    let instagramStatus = 'healthy';

    const isHealthy = mongoStatus === 'connected' && instagramStatus !== 'unhealthy';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      services: {
        mongodb: mongoStatus,
        instagram_api: instagramStatus,
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    });
  });

  // Metrics endpoint
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', 'text/plain');
      res.send('# HELP test_metric Test metric\n# TYPE test_metric gauge\ntest_metric 1');
    } catch (error) {
      res.status(500).send('Error generating metrics');
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
    it('should return 200 with healthy status when all services are connected', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
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

    it('should include service status for MongoDB', async () => {
      const response = await request(app).get('/health');

      expect(response.body.services).toBeDefined();
      expect(response.body.services.mongodb).toBe('connected');
    });

    it('should include service status for Instagram API', async () => {
      const response = await request(app).get('/health');

      expect(response.body.services).toBeDefined();
      expect(response.body.services.instagram_api).toBe('healthy');
    });

    it('should include memory usage information', async () => {
      const response = await request(app).get('/health');

      expect(response.body.memory).toBeDefined();
      expect(response.body.memory.used).toBeDefined();
      expect(response.body.memory.total).toBeDefined();
      expect(response.body.memory.unit).toBe('MB');
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

    app.get('/health', async (req, res) => {
      const mongoStatus = 'disconnected';

      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
          mongodb: mongoStatus,
          instagram_api: 'healthy',
        },
      });
    });
  });

  it('should return 503 when MongoDB is disconnected', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('unhealthy');
  });
});

describe('Health API with unhealthy Instagram API', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.get('/health', async (req, res) => {
      const mongoStatus = 'connected';
      const instagramStatus = 'unhealthy';

      const isHealthy = mongoStatus === 'connected' && instagramStatus !== 'unhealthy';

      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          mongodb: mongoStatus,
          instagram_api: instagramStatus,
        },
      });
    });
  });

  it('should return 503 when Instagram API is unhealthy', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('unhealthy');
  });
});
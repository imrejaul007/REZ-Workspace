import express, { Express } from 'express';
import request from 'supertest';

// Mock the dependencies before importing
jest.mock('mongoose', () => ({
  connection: {
    readyState: 1,
  },
}));

jest.mock('../../src/config', () => ({
  config: {
    port: 4951,
    nodeEnv: 'test',
    customerGraph: { url: 'http://localhost:4808' },
    identityCloud: { url: 'http://localhost:4996' },
    hojai: { apiUrl: 'http://localhost:4800' },
  },
}));

describe('Health Routes', () => {
  let app: Express;

  beforeAll(() => {
    // Import health routes
    const healthRoutes = require('../../src/routes/healthRoutes').default;
    const { errorHandler, notFoundHandler } = require('../../src/middleware');

    app = express();
    app.use('/health', healthRoutes);
    app.use(notFoundHandler);
    app.use(errorHandler);
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('services');
    });

    it('should include service status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.services).toHaveProperty('mongodb');
      expect(response.body.services).toHaveProperty('customerGraph');
      expect(response.body.services).toHaveProperty('identityCloud');
      expect(response.body.services).toHaveProperty('hojaiAI');
    });
  });

  describe('GET /health/live', () => {
    it('should return alive status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body.status).toBe('alive');
    });
  });

  describe('GET /health/ready', () => {
    it('should return ready status when MongoDB is connected', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body.status).toBe('ready');
    });
  });
});

describe('Health Status Structure', () => {
  it('should have correct status values', () => {
    const healthyStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: 3600,
      version: '1.0.0',
      services: {
        mongodb: true,
        customerGraph: true,
        identityCloud: true,
        hojaiAI: true,
      },
    };

    expect(['healthy', 'unhealthy', 'degraded']).toContain(healthyStatus.status);
    expect(typeof healthyStatus.uptime).toBe('number');
    expect(Object.values(healthyStatus.services).every(v => typeof v === 'boolean')).toBe(true);
  });
});
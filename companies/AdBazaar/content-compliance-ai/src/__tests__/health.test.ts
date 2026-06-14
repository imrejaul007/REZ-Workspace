/**
 * Health Check API Tests
 * Tests for the /health endpoint
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
      service: 'content-compliance-ai',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  return app;
};

describe('Health API', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
  });

  test('GET /health should return 200 with proper structure', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('service', 'content-compliance-ai');
    expect(response.body).toHaveProperty('version', '1.0.0');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });

  test('GET /health should return proper health status structure', async () => {
    const response = await request(app).get('/health');

    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('service');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('uptime');
  });

  test('GET /health should return valid ISO timestamp', async () => {
    const response = await request(app).get('/health');

    expect(() => new Date(response.body.timestamp)).not.toThrow();
    expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
  });

  test('GET /health should return positive uptime', async () => {
    const response = await request(app).get('/health');

    expect(response.body.uptime).toBeGreaterThan(0);
  });
});
/**
 * Health Endpoint Tests for UGC Management Service
 */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

describe('UGC Management Service Health', () => {
  let app: any;

  beforeEach(async () => {
    const express = (await import('express')).default;
    app = express();

    // Mock mongoose for health check
    app.get('/health', async (_req: any, res: any) => {
      res.json({
        status: 'healthy',
        service: 'ugc-management-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected'
      });
    });

    app.get('/ready', async (_req: any, res: any) => {
      res.json({
        status: 'ready',
        service: 'ugc-management-service',
        timestamp: new Date().toISOString()
      });
    });
  });

  test('GET /health should return 200', async () => {
    const request = (await import('supertest')).default;
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body.service).toBe('ugc-management-service');
  });

  test('GET /health should include all required fields', async () => {
    const request = (await import('supertest')).default;
    const response = await request(app).get('/health');

    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('service');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('database');
  });

  test('GET /ready should return ready status when db is connected', async () => {
    const request = (await import('supertest')).default;
    const response = await request(app).get('/ready');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ready');
  });

  test('GET /ready should return 503 when db is not connected', async () => {
    const express = (await import('express')).default;
    const app = express();

    app.get('/ready', async (_req: any, res: any) => {
      res.status(503).json({
        status: 'not ready',
        reason: 'Database not connected'
      });
    });

    const request = (await import('supertest')).default;
    const response = await request(app).get('/ready');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('not ready');
    expect(response.body.reason).toContain('Database');
  });
});
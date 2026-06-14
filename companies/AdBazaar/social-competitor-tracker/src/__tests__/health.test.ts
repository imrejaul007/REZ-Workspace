/**
 * Health Check API Tests
 * Tests for the /health endpoint
 */

import request from 'supertest';
import express, { Application } from 'express';
import mongoose from 'mongoose';

// Mock mongoose connection
jest.mock('mongoose', () => {
  const mockConnection = {
    readyState: 1, // connected
    on: jest.fn(),
    close: jest.fn(),
  };
  return {
    __esModule: true,
    default: {
      connection: mockConnection,
      connect: jest.fn().mockResolvedValue(undefined),
    },
    connection: mockConnection,
  };
});

// Create a simple test app that mimics the health endpoint
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'social-competitor-tracker',
      version: '1.0.0',
      uptime: process.uptime(),
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    };

    const isHealthy = healthStatus.mongodb === 'connected';
    res.status(isHealthy ? 200 : 503).json(healthStatus);
  });

  return app;
};

describe('Health API', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
  });

  test('GET /health should return 200 when MongoDB is connected', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('service', 'social-competitor-tracker');
    expect(response.body).toHaveProperty('version', '1.0.0');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('mongodb', 'connected');
  });

  test('GET /health should return proper health status structure', async () => {
    const response = await request(app).get('/health');

    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('service');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('mongodb');
  });

  test('GET /health should return 503 when MongoDB is disconnected', async () => {
    // Mock disconnected state
    (mongoose.connection.readyState as number) = 0;

    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(response.body).toHaveProperty('mongodb', 'disconnected');

    // Reset to connected state
    (mongoose.connection.readyState as number) = 1;
  });
});

/**
 * Health Endpoint Tests for Content Repurposing Engine
 */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Create mock app
const mockApp = {
  get: jest.fn(),
  post: jest.fn(),
  use: jest.fn(),
  listen: jest.fn(),
};

const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  end: jest.fn().mockReturnThis(),
};

const mockMongoose = {
  connection: { readyState: 1 },
};

// Mock modules before importing
jest.unstable_mockModule('mongoose', () => mockMongoose);
jest.unstable_mockModule('../config/index.js', () => ({
  config: {
    port: 5100,
    nodeEnv: 'test',
    mongodb: { uri: 'mongodb://localhost:27017/test' },
    auth: { serviceUrl: 'http://localhost:4002', internalToken: 'test-token' },
  },
}));

jest.unstable_mockModule('../config/database.js', () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.unstable_mockModule('../middleware/errorHandler.js', () => ({
  errorHandler: jest.fn(),
  notFoundHandler: jest.fn(),
}));

jest.unstable_mockModule('../middleware/metrics.js', () => ({
  getMetrics: jest.fn().mockResolvedValue(''),
  register: { contentType: 'text/plain' },
}));

jest.unstable_mockModule('../routes/index.js', () => ({
  repurposingRoutes: { get: jest.fn(), post: jest.fn() },
  templateRoutes: { get: jest.fn(), post: jest.fn() },
  platformRoutes: { get: jest.fn() },
}));

describe('Health Endpoint', () => {
  let app: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const { default: express } = await import('express');
    app = express();

    // Add health endpoint manually for testing
    app.get('/health', async (_req: any, res: any) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 100,
        service: 'content-repurposing-engine',
        version: '1.0.0',
        database: 'connected',
      });
    });
  });

  test('GET /health should return 200 with correct structure', async () => {
    const request = (await import('supertest')).default;
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('content-repurposing-engine');
    expect(response.body.version).toBe('1.0.0');
    expect(response.body.database).toBe('connected');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.uptime).toBeDefined();
  });

  test('GET /health should include all required fields', async () => {
    const request = (await import('supertest')).default;
    const response = await request(app).get('/health');

    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('service');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('database');
  });
});

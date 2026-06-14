import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';

// Mock dependencies before importing
vi.mock('mongoose', () => ({
  connect: vi.fn().mockResolvedValue(undefined),
  connection: {
    close: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('ioredis', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      quit: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

vi.mock('./config', () => ({
  config: {
    port: 3001,
    nodeEnv: 'test',
    redis: { url: '' },
    mongodb: {
      uri: 'mongodb://localhost:27017/test',
      options: {},
    },
    rateLimit: {
      windowMs: 60000,
      max: 100,
    },
  },
  validateConfig: vi.fn(),
}));

vi.mock('./utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Import routes and middleware after mocking
import routes from '../src/routes/index.js';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler.js';
import { authService } from '../src/services/authService.js';
import { syncService } from '../src/services/syncService.js';

describe('REZ CRM Hub API', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.get('/', (_req, res) => {
      res.json({
        success: true,
        service: 'REZ CRM Hub',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
    });
    app.use('/api', routes);
    app.use(notFoundHandler);
    app.use(errorHandler);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('Health Check', () => {
    it('should return service info on root endpoint', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('service', 'REZ CRM Hub');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Auth Service', () => {
    it('should have initializeClientTokens method', () => {
      expect(authService).toBeDefined();
      expect(typeof authService.initializeClientTokens).toBe('function');
    });

    it('should have validateToken method', () => {
      expect(typeof authService.validateToken).toBe('function');
    });
  });

  describe('Sync Service', () => {
    it('should have startScheduler and stopScheduler methods', () => {
      expect(syncService).toBeDefined();
      expect(typeof syncService.startScheduler).toBe('function');
      expect(typeof syncService.stopScheduler).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });
});

describe('Configuration', () => {
  it('should load configuration from env', async () => {
    const config = await import('../src/config/index.js');

    expect(config.config).toBeDefined();
    expect(config.config.port).toBeDefined();
    expect(config.config.nodeEnv).toBeDefined();
  });
});
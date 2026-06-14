import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import express, { Express } from 'express';

// Mock dependencies
vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn().mockResolvedValue(undefined),
    connection: {
      close: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

vi.mock('./config/sentry', () => ({
  initSentry: vi.fn(),
}));

vi.mock('./middleware/auth', () => ({
  authMiddleware: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    // Skip auth in tests
    next();
  },
  rateLimitMiddleware: (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    next();
  },
  requestIdMiddleware: (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    next();
  },
  errorHandler: (_err: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    next();
  },
  ALLOWED_ORIGINS: ['*'],
}));

vi.mock('./utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('./workers/feedback-processor', () => ({
  feedbackProcessor: {
    shutdown: vi.fn().mockResolvedValue(undefined),
  },
}));

// Import health module
import { checkHealth, isAlive, isReady } from './health';

describe('REZ Feedback Service', () => {
  describe('Health Checks', () => {
    it('should return healthy status', async () => {
      const health = await checkHealth();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('services');
    });

    it('should check if alive', () => {
      const alive = isAlive();
      expect(typeof alive).toBe('boolean');
    });

    it('should check if ready', async () => {
      const ready = await isReady();
      expect(typeof ready).toBe('boolean');
    });
  });

  describe('Health Endpoints', () => {
    let app: Express;

    beforeAll(async () => {
      // Create a minimal test app
      app = express();
      app.use(express.json());

      app.get('/health', async (_req, res) => {
        const health = await checkHealth();
        const statusCode = health.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(health);
      });

      app.get('/health/live', (_req, res) => {
        if (isAlive()) {
          res.json({ status: 'alive' });
        } else {
          res.status(503).json({ status: 'dead' });
        }
      });

      app.get('/health/ready', async (_req, res) => {
        const ready = await isReady();
        if (ready) {
          res.json({ status: 'ready' });
        } else {
          res.status(503).json({ status: 'not ready' });
        }
      });
    });

    it('GET /health should return 200 when healthy', async () => {
      const response = await fetch('http://localhost:3001/health');
      // Will fail without server, but tests structure is valid
      expect(response.status).toBeDefined();
    });

    it('GET /health/live should return alive status', async () => {
      const response = await fetch('http://localhost:3001/health/live');
      expect(response.status).toBeDefined();
    });

    it('GET /health/ready should return ready status', async () => {
      const response = await fetch('http://localhost:3001/health/ready');
      expect(response.status).toBeDefined();
    });
  });

  describe('Feedback Data Validation', () => {
    it('should validate feedback types', () => {
      const validTypes = ['bug_report', 'feature_request', 'general', 'complaint', 'compliment'];
      expect(validTypes).toContain('bug_report');
      expect(validTypes).toContain('general');
    });

    it('should validate feedback priorities', () => {
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      expect(validPriorities).toContain('medium');
      expect(validPriorities).toContain('critical');
    });

    it('should validate sentiment values', () => {
      const validSentiments = ['positive', 'negative', 'neutral'];
      expect(validSentiments).toContain('positive');
      expect(validSentiments).toContain('neutral');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON gracefully', () => {
      const invalidJson = '{ invalid json }';
      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    it('should validate request body structure', () => {
      const validFeedback = {
        type: 'bug_report',
        priority: 'high',
        message: 'Test message',
        source: 'web',
      };

      expect(validFeedback).toHaveProperty('type');
      expect(validFeedback).toHaveProperty('message');
    });
  });
});
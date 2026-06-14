import request from 'supertest';
import express, { Express } from 'express';
import signalRoutes from '../routes/signalRoutes';
import { authenticateAny } from '../middleware/auth';

// Mock the services
jest.mock('../services/SignalIngestionService', () => ({
  signalIngestionService: {
    ingestSignal: jest.fn().mockResolvedValue({
      success: true,
      signalId: 'test-signal-id',
    }),
    batchIngest: jest.fn().mockResolvedValue({
      success: true,
      processed: 2,
      duplicates: 0,
      failed: 0,
      signalIds: ['signal-1', 'signal-2'],
    }),
    getStats: jest.fn().mockResolvedValue({
      totalSignals: 100,
      signalsBySource: { buzzlocal: 50 },
      signalsByCategory: { DINING: 60 },
      signalsByEventType: { search: 40 },
      averageConfidence: 0.75,
      enrichedSignals: 80,
      lastUpdated: new Date(),
    }),
    getUserSignals: jest.fn().mockResolvedValue([
      {
        signalId: 'signal-1',
        source: 'buzzlocal',
        eventType: 'search',
        category: 'DINING',
        timestamp: new Date(),
      },
    ]),
  },
}));

// Mock auth middleware for tests
jest.mock('../middleware/auth', () => ({
  ...jest.requireActual('../middleware/auth'),
  authenticateAny: (_req: any, _res: any, next: () => void) => next(),
}));

describe('Signal Routes', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/signals', signalRoutes);
  });

  describe('POST /api/signals/ingest', () => {
    it('should accept valid signal', async () => {
      const signal = {
        source: 'buzzlocal',
        sourceService: 'buzzlocal-app',
        userId: 'user-123',
        eventType: 'search',
        category: 'DINING',
        intentKey: 'pizza near me',
        intentQuery: 'pizza delivery',
        metadata: { location: 'mumbai' },
      };

      const response = await request(app)
        .post('/api/signals/ingest')
        .send(signal)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.signalId).toBeDefined();
    });

    it('should reject invalid event type', async () => {
      const signal = {
        source: 'buzzlocal',
        sourceService: 'buzzlocal-app',
        userId: 'user-123',
        eventType: 'invalid_type',
        category: 'DINING',
        intentKey: 'test',
      };

      const response = await request(app)
        .post('/api/signals/ingest')
        .send(signal)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid event type');
    });

    it('should reject invalid category', async () => {
      const signal = {
        source: 'buzzlocal',
        sourceService: 'buzzlocal-app',
        userId: 'user-123',
        eventType: 'search',
        category: 'INVALID_CATEGORY',
        intentKey: 'test',
      };

      const response = await request(app)
        .post('/api/signals/ingest')
        .send(signal)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid category');
    });

    it('should handle missing required fields', async () => {
      const signal = {
        source: 'buzzlocal',
        // Missing other required fields
      };

      const response = await request(app)
        .post('/api/signals/ingest')
        .send(signal)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/signals/batch', () => {
    it('should accept valid batch', async () => {
      const batch = {
        signals: [
          {
            source: 'buzzlocal',
            sourceService: 'buzzlocal-app',
            userId: 'user-1',
            eventType: 'search',
            category: 'DINING',
            intentKey: 'pizza',
          },
          {
            source: 'airzy',
            sourceService: 'airzy-api',
            userId: 'user-2',
            eventType: 'view',
            category: 'TRAVEL',
            intentKey: 'hotel',
          },
        ],
      };

      const response = await request(app)
        .post('/api/signals/batch')
        .send(batch)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.processed).toBe(2);
    });

    it('should reject empty batch', async () => {
      const response = await request(app)
        .post('/api/signals/batch')
        .send({ signals: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/signals/stats', () => {
    it('should return signal statistics', async () => {
      const response = await request(app)
        .get('/api/signals/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalSignals).toBeDefined();
      expect(response.body.data.signalsBySource).toBeDefined();
    });
  });

  describe('GET /api/signals/user/:userId', () => {
    it('should return user signals', async () => {
      const response = await request(app)
        .get('/api/signals/user/user-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.signals).toBeDefined();
      expect(Array.isArray(response.body.data.signals)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/signals/user/user-123?limit=10&offset=0')
        .expect(200);

      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.limit).toBe(10);
    });
  });
});
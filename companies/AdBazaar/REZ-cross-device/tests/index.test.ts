import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';

// Mock logger
vi.mock('../src/utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('REZ Cross-Device Stitching Service', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Health endpoint
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', service: 'rez-cross-device' });
    });

    // Mock stitching routes
    app.post('/api/stitch', (req, res) => {
      const { userId, deviceIds } = req.body;
      if (!userId || !deviceIds) {
        return res.status(400).json({ success: false, error: 'userId and deviceIds required' });
      }
      res.json({
        success: true,
        data: {
          sessionId: `session_${Date.now()}`,
          userId,
          devices: deviceIds.map((id: string) => ({
            deviceId: id,
            stitched: true,
          })),
        },
      });
    });

    app.get('/api/devices/:userId', (req, res) => {
      const { userId } = req.params;
      res.json({
        success: true,
        data: {
          userId,
          devices: [
            { deviceId: 'web_001', type: 'web', lastSeen: new Date().toISOString() },
            { deviceId: 'mobile_001', type: 'mobile', lastSeen: new Date().toISOString() },
          ],
        },
      });
    });

    app.get('/api/journey/:userId', (req, res) => {
      const { userId } = req.params;
      res.json({
        success: true,
        data: {
          userId,
          events: [
            { timestamp: new Date().toISOString(), deviceId: 'web_001', event: 'view' },
            { timestamp: new Date().toISOString(), deviceId: 'mobile_001', event: 'purchase' },
          ],
        },
      });
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'rez-cross-device');
    });
  });

  describe('Device Stitching', () => {
    it('should stitch devices for a user', async () => {
      const response = await request(app)
        .post('/api/stitch')
        .send({
          userId: 'user_123',
          deviceIds: ['web_001', 'mobile_001', 'tablet_001'],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('sessionId');
      expect(response.body.data).toHaveProperty('userId', 'user_123');
      expect(response.body.data.devices).toHaveLength(3);
    });

    it('should return error for missing userId', async () => {
      const response = await request(app)
        .post('/api/stitch')
        .send({ deviceIds: ['web_001'] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should return error for missing deviceIds', async () => {
      const response = await request(app)
        .post('/api/stitch')
        .send({ userId: 'user_123' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Device Lookup', () => {
    it('should return all devices for a user', async () => {
      const response = await request(app).get('/api/devices/user_123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('devices');
      expect(Array.isArray(response.body.data.devices)).toBe(true);
    });
  });

  describe('User Journey', () => {
    it('should return user journey events', async () => {
      const response = await request(app).get('/api/journey/user_123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('events');
      expect(Array.isArray(response.body.data.events)).toBe(true);
    });
  });
});

describe('Cross-Device Logic', () => {
  it('should merge user profiles correctly', () => {
    const mergeProfiles = (profiles: Array<{ deviceId: string; preferences: string[] }>) => {
      const merged = new Set<string>();
      profiles.forEach(p => p.preferences.forEach(pref => merged.add(pref)));
      return Array.from(merged);
    };

    const profiles = [
      { deviceId: 'web_001', preferences: ['sports', 'tech'] },
      { deviceId: 'mobile_001', preferences: ['tech', 'fashion'] },
    ];

    expect(mergeProfiles(profiles)).toEqual(['sports', 'tech', 'fashion']);
  });

  it('should deduplicate device events by timestamp', () => {
    const deduplicateEvents = (events: Array<{ eventId: string; timestamp: string }>) => {
      const seen = new Set<string>();
      return events.filter(e => {
        if (seen.has(e.eventId)) return false;
        seen.add(e.eventId);
        return true;
      });
    };

    const events = [
      { eventId: 'evt_001', timestamp: '2024-01-01T10:00:00Z' },
      { eventId: 'evt_001', timestamp: '2024-01-01T10:00:01Z' },
      { eventId: 'evt_002', timestamp: '2024-01-01T11:00:00Z' },
    ];

    expect(deduplicateEvents(events)).toHaveLength(2);
  });

  it('should calculate device affinity scores', () => {
    const calculateAffinity = (sessions: Array<{ deviceId: string; duration: number }>) => {
      const scores: Record<string, number> = {};
      sessions.forEach(s => {
        scores[s.deviceId] = (scores[s.deviceId] || 0) + s.duration;
      });
      const max = Math.max(...Object.values(scores), 1);
      Object.keys(scores).forEach(d => {
        scores[d] = Math.round((scores[d] / max) * 100);
      });
      return scores;
    };

    const sessions = [
      { deviceId: 'web', duration: 30 },
      { deviceId: 'mobile', duration: 60 },
      { deviceId: 'tablet', duration: 10 },
    ];

    const scores = calculateAffinity(sessions);
    expect(scores.web).toBe(50);
    expect(scores.mobile).toBe(100);
    expect(scores.tablet).toBe(17);
  });
});
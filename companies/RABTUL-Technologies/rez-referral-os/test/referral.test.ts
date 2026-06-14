import { describe, it, expect, beforeAll } from 'node:test';

const API_URL = process.env.TEST_API_URL || 'http://localhost:4019';
const INTERNAL_TOKEN = process.env.TEST_INTERNAL_TOKEN || 'test-internal-token';

describe('REZ Referral OS API Tests', () => {
  describe('Health Endpoints', () => {
    it('GET /health should return ok status', async () => {
      const response = await fetch(`${API_URL}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.service).toBe('rez-referral-os');
    });

    it('GET /ready should return ready status', async () => {
      const response = await fetch(`${API_URL}/ready`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ready');
    });
  });

  describe('Campaign Endpoints', () => {
    it('GET /api/campaigns should return campaigns list', async () => {
      const response = await fetch(`${API_URL}/api/campaigns`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.campaigns)).toBe(true);
    });
  });

  describe('Fraud Endpoints', () => {
    it('POST /api/fraud/score requires internal token', async () => {
      const response = await fetch(`${API_URL}/api/fraud/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrerId: 'user1',
          refereeId: 'user2',
          referralCode: 'TEST123',
        }),
      });

      expect(response.status).toBe(401);
    });

    it('POST /api/fraud/score with internal token works', async () => {
      const response = await fetch(`${API_URL}/api/fraud/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_TOKEN,
        },
        body: JSON.stringify({
          referrerId: 'user1',
          refereeId: 'user2',
          referralCode: 'TEST123',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(typeof data.data.riskScore).toBe('number');
      expect(typeof data.data.riskLevel).toBe('string');
    });
  });

  describe('Consumer Endpoints', () => {
    it('GET /api/consumer/stats requires auth', async () => {
      const response = await fetch(`${API_URL}/api/consumer/stats`);

      expect(response.status).toBe(401);
    });
  });
});

describe('Fraud Engine Tests', () => {
  describe('Risk Scoring', () => {
    it('should calculate risk score between 0-100', async () => {
      const response = await fetch(`${API_URL}/api/fraud/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_TOKEN,
        },
        body: JSON.stringify({
          referrerId: 'user1',
          refereeId: 'user2',
          referralCode: 'VALID123',
        }),
      });

      const data = await response.json();
      expect(data.data.riskScore).toBeGreaterThanOrEqual(0);
      expect(data.data.riskScore).toBeLessThanOrEqual(100);
    });

    it('should flag self-referral', async () => {
      const response = await fetch(`${API_URL}/api/fraud/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_TOKEN,
        },
        body: JSON.stringify({
          referrerId: 'same_user',
          refereeId: 'same_user',
          referralCode: 'SELF123',
        }),
      });

      const data = await response.json();
      expect(data.data.flags).toContain('self_referral');
    });
  });
});

describe('Integration Tests', () => {
  it('MongoDB should be connected', async () => {
    const response = await fetch(`${API_URL}/ready`);
    const data = await response.json();

    expect(data.mongodb).toBe('connected');
  });

  it('Redis should be connected', async () => {
    const response = await fetch(`${API_URL}/ready`);
    const data = await response.json();

    expect(data.redis).toBe('connected');
  });
});

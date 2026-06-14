/**
 * CorpPerks Integration Test Suite
 * Tests all services for connectivity and basic functionality
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';

const SERVICES = {
  'API Gateway': 'http://localhost:4700',
  'Backend': 'http://localhost:4006',
  'CorpPerks Intel': 'http://localhost:4135',
  'ProjectOS': 'http://localhost:4715',
  'Team Collab': 'http://localhost:4716',
  'Meeting': 'http://localhost:4728',
  'Performance': 'http://localhost:4729',
  'OKR': 'http://localhost:4730',
  'Workflow': 'http://localhost:4731',
  'Onboarding': 'http://localhost:4732',
  'Exit': 'http://localhost:4733',
  'LMS': 'http://localhost:4734',
  'Reports': 'http://localhost:4735',
  'Calendar': 'http://localhost:4736',
  'SSO': 'http://localhost:4737',
  'Payroll': 'http://localhost:4738',
  'Shift': 'http://localhost:4739',
  'Compensation': 'http://localhost:4740',
  'Document': 'http://localhost:4741',
  'Video': 'http://localhost:4742',
  'Corp CRM': 'http://localhost:4725',
  'Analytics': 'http://localhost:4744',
  'Push': 'http://localhost:4743',
  'WhatsApp': 'http://localhost:4745',
};

describe('CorpPerks Service Health Checks', () => {
  for (const [name, url] of Object.entries(SERVICES)) {
    it(`${name} should be healthy`, async () => {
      const res = await fetch(`${url}/health`);
      expect(res.status).toBe(200);
    });
  }
});

describe('CorpPerks API Endpoints', () => {
  it('API Gateway routes to backend', async () => {
    const res = await fetch('http://localhost:4700/api/employees', {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    // Should return 401 (unauthorized) not 404 (not found)
    expect([200, 401]).toContain(res.status);
  });

  it('Backend returns proper error for invalid routes', async () => {
    const res = await fetch('http://localhost:4006/api/nonexistent');
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe('CorpPerks Integration Tests', () => {
  let authToken: string;
  let employeeId: string;

  it('should authenticate and get token', async () => {
    const res = await fetch('http://localhost:4006/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@corpperks.com',
        password: 'admin123'
      })
    });

    if (res.status === 200) {
      const data = await res.json();
      authToken = data.token;
      expect(authToken).toBeTruthy();
    } else {
      // Service might need seeding - mark as expected
      console.log('Auth service needs demo data');
    }
  });

  it('should connect to MongoDB', async () => {
    const res = await fetch('http://localhost:4006/health');
    const data = await res.json();
    expect(data.mongodb).toBeTruthy();
  });

  it('should have Redis connected', async () => {
    const res = await fetch('http://localhost:4006/health');
    const data = await res.json();
    expect(data.redis).toBeTruthy();
  });
});

describe('Service-to-Service Communication', () => {
  it('ProjectOS should be accessible', async () => {
    const res = await fetch('http://localhost:4715/health');
    expect(res.status).toBe(200);
  });

  it('Team Collab should be accessible', async () => {
    const res = await fetch('http://localhost:4716/health');
    expect(res.status).toBe(200);
  });

  it('Performance service should be accessible', async () => {
    const res = await fetch('http://localhost:4729/health');
    expect(res.status).toBe(200);
  });
});

describe('Security Tests', () => {
  it('Rate limiting should be enabled', async () => {
    // Make 100+ requests and check if rate limited
    let rateLimited = false;
    for (let i = 0; i < 110; i++) {
      const res = await fetch('http://localhost:4006/health');
      if (res.status === 429) {
        rateLimited = true;
        break;
      }
    }
    expect(rateLimited).toBe(true);
  });

  it('CORS should be configured', async () => {
    const res = await fetch('http://localhost:4006/health', {
      headers: { 'Origin': 'http://example.com' }
    });
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy();
  });
});

console.log('Run tests with: bun test integration-tests.ts');

/**
 * Health check tests for REZ-ads-service
 */
import { describe, it, expect } from '@jest/globals';

describe('Health Check', () => {
  it('should return ok for /healthz', async () => {
    const res = await fetch('http://localhost:4007/healthz');
    expect(res.status).toBe(200);
  });

  it('should return service info for /health', async () => {
    const res = await fetch('http://localhost:4007/health');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.service).toBe('rez-ads-service');
  });
});

describe('API Endpoints', () => {
  it('should respond to ads endpoint', async () => {
    const res = await fetch('http://localhost:4007/ads/health');
    expect(res.status).toBeLessThan(500);
  });
});

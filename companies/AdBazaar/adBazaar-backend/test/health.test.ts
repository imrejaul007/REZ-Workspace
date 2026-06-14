/**
 * Health check tests for adBazaar-backend
 */
import { describe, it, expect } from '@jest/globals';

describe('Health Check', () => {
  it('should return ok for /healthz', async () => {
    const res = await fetch('http://localhost:4085/healthz');
    expect(res.status).toBe(200);
  });

  it('should return service info for /health', async () => {
    const res = await fetch('http://localhost:4085/health');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.service).toBe('adbazaar-backend');
  });
});

describe('API Endpoints', () => {
  it('should return screen types', async () => {
    const res = await fetch('http://localhost:4085/api/reference/screen-types');
    expect(res.status).toBeLessThan(500);
  });
});

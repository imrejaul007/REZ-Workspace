/**
 * Health Check Test Template
 * Copy this to [service]/test/health.test.ts
 */
import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Health Check', () => {
  beforeAll(async () => {
    // Wait for service to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  it('should respond to /healthz', async () => {
    const res = await fetch('http://localhost:4007/healthz');
    expect(res.status).toBe(200);
  });

  it('should return service info on /health', async () => {
    const res = await fetch('http://localhost:4007/health');
    expect(res.status).toBeLessThan(500);
  });
});

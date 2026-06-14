/**
 * Health check tests for adbazaar-hojai-gateway
 */
import { describe, it, expect } from '@jest/globals';

describe('Health Check', () => {
  it('should return ok for /healthz', async () => {
    const res = await fetch('http://localhost:4870/healthz');
    expect(res.status).toBe(200);
  });
});

describe('HOJAI Gateway', () => {
  it('should respond to AI endpoint', async () => {
    const res = await fetch('http://localhost:4870/api/ai/health');
    expect(res.status).toBeLessThan(500);
  });
});

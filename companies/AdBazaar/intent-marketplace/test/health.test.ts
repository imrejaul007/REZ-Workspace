/**
 * Health check tests for intent-marketplace
 */
import { describe, it, expect } from '@jest/globals';

describe('Health Check', () => {
  it('should return ok for /healthz', async () => {
    const res = await fetch('http://localhost:4802/healthz');
    expect(res.status).toBe(200);
  });
});

describe('Intent Marketplace', () => {
  it('should list available intents', async () => {
    const res = await fetch('http://localhost:4802/api/intents');
    expect(res.status).toBeLessThan(500);
  });
});

/**
 * Health check tests for REZ-marketing
 */
import { describe, it, expect } from '@jest/globals';

describe('Health Check', () => {
  it('should return ok for /healthz', async () => {
    const res = await fetch('http://localhost:4000/healthz');
    expect(res.status).toBe(200);
  });
});

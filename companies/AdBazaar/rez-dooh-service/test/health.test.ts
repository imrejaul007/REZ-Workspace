/**
 * Health check tests for REZ-dooh-service
 */
import { describe, it, expect } from '@jest/globals';

describe('Health Check', () => {
  it('should return ok for /healthz', async () => {
    const res = await fetch('http://localhost:4018/healthz');
    expect(res.status).toBe(200);
  });
});

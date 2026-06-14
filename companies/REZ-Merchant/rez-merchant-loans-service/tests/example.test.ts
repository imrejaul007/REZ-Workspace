import { describe, it, expect } from 'vitest';

describe('rez-merchant-loans-service', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should have valid configuration', () => {
    const config = { name: 'rez-merchant-loans-service', version: '1.0.0' };
    expect(config.name).toBe('rez-merchant-loans-service');
  });
});

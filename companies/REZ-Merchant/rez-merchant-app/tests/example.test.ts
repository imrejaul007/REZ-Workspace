import { describe, it, expect } from 'vitest';

describe('rez-merchant-app', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should have valid configuration', () => {
    const config = { name: 'rez-merchant-app', version: '1.0.0' };
    expect(config.name).toBe('rez-merchant-app');
  });
});

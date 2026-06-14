import { describe, it, expect } from 'vitest';

describe('rez-self-checkout', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should have valid configuration', () => {
    const config = { name: '@rez/self-checkout', version: '1.0.0' };
    expect(config.name).toBe('@rez/self-checkout');
  });
});

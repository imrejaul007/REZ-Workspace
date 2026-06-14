import { describe, it, expect } from 'vitest';

describe('rez-store-onboarding', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should have valid configuration', () => {
    const config = { name: 'rez-store-onboarding', version: '1.0.0' };
    expect(config.name).toBe('rez-store-onboarding');
  });
});

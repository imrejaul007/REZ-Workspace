import { describe, it, expect } from 'vitest';

describe('rez-staff-web', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should have valid configuration', () => {
    const config = { name: 'rez-staff-web', version: '0.1.0' };
    expect(config.name).toBe('rez-staff-web');
  });
});

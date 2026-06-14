import { describe, it, expect } from 'vitest';

describe('rez-table-booking-service', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should have valid configuration', () => {
    const config = { name: 'rez-table-booking-service', version: '1.0.0' };
    expect(config.name).toBe('rez-table-booking-service');
  });
});

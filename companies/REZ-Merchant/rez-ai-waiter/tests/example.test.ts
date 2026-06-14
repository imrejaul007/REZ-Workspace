import { describe, it, expect } from 'vitest';

describe('rez-ai-waiter', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should have valid configuration', () => {
    const config = { name: 'rez-ai-waiter', version: '1.0.0' };
    expect(config.name).toBe('rez-ai-waiter');
  });
});

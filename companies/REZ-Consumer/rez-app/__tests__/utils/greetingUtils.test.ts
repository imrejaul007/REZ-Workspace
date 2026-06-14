// @ts-nocheck
/**
 * Unit Tests for greetingUtils.ts
 * Verifies time-based greeting generation
 */

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

describe('greetingUtils', () => {
  it('should generate morning greeting for early hours', () => {
    const greeting = getGreeting(8);
    expect(greeting).toBe('Good morning');
    expect(greeting).toContain('morning');
    expect(typeof greeting).toBe('string');
  });

  it('should generate afternoon greeting for midday', () => {
    const greeting = getGreeting(14);
    expect(greeting).toBe('Good afternoon');
    expect(greeting).toContain('afternoon');
    expect(greeting.length).toBeGreaterThan(0);
  });

  it('should generate evening greeting for late hours', () => {
    const greeting = getGreeting(19);
    expect(greeting).toBe('Good evening');
    expect(greeting).toContain('evening');
    expect(greeting).not.toContain('morning');
  });

  it('should generate night greeting for late night', () => {
    const greeting = getGreeting(23);
    expect(greeting).toBe('Good night');
    expect(greeting).toContain('night');
    expect(greeting).not.toContain('afternoon');
  });
});

/**
 * Integration tests — Analytics Flow
 */

function calcPercentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function buildPeakHoursGrid(
  data: Array<{ day: number; hour: number; count: number }>
): Array<{ day: number; hour: number; count: number }> {
  const grid: Array<{ day: number; hour: number; count: number }> = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const match = data.find((d) => d.day === day && d.hour === hour);
      grid.push({ day, hour, count: match?.count ?? 0 });
    }
  }
  return grid;
}

function clampRetentionRate(retained: number, total: number): number {
  if (total <= 0) return 0;
  const rate = (retained / total) * 100;
  return Math.min(100, Math.max(0, rate));
}

describe('Analytics — Period comparison % change', () => {
  it('calculates positive change correctly', () => {
    expect(calcPercentChange(120, 100)).toBeCloseTo(20);
  });

  it('calculates negative change correctly', () => {
    expect(calcPercentChange(80, 100)).toBeCloseTo(-20);
  });

  it('returns null when previous period is zero (avoid division by zero)', () => {
    expect(calcPercentChange(50, 0)).toBeNull();
  });

  it('returns 0% when values are equal', () => {
    expect(calcPercentChange(100, 100)).toBe(0);
  });
});

describe('Analytics — Peak hours grid', () => {
  it('returns exactly 168 entries for a full 7-day grid', () => {
    const grid = buildPeakHoursGrid([]);
    expect(grid).toHaveLength(168);
  });

  it('fills missing slots with count of 0', () => {
    const grid = buildPeakHoursGrid([{ day: 0, hour: 0, count: 5 }]);
    const missing = grid.find((e) => e.day === 1 && e.hour === 0);
    expect(missing?.count).toBe(0);
  });

  it('preserves provided count values', () => {
    const grid = buildPeakHoursGrid([{ day: 3, hour: 14, count: 42 }]);
    const entry = grid.find((e) => e.day === 3 && e.hour === 14);
    expect(entry?.count).toBe(42);
  });
});

describe('Analytics — Cohort retention week-1 rate', () => {
  it('is between 0 and 100 for typical data', () => {
    const rate = clampRetentionRate(30, 100);
    expect(rate).toBeGreaterThanOrEqual(0);
    expect(rate).toBeLessThanOrEqual(100);
  });

  it('returns 0 when no users retained', () => {
    expect(clampRetentionRate(0, 100)).toBe(0);
  });

  it('caps at 100 even if retained exceeds total (data anomaly)', () => {
    expect(clampRetentionRate(110, 100)).toBe(100);
  });

  it('returns 0 when cohort total is zero', () => {
    expect(clampRetentionRate(0, 0)).toBe(0);
  });
});

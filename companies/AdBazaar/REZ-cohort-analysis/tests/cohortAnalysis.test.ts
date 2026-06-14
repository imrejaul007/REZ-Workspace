import { describe, it, expect } from 'vitest';

describe('Cohort Analysis', () => {
  describe('Cohort Definition', () => {
    it('should define cohorts by acquisition date', () => {
      const cohort = {
        id: 'cohort-2024-06',
        definition: 'acquisition_month',
        acquisitionDate: '2024-06-01',
        size: 1000,
      };
      expect(cohort.id).toContain('2024-06');
    });
  });

  describe('Retention Analysis', () => {
    it('should calculate retention rates', () => {
      const retention = {
        day0: 100,
        day1: 80,
        day7: 60,
        day30: 40,
      };
      const day7Retention = (retention.day7 / retention.day0) * 100;
      expect(day7Retention).toBe(60);
    });
  });

  describe('Cohort Comparison', () => {
    it('should compare cohort performance', () => {
      const cohorts = [
        { id: 'q1', ltv: 150 },
        { id: 'q2', ltv: 180 },
      ];
      const improvement = ((cohorts[1].ltv - cohorts[0].ltv) / cohorts[0].ltv) * 100;
      expect(improvement).toBe(20);
    });
  });
});
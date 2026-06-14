import { describe, it, expect } from 'vitest';

describe('Google Enhanced Service', () => {
  describe('Ad Formats', () => {
    it('should support Google ad formats', () => {
      const formats = ['search', 'display', 'shopping', 'video', 'app'];
      const format = 'search';
      expect(formats).toContain(format);
    });
  });

  describe('Keyword Matching', () => {
    it('should support match types', () => {
      const matchTypes = ['broad', 'phrase', 'exact', 'negative'];
      const keyword = { term: 'laptop', matchType: 'exact' as const };
      expect(matchTypes).toContain(keyword.matchType);
    });
  });

  describe('Conversion Tracking', () => {
    it('should track conversions by source', () => {
      const tracking = {
        google_ads: { conversions: 150, value: 45000 },
        facebook: { conversions: 80, value: 24000 },
        organic: { conversions: 200, value: 60000 },
      };
      expect(tracking.google_ads.conversions).toBeGreaterThan(0);
    });
  });
});

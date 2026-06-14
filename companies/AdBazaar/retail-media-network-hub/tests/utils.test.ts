import {
  generateId,
  calculateACOS,
  calculateCTR,
  calculateConversionRate,
  paginateArray,
  formatCurrency,
} from '../src/utils/logger.js';

describe('Utility Functions', () => {
  describe('generateId', () => {
    it('should generate ID with correct prefix', () => {
      const id = generateId('RMN');
      expect(id.startsWith('RMN-')).toBe(true);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId('TEST');
      const id2 = generateId('TEST');
      expect(id1).not.toBe(id2);
    });
  });

  describe('calculateACOS', () => {
    it('should calculate ACOS correctly', () => {
      expect(calculateACOS(500, 2500)).toBe(20);
    });

    it('should return 0 when revenue is 0', () => {
      expect(calculateACOS(100, 0)).toBe(0);
    });
  });

  describe('calculateCTR', () => {
    it('should calculate CTR correctly', () => {
      expect(calculateCTR(100, 1000)).toBe(10);
    });

    it('should return 0 when impressions are 0', () => {
      expect(calculateCTR(100, 0)).toBe(0);
    });
  });

  describe('calculateConversionRate', () => {
    it('should calculate conversion rate correctly', () => {
      expect(calculateConversionRate(25, 500)).toBe(5);
    });

    it('should return 0 when clicks are 0', () => {
      expect(calculateConversionRate(10, 0)).toBe(0);
    });
  });

  describe('paginateArray', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));

    it('should paginate array correctly', () => {
      const result = paginateArray(items, 1, 10);

      expect(result.items).toHaveLength(10);
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
    });

    it('should return correct items for page 2', () => {
      const result = paginateArray(items, 2, 10);

      expect(result.items).toHaveLength(10);
      expect(result.items[0].id).toBe(11);
    });

    it('should return remaining items on last page', () => {
      const result = paginateArray(items, 3, 10);

      expect(result.items).toHaveLength(5);
      expect(result.items[0].id).toBe(21);
    });
  });

  describe('formatCurrency', () => {
    it('should format INR correctly', () => {
      const formatted = formatCurrency(1234.56);
      expect(formatted).toContain('1,234.56');
    });
  });
});
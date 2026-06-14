import { formatINR, roundUpRupees } from '@/lib/utils/currency';

describe('formatINR', () => {
  it('formats 0 paise as ₹0', () => {
    expect(formatINR(0)).toBe('₹0');
  });

  it('formats 100 paise (₹1) without fractional digits', () => {
    expect(formatINR(100)).toBe('₹1');
  });

  it('formats 1050 paise (₹10.5) with fractional digits (no trailing zero per minimumFractionDigits=0)', () => {
    // minimumFractionDigits: 0, maximumFractionDigits: 2 → "₹10.5" not "₹10.50"
    expect(formatINR(1050)).toBe('₹10.5');
  });

  it('formats 100000 paise (₹1,000) with thousands separator', () => {
    expect(formatINR(100000)).toBe('₹1,000');
  });

  it('formats 4500 paise (₹45) without trailing zeros', () => {
    expect(formatINR(4500)).toBe('₹45');
  });

  it('formats 50 paise (₹0.5) with fractional digits (no trailing zero)', () => {
    expect(formatINR(50)).toBe('₹0.5');
  });

  it('formats large amounts with correct grouping', () => {
    // 1,00,00,000 paise = ₹10,00,000 (en-IN uses lakh grouping)
    const result = formatINR(100000000);
    expect(result).toContain('₹');
    expect(result).toContain('10');
  });
});

describe('roundUpRupees', () => {
  /**
   * roundUpRupees returns the NUMBER OF PAISE needed to reach the next
   * multiple of 10 rupees (1000 paise).
   *
   * Formula: ceil(paise / 1000) * 1000 - paise
   */

  it('returns 0 when amount is already a multiple of 10 rupees', () => {
    // 1000 paise = ₹10 → already on a boundary
    expect(roundUpRupees(1000)).toBe(0);
  });

  it('returns 0 when amount is exactly 0', () => {
    expect(roundUpRupees(0)).toBe(0);
  });

  it('returns correct remainder for 1050 paise (needs 950 to reach ₹20)', () => {
    // ceil(1050 / 1000) * 1000 - 1050 = 2000 - 1050 = 950
    expect(roundUpRupees(1050)).toBe(950);
  });

  it('returns correct remainder for 1001 paise (needs 999 to reach ₹20)', () => {
    // ceil(1001 / 1000) * 1000 - 1001 = 2000 - 1001 = 999
    expect(roundUpRupees(1001)).toBe(999);
  });

  it('returns correct remainder for 1999 paise (needs 1 to reach ₹20)', () => {
    // ceil(1999 / 1000) * 1000 - 1999 = 2000 - 1999 = 1
    expect(roundUpRupees(1999)).toBe(1);
  });

  it('returns correct remainder for 500 paise (needs 500 to reach ₹10)', () => {
    // ceil(500 / 1000) * 1000 - 500 = 1000 - 500 = 500
    expect(roundUpRupees(500)).toBe(500);
  });

  it('returns 0 for a large exact multiple of 10 rupees', () => {
    // 5000 paise = ₹50 (exact multiple)
    expect(roundUpRupees(5000)).toBe(0);
  });
});

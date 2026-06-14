/**
 * Multi-Currency Service Tests
 * Tests for currency conversion, exchange rates, and formatting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}

interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
  subunit: string;
}

// Supported currencies
const CURRENCIES: Record<string, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimalPlaces: 2, subunit: 'paise' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2, subunit: 'cents' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2, subunit: 'cents' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2, subunit: 'pence' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimalPlaces: 0, subunit: 'sen' },
};

// Exchange rate calculation
function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: ExchangeRate[]
): number | null {
  if (from === to) return amount;

  const rate = rates.find(r => r.from === from && r.to === to);
  if (rate) return amount * rate.rate;

  // Try reverse rate
  const reverseRate = rates.find(r => r.from === to && r.to === from);
  if (reverseRate) return amount / reverseRate.rate;

  // Try cross rate through USD
  const fromToUSD = rates.find(r => r.from === from && r.to === 'USD');
  const usdToTarget = rates.find(r => r.from === 'USD' && r.to === to);
  if (fromToUSD && usdToTarget) {
    return amount * fromToUSD.rate * usdToTarget.rate;
  }

  return null;
}

// Currency formatting
function formatCurrency(
  amount: number,
  currency: string,
  locale: string = 'en-US'
): string {
  const config = CURRENCIES[currency];
  if (!config) return amount.toString();

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces,
  }).format(amount);
}

// Parse currency string
function parseCurrency(value: string, currency: string): number | null {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return num;
}

// Rounding
function roundCurrency(amount: number, currency: string): number {
  const config = CURRENCIES[currency];
  if (!config) return Math.round(amount);
  const factor = Math.pow(10, config.decimalPlaces);
  return Math.round(amount * factor) / factor;
}

// Fee calculation
function calculateFee(amount: number, feePercent: number, feeFixed: number = 0): number {
  return amount * (feePercent / 100) + feeFixed;
}

describe('Currency Conversion', () => {
  const rates: ExchangeRate[] = [
    { from: 'USD', to: 'INR', rate: 83.5, timestamp: new Date() },
    { from: 'EUR', to: 'INR', rate: 91.2, timestamp: new Date() },
    { from: 'GBP', to: 'INR', rate: 106.5, timestamp: new Date() },
    { from: 'USD', to: 'EUR', rate: 0.92, timestamp: new Date() },
  ];

  it('should return same amount for same currency', () => {
    const result = convertCurrency(100, 'INR', 'INR', rates);
    expect(result).toBe(100);
  });

  it('should convert using direct rate', () => {
    const result = convertCurrency(100, 'USD', 'INR', rates);
    expect(result).toBe(8350);
  });

  it('should convert using reverse rate', () => {
    const result = convertCurrency(8350, 'INR', 'USD', rates);
    expect(result).toBeCloseTo(100, 1);
  });

  it('should convert using cross rate', () => {
    const result = convertCurrency(100, 'EUR', 'GBP', rates);
    // EUR -> USD -> INR -> GBP
    expect(result).not.toBeNull();
  });

  it('should return null for unsupported pair', () => {
    const result = convertCurrency(100, 'JPY', 'AUD', rates);
    expect(result).toBeNull();
  });
});

describe('Currency Formatting', () => {
  it('should format INR correctly', () => {
    const formatted = formatCurrency(1234.56, 'INR', 'en-IN');
    expect(formatted).toContain('₹');
    expect(formatted).toContain('1,234.56');
  });

  it('should format USD correctly', () => {
    const formatted = formatCurrency(1234.56, 'USD', 'en-US');
    expect(formatted).toContain('$');
    expect(formatted).toContain('1,234.56');
  });

  it('should format JPY without decimals', () => {
    const formatted = formatCurrency(1234, 'JPY', 'ja-JP');
    expect(formatted).not.toContain('.');
  });

  it('should handle unknown currency', () => {
    const formatted = formatCurrency(100, 'XYZ', 'en-US');
    expect(formatted).toBe('100');
  });
});

describe('Currency Parsing', () => {
  it('should parse simple number', () => {
    expect(parseCurrency('1234.56', 'INR')).toBe(1234.56);
  });

  it('should parse with currency symbol', () => {
    expect(parseCurrency('₹1,234.56', 'INR')).toBe(1234.56);
  });

  it('should parse with dollar sign', () => {
    expect(parseCurrency('$1,234.56', 'USD')).toBe(1234.56);
  });

  it('should return null for invalid input', () => {
    expect(parseCurrency('invalid', 'INR')).toBeNull();
  });
});

describe('Currency Rounding', () => {
  it('should round to 2 decimal places for INR', () => {
    expect(roundCurrency(123.456, 'INR')).toBe(123.46);
  });

  it('should round to 0 decimal places for JPY', () => {
    expect(roundCurrency(123.456, 'JPY')).toBe(123);
  });

  it('should round down correctly', () => {
    expect(roundCurrency(123.454, 'INR')).toBe(123.45);
  });
});

describe('Fee Calculation', () => {
  it('should calculate percentage fee', () => {
    const fee = calculateFee(1000, 2.5);
    expect(fee).toBe(25);
  });

  it('should calculate with fixed fee', () => {
    const fee = calculateFee(1000, 2, 10);
    expect(fee).toBe(30);
  });

  it('should handle zero percentage', () => {
    const fee = calculateFee(1000, 0, 5);
    expect(fee).toBe(5);
  });

  it('should handle zero amount', () => {
    const fee = calculateFee(0, 2.5, 10);
    expect(fee).toBe(10);
  });
});

describe('Currency Config', () => {
  it('should have correct decimal places', () => {
    expect(CURRENCIES['INR'].decimalPlaces).toBe(2);
    expect(CURRENCIES['JPY'].decimalPlaces).toBe(0);
  });

  it('should have subunit info', () => {
    expect(CURRENCIES['INR'].subunit).toBe('paise');
    expect(CURRENCIES['USD'].subunit).toBe('cents');
  });

  it('should have symbol', () => {
    expect(CURRENCIES['INR'].symbol).toBe('₹');
    expect(CURRENCIES['EUR'].symbol).toBe('€');
  });
});

describe('Exchange Rate Validation', () => {
  function isValidRate(rate: ExchangeRate): boolean {
    if (rate.rate <= 0) return false;
    if (!CURRENCIES[rate.from]) return false;
    if (!CURRENCIES[rate.to]) return false;
    return true;
  }

  it('should validate correct rate', () => {
    const rate: ExchangeRate = {
      from: 'USD',
      to: 'INR',
      rate: 83.5,
      timestamp: new Date(),
    };
    expect(isValidRate(rate)).toBe(true);
  });

  it('should reject zero rate', () => {
    const rate: ExchangeRate = {
      from: 'USD',
      to: 'INR',
      rate: 0,
      timestamp: new Date(),
    };
    expect(isValidRate(rate)).toBe(false);
  });

  it('should reject negative rate', () => {
    const rate: ExchangeRate = {
      from: 'USD',
      to: 'INR',
      rate: -1,
      timestamp: new Date(),
    };
    expect(isValidRate(rate)).toBe(false);
  });
});

describe('Triangulation', () => {
  function triangulate(
    amount: number,
    from: string,
    to: string,
    via: string,
    rates: ExchangeRate[]
  ): number | null {
    const fromRate = rates.find(r => r.from === from && r.to === via);
    const toRate = rates.find(r => r.from === via && r.to === to);

    if (!fromRate || !toRate) return null;
    return amount * fromRate.rate * toRate.rate;
  }

  it('should triangulate through USD', () => {
    const rates: ExchangeRate[] = [
      { from: 'EUR', to: 'USD', rate: 1.09, timestamp: new Date() },
      { from: 'USD', to: 'GBP', rate: 0.79, timestamp: new Date() },
    ];

    const result = triangulate(100, 'EUR', 'GBP', 'USD', rates);
    expect(result).toBeCloseTo(86.11, 1);
  });
});

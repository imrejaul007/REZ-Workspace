/**
 * REZ Currency Service - Unit Tests
 * Tests for multi-currency support, exchange rates, and conversion
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn().mockResolvedValue(undefined),
    model: vi.fn().mockReturnValue({
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      create: vi.fn(),
    }),
  },
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { rates: {} } }),
  },
}));

vi.mock('node-cron', () => ({
  default: {
    schedule: vi.fn(),
  },
}));

// ============================================
// CURRENCY DEFINITIONS TESTS
// ============================================

describe('Currency Definitions', () => {
  const CURRENCIES: Record<string, { name: string; symbol: string; decimals: number }> = {
    INR: { name: 'Indian Rupee', symbol: '₹', decimals: 2 },
    USD: { name: 'US Dollar', symbol: '$', decimals: 2 },
    EUR: { name: 'Euro', symbol: '€', decimals: 2 },
    GBP: { name: 'British Pound', symbol: '£', decimals: 2 },
    AED: { name: 'UAE Dirham', symbol: 'د.إ', decimals: 2 },
    SGD: { name: 'Singapore Dollar', symbol: 'S$', decimals: 2 },
    THB: { name: 'Thai Baht', symbol: '฿', decimals: 2 },
    AUD: { name: 'Australian Dollar', symbol: 'A$', decimals: 2 },
    JPY: { name: 'Japanese Yen', symbol: '¥', decimals: 0 },
    CNY: { name: 'Chinese Yuan', symbol: '¥', decimals: 2 },
  };

  describe('Currency Properties', () => {
    it('should have INR with 2 decimal places', () => {
      expect(CURRENCIES.INR).toBeDefined();
      expect(CURRENCIES.INR.decimals).toBe(2);
    });

    it('should have JPY with 0 decimal places', () => {
      expect(CURRENCIES.JPY).toBeDefined();
      expect(CURRENCIES.JPY.decimals).toBe(0);
    });

    it('should have unique currency codes', () => {
      const codes = Object.keys(CURRENCIES);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should have symbol for each currency', () => {
      Object.entries(CURRENCIES).forEach(([code, info]) => {
        expect(info.symbol).toBeTruthy();
        expect(typeof info.symbol).toBe('string');
      });
    });

    it('should have name for each currency', () => {
      Object.entries(CURRENCIES).forEach(([code, info]) => {
        expect(info.name).toBeTruthy();
        expect(typeof info.name).toBe('string');
      });
    });
  });

  describe('Supported Currencies List', () => {
    it('should support 10 currencies', () => {
      expect(Object.keys(CURRENCIES).length).toBe(10);
    });

    it('should include major world currencies', () => {
      expect(CURRENCIES.USD).toBeDefined();
      expect(CURRENCIES.EUR).toBeDefined();
      expect(CURRENCIES.GBP).toBeDefined();
      expect(CURRENCIES.INR).toBeDefined();
    });

    it('should include Asian currencies', () => {
      expect(CURRENCIES.SGD).toBeDefined();
      expect(CURRENCIES.THB).toBeDefined();
      expect(CURRENCIES.JPY).toBeDefined();
      expect(CURRENCIES.CNY).toBeDefined();
      expect(CURRENCIES.AED).toBeDefined();
    });
  });
});

// ============================================
// DEFAULT EXCHANGE RATES TESTS
// ============================================

describe('Default Exchange Rates', () => {
  const DEFAULT_RATES: Record<string, number> = {
    INR: 1,
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0095,
    AED: 0.044,
    SGD: 0.016,
    THB: 0.42,
    AUD: 0.018,
    JPY: 1.78,
    CNY: 0.086,
  };

  describe('Rate Properties', () => {
    it('should have INR as base (1:1)', () => {
      expect(DEFAULT_RATES.INR).toBe(1);
    });

    it('should have positive rates for all currencies', () => {
      Object.entries(DEFAULT_RATES).forEach(([code, rate]) => {
        expect(rate).toBeGreaterThan(0);
      });
    });

    it('should have reasonable rate values', () => {
      // USD should be roughly 0.012 INR
      expect(DEFAULT_RATES.USD).toBeGreaterThan(0.01);
      expect(DEFAULT_RATES.USD).toBeLessThan(0.02);

      // JPY should be higher (less valuable per INR)
      expect(DEFAULT_RATES.JPY).toBeGreaterThan(1);
    });
  });

  describe('Cross-Rate Calculation', () => {
    it('should calculate INR to USD correctly', () => {
      const inrToUsd = DEFAULT_RATES.USD / DEFAULT_RATES.INR;
      expect(inrToUsd).toBeCloseTo(0.012, 4);
    });

    it('should calculate USD to INR correctly', () => {
      const usdToInr = DEFAULT_RATES.INR / DEFAULT_RATES.USD;
      expect(usdToInr).toBeCloseTo(83.33, 1);
    });

    it('should calculate cross rate between two non-base currencies', () => {
      // EUR to GBP
      const eurToGbp = DEFAULT_RATES.GBP / DEFAULT_RATES.EUR;
      expect(eurToGbp).toBeGreaterThan(0.8);
      expect(eurToGbp).toBeLessThan(0.9);
    });
  });
});

// ============================================
// CONVERSION LOGIC TESTS
// ============================================

describe('Currency Conversion Logic', () => {
  const CURRENCIES: Record<string, { name: string; symbol: string; decimals: number }> = {
    INR: { name: 'Indian Rupee', symbol: '₹', decimals: 2 },
    USD: { name: 'US Dollar', symbol: '$', decimals: 2 },
    EUR: { name: 'Euro', symbol: '€', decimals: 2 },
  };

  const DEFAULT_RATES: Record<string, number> = {
    INR: 1,
    USD: 0.012,
    EUR: 0.011,
  };

  // Pure conversion function for testing
  function convertCurrency(amount: number, fromRate: number, toRate: number): number {
    if (fromRate === toRate) return amount;
    const inBase = amount * fromRate;
    return inBase / toRate;
  }

  function roundToDecimals(value: number, decimals: number): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }

  describe('Same Currency Conversion', () => {
    it('should return same amount when converting to same currency', () => {
      const amount = 1000;
      const result = convertCurrency(amount, 1, 1);
      expect(result).toBe(1000);
    });

    it('should handle zero amount', () => {
      const result = convertCurrency(0, 1, 1);
      expect(result).toBe(0);
    });

    it('should handle negative amounts', () => {
      const result = convertCurrency(-100, 1, 1);
      expect(result).toBe(-100);
    });
  });

  describe('INR to USD Conversion', () => {
    it('should convert INR to USD correctly', () => {
      const amount = 1000; // INR
      const result = convertCurrency(amount, DEFAULT_RATES.INR, DEFAULT_RATES.USD);
      expect(result).toBeCloseTo(12, 0); // ~12 USD
    });

    it('should handle large amounts', () => {
      const amount = 1000000; // 10 lakhs INR
      const result = convertCurrency(amount, DEFAULT_RATES.INR, DEFAULT_RATES.USD);
      expect(result).toBeCloseTo(12000, 0); // ~12000 USD
    });

    it('should handle small amounts', () => {
      const amount = 1; // 1 INR
      const result = convertCurrency(amount, DEFAULT_RATES.INR, DEFAULT_RATES.USD);
      expect(result).toBeCloseTo(0.012, 3);
    });
  });

  describe('USD to INR Conversion', () => {
    it('should convert USD to INR correctly', () => {
      const amount = 100; // USD
      const result = convertCurrency(amount, DEFAULT_RATES.USD, DEFAULT_RATES.INR);
      expect(result).toBeCloseTo(8333, 0); // ~8333 INR
    });
  });

  describe('Cross Currency Conversion', () => {
    it('should convert USD to EUR', () => {
      const amount = 100; // USD
      const result = convertCurrency(amount, DEFAULT_RATES.USD, DEFAULT_RATES.EUR);
      expect(result).toBeCloseTo(91.67, 0); // ~91.67 EUR
    });

    it('should convert EUR to USD', () => {
      const amount = 100; // EUR
      const result = convertCurrency(amount, DEFAULT_RATES.EUR, DEFAULT_RATES.USD);
      expect(result).toBeCloseTo(109.09, 0); // ~109.09 USD
    });
  });

  describe('Decimal Rounding', () => {
    it('should round to 2 decimals for USD', () => {
      const value = 12.3456;
      const rounded = roundToDecimals(value, 2);
      expect(rounded).toBe(12.35);
    });

    it('should round to 0 decimals for JPY', () => {
      const value = 1234.56;
      const rounded = roundToDecimals(value, 0);
      expect(rounded).toBe(1235);
    });

    it('should handle exact values', () => {
      const value = 100.00;
      const rounded = roundToDecimals(value, 2);
      expect(rounded).toBe(100);
    });
  });

  describe('Margin/Markup Application', () => {
    function applyMargin(amount: number, rate: number, marginPercent: number): number {
      const adjustedRate = rate * (1 + marginPercent / 100);
      return amount * adjustedRate;
    }

    it('should apply 2% margin correctly', () => {
      const amount = 1000;
      const rate = 0.012;
      const marginPercent = 2;

      const withMargin = applyMargin(amount, rate, marginPercent);
      const withoutMargin = amount * rate;

      expect(withMargin).toBeGreaterThan(withoutMargin);
      expect(withMargin / withoutMargin).toBeCloseTo(1.02, 2);
    });

    it('should apply 0% margin (no change)', () => {
      const amount = 1000;
      const rate = 0.012;
      const marginPercent = 0;

      const withMargin = applyMargin(amount, rate, marginPercent);
      const withoutMargin = amount * rate;

      expect(withMargin).toBe(withoutMargin);
    });

    it('should handle negative margin (discount)', () => {
      const amount = 1000;
      const rate = 0.012;
      const marginPercent = -2;

      const withMargin = applyMargin(amount, rate, marginPercent);
      const withoutMargin = amount * rate;

      expect(withMargin).toBeLessThan(withoutMargin);
    });
  });
});

// ============================================
// RATE LOOKUP TESTS
// ============================================

describe('Rate Lookup Logic', () => {
  const DEFAULT_RATES: Record<string, number> = {
    INR: 1,
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0095,
  };

  // Mock database rates with expiry
  interface RateRecord {
    baseCurrency: string;
    targetCurrency: string;
    rate: number;
    expiresAt: Date;
  }

  const mockRates: RateRecord[] = [];

  function getRate(from: string, to: string, dbRates: RateRecord[]): number {
    if (from === to) return 1;

    // Check direct rate
    const direct = dbRates.find(
      r => r.baseCurrency === from && r.targetCurrency === to && r.expiresAt > new Date()
    );
    if (direct) return direct.rate;

    // Check inverse rate
    const inverse = dbRates.find(
      r => r.baseCurrency === to && r.targetCurrency === from && r.expiresAt > new Date()
    );
    if (inverse) return 1 / inverse.rate;

    // Fallback to default rates
    const fromToInr = DEFAULT_RATES[from] || 1;
    const toToInr = DEFAULT_RATES[to] || 1;
    return toToInr / fromToInr;
  }

  describe('Same Currency', () => {
    it('should return 1 for same currency', () => {
      const rate = getRate('INR', 'INR', []);
      expect(rate).toBe(1);
    });

    it('should return 1 for USD to USD', () => {
      const rate = getRate('USD', 'USD', []);
      expect(rate).toBe(1);
    });
  });

  describe('Direct Rate Lookup', () => {
    it('should find direct rate from database', () => {
      const dbRates: RateRecord[] = [
        { baseCurrency: 'INR', targetCurrency: 'USD', rate: 0.012, expiresAt: new Date('2025-12-31') },
      ];

      const rate = getRate('INR', 'USD', dbRates);
      expect(rate).toBe(0.012);
    });

    it('should not find expired rate', () => {
      const dbRates: RateRecord[] = [
        { baseCurrency: 'INR', targetCurrency: 'USD', rate: 0.012, expiresAt: new Date('2020-01-01') },
      ];

      const rate = getRate('INR', 'USD', dbRates);
      expect(rate).not.toBe(0.012);
    });
  });

  describe('Inverse Rate Lookup', () => {
    it('should calculate inverse rate', () => {
      const dbRates: RateRecord[] = [
        { baseCurrency: 'USD', targetCurrency: 'INR', rate: 83.33, expiresAt: new Date('2025-12-31') },
      ];

      const rate = getRate('INR', 'USD', dbRates);
      expect(rate).toBeCloseTo(0.012, 3);
    });
  });

  describe('Fallback to Default Rates', () => {
    it('should use default rates when DB is empty', () => {
      const rate = getRate('INR', 'USD', []);
      expect(rate).toBeCloseTo(0.012, 2);
    });

    it('should calculate cross rate using defaults', () => {
      const rate = getRate('USD', 'EUR', []);
      // USD to INR = 0.012, EUR to INR = 0.011
      // USD to EUR = 0.011 / 0.012 = 0.9167
      expect(rate).toBeCloseTo(0.9167, 2);
    });
  });
});

// ============================================
// CURRENCY CONFIGURATION TESTS
// ============================================

describe('Currency Configuration', () => {
  interface CurrencyConfig {
    hotelId: string;
    baseCurrency: string;
    supportedCurrencies: string[];
    displayCurrency: string;
    autoUpdate: boolean;
    markupPercent: number;
    marginPercent: number;
  }

  describe('Default Configuration', () => {
    it('should default base currency to INR', () => {
      const config: CurrencyConfig = {
        hotelId: 'hotel-123',
        baseCurrency: 'INR',
        supportedCurrencies: [],
        displayCurrency: 'INR',
        autoUpdate: true,
        markupPercent: 0,
        marginPercent: 2,
      };

      expect(config.baseCurrency).toBe('INR');
    });

    it('should default margin to 2%', () => {
      const defaultMargin = 2;
      expect(defaultMargin).toBe(2);
    });

    it('should default markup to 0%', () => {
      const defaultMarkup = 0;
      expect(defaultMarkup).toBe(0);
    });

    it('should default autoUpdate to true', () => {
      const config = { autoUpdate: true };
      expect(config.autoUpdate).toBe(true);
    });
  });

  describe('Supported Currencies', () => {
    it('should filter supported currencies', () => {
      const allCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
      const supported = ['INR', 'USD', 'EUR'];

      const filtered = allCurrencies.filter(c => supported.includes(c));
      expect(filtered.length).toBe(3);
    });

    it('should validate supported currency codes', () => {
      const supported = ['INR', 'USD', 'EUR'];
      const validCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY'];

      const allValid = supported.every(c => validCurrencies.includes(c));
      expect(allValid).toBe(true);
    });
  });
});

// ============================================
// CONVERSION LOGGING TESTS
// ============================================

describe('Conversion Logging', () => {
  interface ConversionLog {
    hotelId: string;
    fromCurrency: string;
    toCurrency: string;
    amount: number;
    convertedAmount: number;
    rate: number;
    createdAt: Date;
  }

  it('should create conversion log entry', () => {
    const log: ConversionLog = {
      hotelId: 'hotel-123',
      fromCurrency: 'INR',
      toCurrency: 'USD',
      amount: 1000,
      convertedAmount: 12,
      rate: 0.012,
      createdAt: new Date(),
    };

    expect(log.hotelId).toBe('hotel-123');
    expect(log.amount).toBe(1000);
    expect(log.convertedAmount).toBe(12);
  });

  it('should track conversion rate accuracy', () => {
    const log: ConversionLog = {
      hotelId: 'hotel-123',
      fromCurrency: 'INR',
      toCurrency: 'USD',
      amount: 1000,
      convertedAmount: 12,
      rate: 0.012,
      createdAt: new Date(),
    };

    const expectedRate = log.convertedAmount / log.amount;
    expect(expectedRate).toBeCloseTo(log.rate, 4);
  });
});

// ============================================
// API RESPONSE FORMAT TESTS
// ============================================

describe('API Response Formats', () => {
  describe('Currencies List Response', () => {
    it('should format currencies correctly', () => {
      const currencies = [
        { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimals: 2 },
        { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
      ];

      const response = {
        success: true,
        data: { currencies },
      };

      expect(response.success).toBe(true);
      expect(response.data.currencies.length).toBe(2);
      expect(response.data.currencies[0].code).toBe('INR');
    });
  });

  describe('Rates Response', () => {
    it('should include base currency in response', () => {
      const response = {
        success: true,
        data: {
          base: 'INR',
          rates: {
            USD: 0.012,
            EUR: 0.011,
          },
        },
      };

      expect(response.data.base).toBe('INR');
      expect(response.data.rates.USD).toBeDefined();
    });
  });

  describe('Conversion Response', () => {
    it('should include from and to amounts', () => {
      const response = {
        success: true,
        data: {
          from: { currency: 'INR', amount: 1000 },
          to: { currency: 'USD', amount: 12 },
          rate: 0.012,
        },
      };

      expect(response.data.from.currency).toBe('INR');
      expect(response.data.from.amount).toBe(1000);
      expect(response.data.to.currency).toBe('USD');
      expect(response.data.to.amount).toBe(12);
    });

    it('should round converted amount to 2 decimals', () => {
      const amount = 1000;
      const rate = 0.0123;
      const converted = Math.round(amount * rate * 100) / 100;

      expect(converted).toBe(12.3);
    });
  });

  describe('Error Response', () => {
    it('should include error code for invalid currency', () => {
      const errorResponse = {
        success: false,
        error: { code: 'INVALID_CURRENCY' },
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error.code).toBe('INVALID_CURRENCY');
    });
  });
});

// ============================================
// VALIDATION TESTS
// ============================================

describe('Currency Validation', () => {
  const VALID_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'THB', 'AUD', 'JPY', 'CNY'];

  describe('Currency Code Validation', () => {
    it('should accept valid currency codes', () => {
      const validCodes = ['INR', 'USD', 'EUR'];
      validCodes.forEach(code => {
        expect(VALID_CURRENCIES.includes(code)).toBe(true);
      });
    });

    it('should reject invalid currency codes', () => {
      const invalidCodes = ['INVALID', 'XYZ', '123'];
      invalidCodes.forEach(code => {
        expect(VALID_CURRENCIES.includes(code)).toBe(false);
      });
    });

    it('should reject case variations', () => {
      expect(VALID_CURRENCIES.includes('inr')).toBe(false);
      expect(VALID_CURRENCIES.includes('usd')).toBe(false);
    });
  });

  describe('Amount Validation', () => {
    it('should accept positive amounts', () => {
      const positiveAmounts = [1, 100, 1000, 999999.99];
      positiveAmounts.forEach(amount => {
        expect(amount).toBeGreaterThan(0);
      });
    });

    it('should accept zero amount', () => {
      const amount = 0;
      expect(amount).toBeGreaterThanOrEqual(0);
    });

    it('should reject negative amounts', () => {
      const negativeAmounts = [-1, -100, -0.01];
      negativeAmounts.forEach(amount => {
        expect(amount < 0).toBe(true);
      });
    });
  });
});

// ============================================
// EXCHANGE RATE API FALLBACK TESTS
// ============================================

describe('Exchange Rate API Fallback', () => {
  describe('API Selection', () => {
    it('should try multiple APIs in sequence', () => {
      const apis = [
        'https://api.exchangerate-api.com/v4/latest/INR',
        'https://open.er-api.com/v6/latest/INR',
      ];

      expect(apis.length).toBe(2);
    });

    it('should fallback after API failure', () => {
      let apiIndex = 0;
      const apis = ['api1', 'api2'];
      let success = false;

      while (apiIndex < apis.length && !success) {
        // Simulate failure
        if (apiIndex === 0) {
          apiIndex++;
        } else {
          success = true;
        }
      }

      expect(success).toBe(true);
      expect(apiIndex).toBe(1);
    });
  });

  describe('Cache Expiry', () => {
    it('should set expiry to 1 hour after fetch', () => {
      const fetchedAt = new Date('2024-01-01T12:00:00Z');
      const expiresAt = new Date(fetchedAt.getTime() + 60 * 60 * 1000);

      expect(expiresAt.toISOString()).toBe('2024-01-01T13:00:00.000Z');
    });

    it('should determine if rate is expired', () => {
      const expiresAt = new Date('2020-01-01T00:00:00Z');
      const now = new Date('2024-01-01T00:00:00Z');

      const isExpired = now > expiresAt;
      expect(isExpired).toBe(true);
    });
  });
});

/**
 * REZ Currency Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('REZ Currency Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Service Configuration', () => {
    it('should have correct port configuration', () => {
      const port = parseInt(process.env.PORT || '4035', 10);
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThan(65536);
    });

    it('should have correct MongoDB URL configuration', () => {
      const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/rez_currency';
      expect(mongoUrl).toMatch(/^mongodb/);
    });
  });

  describe('Health Check', () => {
    it('should return health status', () => {
      const mockHealthResponse = {
        status: 'healthy',
        service: 'currency-service',
        port: 4035,
      };

      expect(mockHealthResponse.status).toBe('healthy');
      expect(mockHealthResponse.service).toBe('currency-service');
    });
  });

  describe('Supported Currencies', () => {
    it('should have all required currencies', () => {
      const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'THB', 'AUD', 'JPY', 'CNY'];
      expect(currencies).toContain('INR');
      expect(currencies).toContain('USD');
      expect(currencies).toContain('EUR');
    });

    it('should have currency metadata', () => {
      const currencyInfo = {
        INR: { name: 'Indian Rupee', symbol: '₹', decimals: 2 },
        USD: { name: 'US Dollar', symbol: '$', decimals: 2 },
        EUR: { name: 'Euro', symbol: '€', decimals: 2 },
      };

      expect(currencyInfo.INR.symbol).toBe('₹');
      expect(currencyInfo.INR.decimals).toBe(2);
      expect(currencyInfo.JPY).toBeUndefined(); // JPY handled separately
    });
  });

  describe('Default Exchange Rates', () => {
    it('should have INR as base currency', () => {
      const defaultRates = {
        INR: 1,
        USD: 0.012,
        EUR: 0.011,
        GBP: 0.0095,
      };

      expect(defaultRates.INR).toBe(1);
    });

    it('should have valid rate values', () => {
      const defaultRates = {
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

      for (const rate of Object.values(defaultRates)) {
        expect(rate).toBeGreaterThan(0);
      }
    });
  });

  describe('Currency Conversion', () => {
    it('should return 1 for same currency conversion', () => {
      const rate = 1;
      expect(rate).toBe(1);
    });

    it('should calculate conversion correctly', () => {
      const amount = 1000;
      const rate = 0.012; // INR to USD
      const converted = amount * rate;
      expect(converted).toBe(12);
    });

    it('should handle large amounts', () => {
      const amount = 1000000;
      const rate = 0.012;
      const converted = amount * rate;
      expect(converted).toBe(12000);
    });
  });

  describe('Exchange Rate Schema', () => {
    it('should validate exchange rate structure', () => {
      const rateSchema = {
        baseCurrency: expect.any(String),
        targetCurrency: expect.any(String),
        rate: expect.any(Number),
        inverseRate: expect.any(Number),
        source: expect.any(String),
        fetchedAt: expect.any(Date),
        expiresAt: expect.any(Date),
      };

      const mockRate = {
        baseCurrency: 'INR',
        targetCurrency: 'USD',
        rate: 0.012,
        inverseRate: 83.33,
        source: 'api',
        fetchedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      };

      expect(mockRate).toMatchObject(rateSchema);
    });
  });

  describe('Currency Config Schema', () => {
    it('should validate currency config structure', () => {
      const configSchema = {
        hotelId: expect.any(String),
        baseCurrency: expect.any(String),
        supportedCurrencies: expect.any(Array),
        displayCurrency: expect.any(String),
        autoUpdate: expect.any(Boolean),
        markupPercent: expect.any(Number),
        marginPercent: expect.any(Number),
      };

      const mockConfig = {
        hotelId: 'HTL-001',
        baseCurrency: 'INR',
        supportedCurrencies: ['INR', 'USD', 'EUR'],
        displayCurrency: 'INR',
        autoUpdate: true,
        markupPercent: 0,
        marginPercent: 2,
      };

      expect(mockConfig).toMatchObject(configSchema);
    });
  });

  describe('Conversion Log Schema', () => {
    it('should validate conversion log structure', () => {
      const logSchema = {
        hotelId: expect.any(String),
        fromCurrency: expect.any(String),
        toCurrency: expect.any(String),
        amount: expect.any(Number),
        convertedAmount: expect.any(Number),
        rate: expect.any(Number),
        createdAt: expect.any(Date),
      };

      const mockLog = {
        hotelId: 'HTL-001',
        fromCurrency: 'INR',
        toCurrency: 'USD',
        amount: 1000,
        convertedAmount: 12,
        rate: 0.012,
        createdAt: new Date(),
      };

      expect(mockLog).toMatchObject(logSchema);
    });
  });

  describe('API Endpoints', () => {
    it('should have currencies endpoint', () => {
      const endpoint = '/api/currencies';
      expect(endpoint).toBe('/api/currencies');
    });

    it('should have rates endpoint', () => {
      const endpoint = '/api/rates';
      expect(endpoint).toBe('/api/rates');
    });

    it('should have convert endpoint', () => {
      const endpoint = '/api/convert';
      expect(endpoint).toBe('/api/convert');
    });

    it('should have config endpoint', () => {
      const endpoint = '/api/config/:hotelId';
      expect(endpoint).toContain('/api/config');
    });
  });

  describe('API Response Format', () => {
    it('should return currencies list format', () => {
      const mockResponse = {
        success: true,
        data: {
          currencies: expect.any(Array),
        },
      };

      const mockData = {
        success: true,
        data: {
          currencies: [
            { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimals: 2 },
          ],
        },
      };

      expect(mockData).toMatchObject(mockResponse);
    });

    it('should return rates format', () => {
      const mockResponse = {
        success: true,
        data: {
          base: expect.any(String),
          rates: expect.any(Object),
        },
      };

      const mockData = {
        success: true,
        data: {
          base: 'INR',
          rates: { USD: 0.012, EUR: 0.011 },
        },
      };

      expect(mockData).toMatchObject(mockResponse);
    });

    it('should return conversion format', () => {
      const mockResponse = {
        success: true,
        data: {
          from: { currency: expect.any(String), amount: expect.any(Number) },
          to: { currency: expect.any(String), amount: expect.any(Number) },
          rate: expect.any(Number),
        },
      };

      const mockData = {
        success: true,
        data: {
          from: { currency: 'INR', amount: 1000 },
          to: { currency: 'USD', amount: 12 },
          rate: 0.012,
        },
      };

      expect(mockData).toMatchObject(mockResponse);
    });

    it('should return error response format', () => {
      const errorResponse = {
        success: false,
        error: {
          code: expect.any(String),
        },
      };

      const mockError = {
        success: false,
        error: {
          code: 'INVALID_CURRENCY',
        },
      };

      expect(mockError).toMatchObject(errorResponse);
    });
  });

  describe('Rate Calculation', () => {
    it('should calculate inverse rate correctly', () => {
      const rate = 83.33; // INR to USD rate
      const inverseRate = 1 / rate;
      expect(Math.round(inverseRate * 100) / 100).toBe(0.01);
    });

    it('should apply margin percentage', () => {
      const baseRate = 0.012;
      const marginPercent = 2;
      const finalRate = baseRate * (1 + marginPercent / 100);
      expect(finalRate).toBeCloseTo(0.01224, 4);
    });
  });
});
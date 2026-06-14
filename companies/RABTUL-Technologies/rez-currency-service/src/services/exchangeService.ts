/**
 * Exchange Rate Service
 * Fetches and caches real-time exchange rates with fallback to static rates
 */

import { CurrencyCode, ExchangeRate, CURRENCY_REGISTRY } from '../models/Currency';
import logger from '../utils/logger';

// Fallback rates (as of knowledge cutoff) - used when API is unavailable
const FALLBACK_RATES: Record<CurrencyCode, Record<CurrencyCode, number>> = {
  [CurrencyCode.INR]: {
    [CurrencyCode.INR]: 1,
    [CurrencyCode.USD]: 0.0119,      // 1 INR = 0.0119 USD
    [CurrencyCode.EUR]: 0.0109,       // 1 INR = 0.0109 EUR
    [CurrencyCode.GBP]: 0.0094        // 1 INR = 0.0094 GBP
  },
  [CurrencyCode.USD]: {
    [CurrencyCode.INR]: 83.85,        // 1 USD = 83.85 INR
    [CurrencyCode.USD]: 1,
    [CurrencyCode.EUR]: 0.92,         // 1 USD = 0.92 EUR
    [CurrencyCode.GBP]: 0.79          // 1 USD = 0.79 GBP
  },
  [CurrencyCode.EUR]: {
    [CurrencyCode.INR]: 91.45,        // 1 EUR = 91.45 INR
    [CurrencyCode.USD]: 1.09,         // 1 EUR = 1.09 USD
    [CurrencyCode.EUR]: 1,
    [CurrencyCode.GBP]: 0.86          // 1 EUR = 0.86 GBP
  },
  [CurrencyCode.GBP]: {
    [CurrencyCode.INR]: 106.35,       // 1 GBP = 106.35 INR
    [CurrencyCode.USD]: 1.27,         // 1 GBP = 1.27 USD
    [CurrencyCode.EUR]: 1.16,         // 1 GBP = 1.16 EUR
    [CurrencyCode.GBP]: 1
  }
};

interface RateCache {
  rates: Record<CurrencyCode, Record<CurrencyCode, number>>;
  lastUpdated: Date;
  source: 'api' | 'fallback';
}

class ExchangeRateService {
  private cache: RateCache | null = null;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';
  private fetch: typeof import('node-fetch').default | null = null;

  constructor() {
    // Dynamic import for node-fetch
    import('node-fetch').then(module => {
      this.fetch = module.default;
    }).catch(() => {
      logger.warn('node-fetch not available, using fallback rates only');
    });
  }

  /**
   * Get all exchange rates relative to a base currency
   */
  async getAllRates(baseCurrency: CurrencyCode = CurrencyCode.USD): Promise<ExchangeRate[]> {
    const rates = await this.getRates();

    return Object.values(CurrencyCode).map(targetCurrency => ({
      from: baseCurrency,
      to: targetCurrency,
      rate: rates[baseCurrency][targetCurrency],
      timestamp: this.cache?.lastUpdated || new Date()
    }));
  }

  /**
   * Get exchange rate between two currencies
   */
  async getRate(from: CurrencyCode, to: CurrencyCode): Promise<ExchangeRate> {
    const rates = await this.getRates();

    return {
      from,
      to,
      rate: rates[from][to],
      timestamp: this.cache?.lastUpdated || new Date()
    };
  }

  /**
   * Get cached rates or fetch new ones
   */
  async getRates(): Promise<Record<CurrencyCode, Record<CurrencyCode, number>>> {
    // Return cached rates if still valid
    if (this.isCacheValid()) {
      return this.cache!.rates;
    }

    // Try to fetch from API
    const apiRates = await this.fetchFromAPI();

    if (apiRates) {
      this.cache = {
        rates: apiRates,
        lastUpdated: new Date(),
        source: 'api'
      };
      logger.info('Exchange rates updated from API');
    } else {
      // Use fallback rates
      this.cache = {
        rates: FALLBACK_RATES,
        lastUpdated: new Date(),
        source: 'fallback'
      };
      logger.warn('Using fallback exchange rates - API unavailable');
    }

    return this.cache.rates;
  }

  /**
   * Check if cached rates are still valid
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    const age = Date.now() - this.cache.lastUpdated.getTime();
    return age < this.CACHE_TTL_MS;
  }

  /**
   * Fetch rates from external API
   */
  private async fetchFromAPI(): Promise<Record<CurrencyCode, Record<CurrencyCode, number>> | null> {
    try {
      if (!this.fetch) {
        // Try to require node-fetch
        const nodeFetch = require('node-fetch');
        this.fetch = nodeFetch.default || nodeFetch;
      }

      const response = await this.fetch!(this.API_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as {
        rates: Record<string, number>;
        base: string;
        time_last_updated: number;
      };

      return this.convertAPIRatesToInternal(data.rates);
    } catch (error) {
      logger.error('Failed to fetch exchange rates from API', error);
      return null;
    }
  }

  /**
   * Convert API response to internal rate format
   * API returns rates relative to USD
   */
  private convertAPIRatesToInternal(
    apiRates: Record<string, number>
  ): Record<CurrencyCode, Record<CurrencyCode, number>> {
    const rates: Record<CurrencyCode, Record<CurrencyCode, number>> = {} as any;

    for (const from of Object.values(CurrencyCode)) {
      rates[from] = {} as Record<CurrencyCode, number>;

      for (const to of Object.values(CurrencyCode)) {
        if (from === to) {
          rates[from][to] = 1;
        } else {
          // Convert: from -> USD -> to
          // If API gives USD rates, then: from/to = (1/usdRate[from]) * (1/usdRate[to])
          const fromRate = apiRates[from] || 1;
          const toRate = apiRates[to] || 1;
          rates[from][to] = toRate / fromRate;
        }
      }
    }

    return rates;
  }

  /**
   * Force refresh rates from API
   */
  async refreshRates(): Promise<ExchangeRate[]> {
    this.cache = null;
    return this.getAllRates();
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { cached: boolean; lastUpdated: Date | null; source: 'api' | 'fallback' | null } {
    return {
      cached: this.cache !== null,
      lastUpdated: this.cache?.lastUpdated || null,
      source: this.cache?.source || null
    };
  }
}

// Export singleton instance
export const exchangeRateService = new ExchangeRateService();
export default exchangeRateService;

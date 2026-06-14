import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import {
  Currency,
  ExchangeRate,
  ConversionRequest,
  ConversionResult,
  ExchangeRateResponse,
  HistoricalRate,
  FeeCalculation,
  FeeType,
  SupportedCurrency
} from '../types';
import { logger } from '../utils/logger';

export class CurrencyService {
  private currencies: Map<string, SupportedCurrency> = new Map();
  private rates: Map<string, ExchangeRate> = new Map();
  private lastFetch: Date | null = null;
  private fetchInterval: number;
  private apiKey: string;
  private baseUrl: string;

  constructor(
    fetchIntervalMinutes: number = 60,
    apiKey?: string
  ) {
    this.fetchInterval = fetchIntervalMinutes * 60 * 1000;
    this.apiKey = apiKey || process.env.EXCHANGE_API_KEY || 'demo';
    this.baseUrl = process.env.EXCHANGE_API_URL || 'https://api.exchangerate-api.com/v4';

    this.initializeCurrencies();
    this.initializeDefaultRates();
  }

  private initializeCurrencies(): void {
    const supportedCurrencies: SupportedCurrency[] = [
      { code: 'USD', symbol: '$', name: 'US Dollar', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 2, countries: ['US', 'EC', 'SV', 'PA', 'TL', 'ZW'] },
      { code: 'EUR', symbol: '€', name: 'Euro', symbolPosition: 'after', decimalSeparator: ',', thousandSeparator: '.', decimalPlaces: 2, countries: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'FI', 'IE'] },
      { code: 'GBP', symbol: '£', name: 'British Pound', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 2, countries: ['GB', 'IM', 'JE', 'GG'] },
      { code: 'JPY', symbol: '¥', name: 'Japanese Yen', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 0, countries: ['JP'] },
      { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 2, countries: ['CN'] },
      { code: 'INR', symbol: '₹', name: 'Indian Rupee', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 2, countries: ['IN'] },
      { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 2, countries: ['AU', 'NR', 'NF', 'CX'] },
      { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 2, countries: ['CA'] },
      { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', symbolPosition: 'after', decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 2, countries: ['CH', 'LI'] },
      { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 2, countries: ['SG'] },
      { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 2, countries: ['AE'] },
      { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 2, countries: ['SA'] },
      { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', symbolPosition: 'before', decimalSeparator: ',', thousandSeparator: '.', decimalPlaces: 2, countries: ['BR'] },
      { code: 'MXN', symbol: '$', name: 'Mexican Peso', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 2, countries: ['MX'] },
      { code: 'ZAR', symbol: 'R', name: 'South African Rand', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 2, countries: ['ZA'] },
      { code: 'KRW', symbol: '₩', name: 'South Korean Won', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 0, countries: ['KR'] },
      { code: 'THB', symbol: '฿', name: 'Thai Baht', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 2, countries: ['TH'] },
      { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 2, countries: ['MY'] },
      { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 0, countries: ['ID'] },
      { code: 'PHP', symbol: '₱', name: 'Philippine Peso', symbolPosition: 'before', decimalSeparator: '.', thousandSeparator: ',', decimalPlaces: 2, countries: ['PH'] }
    ];

    supportedCurrencies.forEach(currency => {
      this.currencies.set(currency.code, currency);
    });
  }

  private initializeDefaultRates(): void {
    const baseRates: Record<string, number> = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.50,
      CNY: 7.24,
      INR: 83.12,
      AUD: 1.53,
      CAD: 1.36,
      CHF: 0.88,
      SGD: 1.34,
      AED: 3.67,
      SAR: 3.75,
      BRL: 4.97,
      MXN: 17.15,
      ZAR: 18.65,
      KRW: 1320.50,
      THB: 35.50,
      MYR: 4.72,
      IDR: 15650,
      PHP: 55.80
    };

    Object.entries(baseRates).forEach(([currency, rate]) => {
      const exchangeRate: ExchangeRate = {
        fromCurrency: 'USD',
        toCurrency: currency,
        rate: rate,
        inverseRate: 1 / rate,
        timestamp: new Date(),
        source: 'default'
      };
      this.rates.set(`USD-${currency}`, exchangeRate);
    });

    this.lastFetch = new Date();
  }

  async refreshRates(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/latest/USD`);

      if (!response.ok) {
        throw new Error(`Failed to fetch rates: ${response.status}`);
      }

      const data = await response.json() as { rates: Record<string, number> };

      Object.entries(data.rates).forEach(([currency, rate]) => {
        if (this.currencies.has(currency)) {
          const exchangeRate: ExchangeRate = {
            fromCurrency: 'USD',
            toCurrency: currency,
            rate: rate,
            inverseRate: 1 / rate,
            timestamp: new Date(),
            source: 'exchangerate-api'
          };
          this.rates.set(`USD-${currency}`, exchangeRate);
        }
      });

      this.lastFetch = new Date();
      logger.info('Exchange rates refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh exchange rates:', error);
      throw error;
    }
  }

  getSupportedCurrencies(): SupportedCurrency[] {
    return Array.from(this.currencies.values());
  }

  getCurrency(code: string): SupportedCurrency | undefined {
    return this.currencies.get(code.toUpperCase());
  }

  isSupported(currencyCode: string): boolean {
    return this.currencies.has(currencyCode.toUpperCase());
  }

  getExchangeRate(from: string, to: string): ExchangeRate | undefined {
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    if (fromUpper === toUpper) {
      return {
        fromCurrency: fromUpper,
        toCurrency: toUpper,
        rate: 1,
        inverseRate: 1,
        timestamp: new Date(),
        source: 'identity'
      };
    }

    const directKey = `${fromUpper}-${toUpper}`;
    const reverseKey = `${toUpper}-${fromUpper}`;
    const usdKey = `USD-${toUpper}`;

    const direct = this.rates.get(directKey);
    if (direct) {
      return direct;
    }

    const reverse = this.rates.get(reverseKey);
    if (reverse) {
      return {
        fromCurrency: fromUpper,
        toCurrency: toUpper,
        rate: reverse.inverseRate,
        inverseRate: reverse.rate,
        timestamp: reverse.timestamp,
        source: reverse.source
      };
    }

    const throughUsd = this.rates.get(usdKey);
    if (throughUsd) {
      return {
        fromCurrency: fromUpper,
        toCurrency: toUpper,
        rate: throughUsd.rate,
        inverseRate: throughUsd.inverseRate,
        timestamp: throughUsd.timestamp,
        source: throughUsd.source
      };
    }

    return undefined;
  }

  convert(request: ConversionRequest): ConversionResult {
    const { amount, fromCurrency, toCurrency, roundResult = true, decimalPlaces = 2 } = request;

    const fromUpper = fromCurrency.toUpperCase();
    const toUpper = toCurrency.toUpperCase();

    const rate = this.getExchangeRate(fromUpper, toUpper);

    if (!rate) {
      throw new Error(`Exchange rate not available for ${fromUpper} to ${toUpper}`);
    }

    let convertedAmount = amount * rate.rate;

    if (roundResult) {
      const currency = this.currencies.get(toUpper);
      const places = decimalPlaces || currency?.decimalPlaces || 2;
      convertedAmount = Math.round(convertedAmount * Math.pow(10, places)) / Math.pow(10, places);
    }

    return {
      originalAmount: amount,
      convertedAmount,
      rate: rate.rate,
      fromCurrency: fromUpper,
      toCurrency: toUpper,
      timestamp: new Date()
    };
  }

  getAllRates(baseCurrency: string = 'USD'): ExchangeRateResponse {
    const baseUpper = baseCurrency.toUpperCase();
    const rates: Record<string, number> = {};

    this.currencies.forEach((_, code) => {
      const rate = this.getExchangeRate(baseUpper, code);
      if (rate) {
        rates[code] = rate.rate;
      }
    });

    return {
      baseCurrency: baseUpper,
      rates,
      timestamp: this.lastFetch || new Date(),
      source: 'rez-currency-service'
    };
  }

  getHistoricalRates(
    fromCurrency: string,
    toCurrency: string,
    days: number = 30
  ): HistoricalRate[] {
    const fromUpper = fromCurrency.toUpperCase();
    const toUpper = toCurrency.toUpperCase();

    const currentRate = this.getExchangeRate(fromUpper, toUpper);
    if (!currentRate) {
      return [];
    }

    const historicalRates: HistoricalRate[] = [];
    const baseRate = currentRate.rate;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const variation = (Math.random() - 0.5) * 0.05;
      const historicalRate = baseRate * (1 + variation);

      historicalRates.push({
        date: date.toISOString().split('T')[0],
        rate: Math.round(historicalRate * 10000) / 10000,
        source: 'simulated'
      });
    }

    return historicalRates;
  }

  calculateFee(amount: number, currency: string, feeType: FeeType, percentage?: number): FeeCalculation {
    const currencyUpper = currency.toUpperCase();
    const currencyInfo = this.currencies.get(currencyUpper);

    let feePercentage: number;
    let feeAmount: number;

    switch (feeType) {
      case FeeType.TRANSACTION:
        feePercentage = percentage || 0.025;
        break;
      case FeeType.CONVERSION:
        feePercentage = percentage || 0.01;
        break;
      case FeeType.WITHDRAWAL:
        feePercentage = percentage || 0.015;
        break;
      case FeeType.DEPOSIT:
        feePercentage = percentage || 0;
        break;
      case FeeType.TRANSFER:
        feePercentage = percentage || 0.01;
        break;
      default:
        feePercentage = percentage || 0.025;
    }

    feeAmount = Math.round(amount * feePercentage * 100) / 100;

    const totalAmount = Math.round((amount + feeAmount) * 100) / 100;

    return {
      amount,
      currency: currencyUpper,
      feeType,
      feeAmount,
      feePercentage,
      totalAmount
    };
  }

  formatCurrency(amount: number, currencyCode: string): string {
    const currency = this.currencies.get(currencyCode.toUpperCase());
    if (!currency) {
      return `${amount}`;
    }

    const parts = amount.toFixed(currency.decimalPlaces).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandSeparator);

    const formattedNumber = parts.join(currency.decimalSeparator);

    if (currency.symbolPosition === 'before') {
      return `${currency.symbol}${formattedNumber}`;
    } else {
      return `${formattedNumber}${currency.symbol}`;
    }
  }

  parseCurrency(formattedAmount: string, currencyCode: string): number {
    const currency = this.currencies.get(currencyCode.toUpperCase());
    if (!currency) {
      return parseFloat(formattedAmount);
    }

    let cleaned = formattedAmount.replace(currency.symbol, '').trim();
    cleaned = cleaned.replace(/[^\d.,\-]/g, '');

    cleaned = cleaned.replace(new RegExp(`\\${currency.thousandSeparator}`, 'g'), '');

    if (currency.decimalSeparator !== '.') {
      cleaned = cleaned.replace(currency.decimalSeparator, '.');
    }

    return parseFloat(cleaned);
  }
}

export const currencyService = new CurrencyService();

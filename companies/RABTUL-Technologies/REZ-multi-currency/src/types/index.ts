import { z } from 'zod';

// Supported currencies enum
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'SGD', 'AUD', 'AED'] as const;
export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number];

// Zod schema for currency validation
export const CurrencyCodeSchema = z.enum(SUPPORTED_CURRENCIES);

// Exchange rate interface
export interface ExchangeRate {
  base: CurrencyCode;
  timestamp: Date;
  rates: Record<CurrencyCode, number>;
  source: string;
}

// Historical rate interface
export interface HistoricalRate {
  date: Date;
  base: CurrencyCode;
  rates: Record<CurrencyCode, number>;
}

// Currency info interface
export interface CurrencyInfo {
  code: CurrencyCode;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isActive: boolean;
}

// Merchant currency settings
export interface MerchantCurrencySettings {
  merchantId: string;
  preferredCurrency: CurrencyCode;
  settlementCurrency: CurrencyCode;
  autoConvert: boolean;
  hedgingEnabled: boolean;
  hedgingThreshold: number; // Percentage threshold for hedging alerts
  createdAt: Date;
  updatedAt: Date;
}

// Conversion request/response
export interface ConversionRequest {
  amount: number;
  from: CurrencyCode;
  to: CurrencyCode;
  timestamp?: Date;
}

export interface ConversionResponse {
  originalAmount: number;
  originalCurrency: CurrencyCode;
  convertedAmount: number;
  convertedCurrency: CurrencyCode;
  exchangeRate: number;
  timestamp: Date;
  validUntil: Date;
}

// Balance in multiple currencies
export interface MultiCurrencyBalance {
  merchantId: string;
  balances: Record<CurrencyCode, number>;
  lastUpdated: Date;
}

// Hedging alert
export interface HedgingAlert {
  merchantId: string;
  currency: CurrencyCode;
  currentRate: number;
  thresholdRate: number;
  percentageChange: number;
  triggeredAt: Date;
  acknowledged: boolean;
}

// Forecasting data
export interface CurrencyForecast {
  currency: CurrencyCode;
  date: Date;
  predictedRate: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  factors: string[];
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Rate fetch options
export interface RateFetchOptions {
  base?: CurrencyCode;
  currencies?: CurrencyCode[];
  forceRefresh?: boolean;
}

// Currency configuration
export const CURRENCY_CONFIG: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, isActive: true },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isActive: true },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, isActive: true },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2, isActive: true },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2, isActive: true },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2, isActive: true },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimalPlaces: 2, isActive: true },
};

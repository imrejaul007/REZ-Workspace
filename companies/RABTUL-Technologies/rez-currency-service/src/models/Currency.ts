/**
 * Currency Model
 * Defines supported currencies, their metadata, and formatting options
 */

export enum CurrencyCode {
  INR = 'INR',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP'
}

export interface CurrencyMetadata {
  code: CurrencyCode;
  name: string;
  symbol: string;
  decimalPlaces: number;
  locale: string;
}

export interface ExchangeRate {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  timestamp: Date;
}

export interface ConversionRequest {
  amount: number;
  from: CurrencyCode;
  to: CurrencyCode;
}

export interface ConversionResult {
  originalAmount: number;
  convertedAmount: number;
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  formattedOriginal: string;
  formattedConverted: string;
  timestamp: Date;
}

export interface CurrencyInfo {
  code: CurrencyCode;
  name: string;
  symbol: string;
}

/**
 * Currency metadata registry
 */
export const CURRENCY_REGISTRY: Record<CurrencyCode, CurrencyMetadata> = {
  [CurrencyCode.INR]: {
    code: CurrencyCode.INR,
    name: 'Indian Rupee',
    symbol: '₹',
    decimalPlaces: 2,
    locale: 'en-IN'
  },
  [CurrencyCode.USD]: {
    code: CurrencyCode.USD,
    name: 'US Dollar',
    symbol: '$',
    decimalPlaces: 2,
    locale: 'en-US'
  },
  [CurrencyCode.EUR]: {
    code: CurrencyCode.EUR,
    name: 'Euro',
    symbol: '€',
    decimalPlaces: 2,
    locale: 'de-DE'
  },
  [CurrencyCode.GBP]: {
    code: CurrencyCode.GBP,
    name: 'British Pound',
    symbol: '£',
    decimalPlaces: 2,
    locale: 'en-GB'
  }
};

/**
 * Get all supported currencies
 */
export function getSupportedCurrencies(): CurrencyInfo[] {
  return Object.values(CURRENCY_REGISTRY).map(({ code, name, symbol }) => ({
    code,
    name,
    symbol
  }));
}

/**
 * Validate if a currency code is supported
 */
export function isValidCurrency(code: string): code is CurrencyCode {
  return Object.values(CurrencyCode).includes(code as CurrencyCode);
}

/**
 * Get currency metadata
 */
export function getCurrencyMetadata(code: CurrencyCode): CurrencyMetadata | undefined {
  return CURRENCY_REGISTRY[code];
}

/**
 * Format amount according to currency locale
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  customLocale?: string
): string {
  const metadata = CURRENCY_REGISTRY[currency];
  if (!metadata) {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  const locale = customLocale || metadata.locale;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: metadata.decimalPlaces,
      maximumFractionDigits: metadata.decimalPlaces
    }).format(amount);
  } catch {
    // Fallback formatting
    return `${metadata.symbol}${amount.toFixed(metadata.decimalPlaces)}`;
  }
}

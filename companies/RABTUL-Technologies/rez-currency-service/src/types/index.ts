export interface Currency {
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
  isActive: boolean;
}

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  inverseRate: number;
  timestamp: Date;
  source: string;
}

export interface ConversionRequest {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  roundResult?: boolean;
  decimalPlaces?: number;
}

export interface ConversionResult {
  originalAmount: number;
  convertedAmount: number;
  rate: number;
  fromCurrency: string;
  toCurrency: string;
  timestamp: Date;
}

export interface ExchangeRateResponse {
  baseCurrency: string;
  rates: Record<string, number>;
  timestamp: Date;
  source: string;
}

export interface HistoricalRate {
  date: string;
  rate: number;
  source: string;
}

export interface CurrencyPair {
  baseCurrency: string;
  targetCurrency: string;
}

export interface FeeCalculation {
  amount: number;
  currency: string;
  feeType: FeeType;
  feeAmount: number;
  feePercentage?: number;
  totalAmount: number;
}

export enum FeeType {
  TRANSACTION = 'transaction',
  CONVERSION = 'conversion',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
  TRANSFER = 'transfer'
}

export interface SupportedCurrency {
  code: string;
  symbol: string;
  name: string;
  symbolPosition: 'before' | 'after';
  decimalSeparator: string;
  thousandSeparator: string;
  decimalPlaces: number;
  countries: string[];
}

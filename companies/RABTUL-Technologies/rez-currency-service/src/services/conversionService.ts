/**
 * Conversion Service
 * Handles currency conversion with precision and formatting
 */

import {
  CurrencyCode,
  ConversionRequest,
  ConversionResult,
  formatCurrency,
  CURRENCY_REGISTRY,
  isValidCurrency
} from '../models/Currency';
import { exchangeRateService } from './exchangeService';
import logger from '../utils/logger';

class ConversionService {
  /**
   * Convert an amount from one currency to another
   */
  async convert(request: ConversionRequest): Promise<ConversionResult> {
    const { amount, from, to } = request;

    // Validate currencies
    if (!isValidCurrency(from)) {
      throw new ConversionError(`Invalid source currency: ${from}`, 'INVALID_CURRENCY');
    }
    if (!isValidCurrency(to)) {
      throw new ConversionError(`Invalid target currency: ${to}`, 'INVALID_CURRENCY');
    }

    // Validate amount
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new ConversionError('Amount must be a valid number', 'INVALID_AMOUNT');
    }
    if (amount < 0) {
      throw new ConversionError('Amount cannot be negative', 'NEGATIVE_AMOUNT');
    }

    // Get exchange rate
    const rateInfo = await exchangeRateService.getRate(from, to);
    const rate = rateInfo.rate;

    // Perform conversion
    const convertedAmount = this.performConversion(amount, rate);

    logger.debug(`Converted ${amount} ${from} to ${convertedAmount} ${to}`, {
      rate,
      timestamp: rateInfo.timestamp
    });

    return {
      originalAmount: amount,
      convertedAmount,
      from,
      to,
      rate,
      formattedOriginal: formatCurrency(amount, from),
      formattedConverted: formatCurrency(convertedAmount, to),
      timestamp: rateInfo.timestamp
    };
  }

  /**
   * Perform the actual conversion calculation
   * Uses precise decimal arithmetic to avoid floating-point errors
   */
  private performConversion(amount: number, rate: number): number {
    // Use integer arithmetic for precision (convert to cents/paise, multiply, convert back)
    const fromMetadata = CURRENCY_REGISTRY[amount > 0 ? this.getAnyCurrency() : 'USD'];
    const decimalPlaces = 2;

    // Scale to avoid floating-point errors
    const scale = Math.pow(10, decimalPlaces);
    const scaledAmount = Math.round(amount * scale);
    const scaledResult = Math.round(scaledAmount * rate);

    return scaledResult / scale;
  }

  /**
   * Get any valid currency code (helper)
   */
  private getAnyCurrency(): CurrencyCode {
    return CurrencyCode.USD;
  }

  /**
   * Convert multiple amounts in a single request
   */
  async convertBatch(
    conversions: ConversionRequest[]
  ): Promise<{ results: ConversionResult[]; errors: ConversionError[] }> {
    const results: ConversionResult[] = [];
    const errors: ConversionError[] = [];

    for (const conversion of conversions) {
      try {
        const result = await this.convert(conversion);
        results.push(result);
      } catch (error) {
        if (error instanceof ConversionError) {
          errors.push(error);
        } else {
          errors.push(new ConversionError(
            `Unexpected error converting ${conversion.amount} ${conversion.from} to ${conversion.to}`,
            'UNKNOWN_ERROR',
            error
          ));
        }
      }
    }

    return { results, errors };
  }

  /**
   * Get inverse conversion rate
   */
  async getInverseRate(from: CurrencyCode, to: CurrencyCode): Promise<number> {
    const rateInfo = await exchangeRateService.getRate(from, to);
    return 1 / rateInfo.rate;
  }

  /**
   * Cross-rate calculation: convert from A to B using A->USD->B
   */
  async getCrossRate(from: CurrencyCode, to: CurrencyCode): Promise<number> {
    const rates = await exchangeRateService.getRates();
    return rates[from][to];
  }
}

/**
 * Custom error class for conversion errors
 */
export class ConversionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'ConversionError';
    if (cause instanceof Error) {
      this.message = `${message} (caused by: ${cause.message})`;
    }
  }
}

// Export singleton instance
export const conversionService = new ConversionService();
export default conversionService;

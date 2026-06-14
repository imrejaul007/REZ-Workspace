/**
 * Currency Routes
 * REST API endpoints for currency operations
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  CurrencyCode,
  getSupportedCurrencies,
  isValidCurrency,
  formatCurrency,
  ConversionRequest
} from '../models/Currency';
import { exchangeRateService } from '../services/exchangeService';
import { conversionService, ConversionError } from '../services/conversionService';
import logger from '../utils/logger';

const router = Router();

/**
 * Error response interface
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Success response wrapper
 */
function successResponse<T>(data: T, meta?: Record<string, unknown>) {
  return {
    success: true,
    data,
    ...(meta && { meta })
  };
}

/**
 * Error handler wrapper
 */
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * GET /api/currencies
 * List all supported currencies
 */
router.get('/currencies', asyncHandler(async (req: Request, res: Response) => {
  const currencies = getSupportedCurrencies();

  res.json(successResponse({
    currencies,
    count: currencies.length
  }));
}));

/**
 * GET /api/currencies/:code
 * Get details for a specific currency
 */
router.get('/currencies/:code', asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;
  const upperCode = code.toUpperCase();

  if (!isValidCurrency(upperCode)) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_CURRENCY',
        message: `Currency '${code}' is not supported. Supported currencies: ${Object.values(CurrencyCode).join(', ')}`
      }
    };
    return res.status(400).json(errorResponse);
  }

  const { CURRENCY_REGISTRY } = await import('../models/Currency');
  const metadata = CURRENCY_REGISTRY[upperCode as CurrencyCode];

  res.json(successResponse({
    code: metadata.code,
    name: metadata.name,
    symbol: metadata.symbol,
    decimalPlaces: metadata.decimalPlaces,
    locale: metadata.locale
  }));
}));

/**
 * GET /api/rates
 * Get all exchange rates
 */
router.get('/rates', asyncHandler(async (req: Request, res: Response) => {
  const baseCurrency = (req.query.base as string)?.toUpperCase() || 'USD';

  if (!isValidCurrency(baseCurrency)) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_CURRENCY',
        message: `Base currency '${baseCurrency}' is not supported`
      }
    };
    return res.status(400).json(errorResponse);
  }

  const rates = await exchangeRateService.getAllRates(baseCurrency as CurrencyCode);
  const cacheStatus = exchangeRateService.getCacheStatus();

  res.json(successResponse({
    base: baseCurrency,
    rates: rates.map(rate => ({
      currency: rate.to,
      rate: rate.rate,
      timestamp: rate.timestamp.toISOString()
    }))
  }, {
    cacheStatus: {
      cached: cacheStatus.cached,
      lastUpdated: cacheStatus.lastUpdated?.toISOString() || null,
      source: cacheStatus.source
    }
  }));
}));

/**
 * GET /api/rates/:from/:to
 * Get exchange rate between two currencies
 */
router.get('/rates/:from/:to', asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.params;
  const upperFrom = from.toUpperCase();
  const upperTo = to.toUpperCase();

  if (!isValidCurrency(upperFrom)) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_CURRENCY',
        message: `Source currency '${from}' is not supported`
      }
    };
    return res.status(400).json(errorResponse);
  }

  if (!isValidCurrency(upperTo)) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_CURRENCY',
        message: `Target currency '${to}' is not supported`
      }
    };
    return res.status(400).json(errorResponse);
  }

  const rate = await exchangeRateService.getRate(
    upperFrom as CurrencyCode,
    upperTo as CurrencyCode
  );

  res.json(successResponse({
    from: rate.from,
    to: rate.to,
    rate: rate.rate,
    inverseRate: 1 / rate.rate,
    timestamp: rate.timestamp.toISOString()
  }));
}));

/**
 * POST /api/convert
 * Convert an amount from one currency to another
 */
router.post('/convert', asyncHandler(async (req: Request, res: Response) => {
  const { amount, from, to } = req.body as {
    amount?: number;
    from?: string;
    to?: string;
  };

  // Validate required fields
  if (amount === undefined || amount === null) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'MISSING_AMOUNT',
        message: 'Field "amount" is required'
      }
    };
    return res.status(400).json(errorResponse);
  }

  if (!from) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'MISSING_SOURCE',
        message: 'Field "from" (source currency) is required'
      }
    };
    return res.status(400).json(errorResponse);
  }

  if (!to) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'MISSING_TARGET',
        message: 'Field "to" (target currency) is required'
      }
    };
    return res.status(400).json(errorResponse);
  }

  const upperFrom = from.toUpperCase();
  const upperTo = to.toUpperCase();

  if (!isValidCurrency(upperFrom)) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_SOURCE',
        message: `Source currency '${from}' is not supported`
      }
    };
    return res.status(400).json(errorResponse);
  }

  if (!isValidCurrency(upperTo)) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_TARGET',
        message: `Target currency '${to}' is not supported`
      }
    };
    return res.status(400).json(errorResponse);
  }

  const conversionRequest: ConversionRequest = {
    amount: Number(amount),
    from: upperFrom as CurrencyCode,
    to: upperTo as CurrencyCode
  };

  const result = await conversionService.convert(conversionRequest);

  res.json(successResponse({
    originalAmount: result.originalAmount,
    convertedAmount: result.convertedAmount,
    from: result.from,
    to: result.to,
    rate: result.rate,
    formattedOriginal: result.formattedOriginal,
    formattedConverted: result.formattedConverted,
    timestamp: result.timestamp.toISOString()
  }));
}));

/**
 * POST /api/convert/batch
 * Convert multiple amounts in a single request
 */
router.post('/convert/batch', asyncHandler(async (req: Request, res: Response) => {
  const { conversions } = req.body as {
    conversions?: ConversionRequest[];
  };

  if (!Array.isArray(conversions) || conversions.length === 0) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_CONVERSIONS',
        message: 'Field "conversions" must be a non-empty array'
      }
    };
    return res.status(400).json(errorResponse);
  }

  const result = await conversionService.convertBatch(conversions);

  res.json(successResponse({
    results: result.results.map(r => ({
      originalAmount: r.originalAmount,
      convertedAmount: r.convertedAmount,
      from: r.from,
      to: r.to,
      rate: r.rate,
      formattedOriginal: r.formattedOriginal,
      formattedConverted: r.formattedConverted,
      timestamp: r.timestamp.toISOString()
    })),
    errors: result.errors.map(e => ({
      code: e.code,
      message: e.message
    })),
    summary: {
      total: conversions.length,
      successful: result.results.length,
      failed: result.errors.length
    }
  }));
}));

/**
 * GET /api/format
 * Format an amount according to currency locale
 */
router.get('/format', asyncHandler(async (req: Request, res: Response) => {
  const { amount, currency, locale } = req.query;

  if (!amount || isNaN(Number(amount))) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_AMOUNT',
        message: 'Query parameter "amount" must be a valid number'
      }
    };
    return res.status(400).json(errorResponse);
  }

  if (!currency) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'MISSING_CURRENCY',
        message: 'Query parameter "currency" is required'
      }
    };
    return res.status(400).json(errorResponse);
  }

  const upperCurrency = (currency as string).toUpperCase();

  if (!isValidCurrency(upperCurrency)) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_CURRENCY',
        message: `Currency '${currency}' is not supported`
      }
    };
    return res.status(400).json(errorResponse);
  }

  const formatted = formatCurrency(
    Number(amount),
    upperCurrency as CurrencyCode,
    locale as string | undefined
  );

  res.json(successResponse({
    amount: Number(amount),
    currency: upperCurrency,
    formatted,
    locale: locale || 'default'
  }));
}));

/**
 * POST /api/rates/refresh
 * Force refresh exchange rates from API
 */
router.post('/rates/refresh', asyncHandler(async (req: Request, res: Response) => {
  logger.info('Forcing exchange rate refresh');

  const rates = await exchangeRateService.refreshRates();

  res.json(successResponse({
    message: 'Exchange rates refreshed successfully',
    rates: rates.map(rate => ({
      currency: rate.to,
      rate: rate.rate,
      timestamp: rate.timestamp.toISOString()
    }))
  }));
}));

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const cacheStatus = exchangeRateService.getCacheStatus();

  res.json(successResponse({
    status: 'healthy',
    service: 'rez-currency-service',
    timestamp: new Date().toISOString(),
    exchangeRateStatus: {
      cached: cacheStatus.cached,
      lastUpdated: cacheStatus.lastUpdated?.toISOString() || null,
      source: cacheStatus.source
    }
  }));
}));

export default router;

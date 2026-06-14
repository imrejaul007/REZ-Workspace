/**
 * TreasuryOS - Custom Error Classes
 * Better error handling for the entire Treasury service
 */

export class TreasuryError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TreasuryError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        name: this.name,
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
      },
    };
  }
}

// ============================================
// Account Errors
// ============================================

export class AccountNotFoundError extends TreasuryError {
  constructor(accountId: string) {
    super(
      `Treasury account not found: ${accountId}`,
      'ACCOUNT_NOT_FOUND',
      404,
      { accountId }
    );
    this.name = 'AccountNotFoundError';
  }
}

export class AccountInactiveError extends TreasuryError {
  constructor(accountId: string, status: string) {
    super(
      `Treasury account is ${status}: ${accountId}`,
      'ACCOUNT_INACTIVE',
      400,
      { accountId, status }
    );
    this.name = 'AccountInactiveError';
  }
}

export class InvalidAccountTypeError extends TreasuryError {
  constructor(accountType: string) {
    super(
      `Invalid account type: ${accountType}`,
      'INVALID_ACCOUNT_TYPE',
      400,
      { accountType, validTypes: ['master', 'operating', 'reserve', 'escrow'] }
    );
    this.name = 'InvalidAccountTypeError';
  }
}

// ============================================
// Balance Errors
// ============================================

export class InsufficientBalanceError extends TreasuryError {
  constructor(
    accountId: string,
    requested: number,
    available: number
  ) {
    super(
      `Insufficient balance in account ${accountId}. Requested: ${requested}, Available: ${available}`,
      'INSUFFICIENT_BALANCE',
      400,
      { accountId, requested, available, shortfall: requested - available }
    );
    this.name = 'InsufficientBalanceError';
  }
}

export class InsufficientAvailableBalanceError extends TreasuryError {
  constructor(
    accountId: string,
    requested: number,
    available: number,
    reserved: number
  ) {
    super(
      `Insufficient available balance in account ${accountId}. Requested: ${requested}, Available: ${available}, Reserved: ${reserved}`,
      'INSUFFICIENT_AVAILABLE_BALANCE',
      400,
      { accountId, requested, available, reserved }
    );
    this.name = 'InsufficientAvailableBalanceError';
  }
}

export class NegativeAmountError extends TreasuryError {
  constructor(operation: string, amount: number) {
    super(
      `Amount must be positive for ${operation}. Received: ${amount}`,
      'NEGATIVE_AMOUNT',
      400,
      { operation, amount }
    );
    this.name = 'NegativeAmountError';
  }
}

export class ZeroAmountError extends TreasuryError {
  constructor(operation: string) {
    super(
      `Amount cannot be zero for ${operation}`,
      'ZERO_AMOUNT',
      400,
      { operation }
    );
    this.name = 'ZeroAmountError';
  }
}

// ============================================
// Transfer Errors
// ============================================

export class TransferToSameAccountError extends TreasuryError {
  constructor(accountId: string) {
    super(
      `Cannot transfer to the same account: ${accountId}`,
      'TRANSFER_TO_SAME_ACCOUNT',
      400,
      { accountId }
    );
    this.name = 'TransferToSameAccountError';
  }
}

export class CrossBusinessTransferError extends TreasuryError {
  constructor(fromBusinessId: string, toBusinessId: string) {
    super(
      `Transfers between different businesses are not allowed`,
      'CROSS_BUSINESS_TRANSFER',
      400,
      { fromBusinessId, toBusinessId }
    );
    this.name = 'CrossBusinessTransferError';
  }
}

export class CurrencyMismatchError extends TreasuryError {
  constructor(fromCurrency: string, toCurrency: string) {
    super(
      `Cannot transfer between different currencies: ${fromCurrency} → ${toCurrency}`,
      'CURRENCY_MISMATCH',
      400,
      { fromCurrency, toCurrency }
    );
    this.name = 'CurrencyMismatchError';
  }
}

// ============================================
// Reservation Errors
// ============================================

export class ReservationExceededError extends TreasuryError {
  constructor(accountId: string, requested: number, available: number) {
    super(
      `Cannot reserve ${requested} in account ${accountId}. Available: ${available}`,
      'RESERVATION_EXCEEDED',
      400,
      { accountId, requested, available }
    );
    this.name = 'ReservationExceededError';
  }
}

export class ReleaseExceededError extends TreasuryError {
  constructor(accountId: string, requested: number, reserved: number) {
    super(
      `Cannot release ${requested} from reservation. Reserved: ${reserved}`,
      'RELEASE_EXCEEDED',
      400,
      { accountId, requested, reserved }
    );
    this.name = 'ReleaseExceededError';
  }
}

// ============================================
// Investment Errors
// ============================================

export class InvestmentNotFoundError extends TreasuryError {
  constructor(investmentId: string) {
    super(
      `Investment not found: ${investmentId}`,
      'INVESTMENT_NOT_FOUND',
      404,
      { investmentId }
    );
    this.name = 'InvestmentNotFoundError';
  }
}

export class InvestmentNotActiveError extends TreasuryError {
  constructor(investmentId: string, status: string) {
    super(
      `Investment ${investmentId} is not active. Status: ${status}`,
      'INVESTMENT_NOT_ACTIVE',
      400,
      { investmentId, status }
    );
    this.name = 'InvestmentNotActiveError';
  }
}

export class InvalidInvestmentTypeError extends TreasuryError {
  constructor(investmentType: string) {
    super(
      `Invalid investment type: ${investmentType}`,
      'INVALID_INVESTMENT_TYPE',
      400,
      {
        investmentType,
        validTypes: [
          'fixed_deposit',
          'recurring_deposit',
          'mutual_fund',
          'government_bond',
          'corporate_bond',
          'money_market',
          'custom',
        ],
      }
    );
    this.name = 'InvalidInvestmentTypeError';
  }
}

export class InvalidInterestRateError extends TreasuryError {
  constructor(rate: number, min: number = 0, max: number = 30) {
    super(
      `Interest rate must be between ${min}% and ${max}%. Received: ${rate}%`,
      'INVALID_INTEREST_RATE',
      400,
      { rate, min, max }
    );
    this.name = 'InvalidInterestRateError';
  }
}

export class InvalidTenureError extends TreasuryError {
  constructor(tenureDays: number, min: number = 1, max: number = 3650) {
    super(
      `Tenure must be between ${min} and ${max} days. Received: ${tenureDays}`,
      'INVALID_TENURE',
      400,
      { tenureDays, min, max }
    );
    this.name = 'InvalidTenureError';
  }
}

export class PrematureRedemptionError extends TreasuryError {
  constructor(investmentId: string, maturityDate: Date) {
    super(
      `Investment ${investmentId} matures on ${maturityDate.toISOString()}. Premature redemption may incur penalties.`,
      'PREMATURE_REDEMPTION',
      400,
      { investmentId, maturityDate }
    );
    this.name = 'PrematureRedemptionError';
  }
}

// ============================================
// Forecast Errors
// ============================================

export class ForecastNotFoundError extends TreasuryError {
  constructor(forecastId: string) {
    super(
      `Forecast not found: ${forecastId}`,
      'FORECAST_NOT_FOUND',
      404,
      { forecastId }
    );
    this.name = 'ForecastNotFoundError';
  }
}

export class InsufficientHistoryError extends TreasuryError {
  constructor(businessId: string, daysAvailable: number, daysRequired: number) {
    super(
      `Insufficient history for forecasting. Need ${daysRequired} days, have ${daysAvailable} days.`,
      'INSUFFICIENT_HISTORY',
      400,
      { businessId, daysAvailable, daysRequired }
    );
    this.name = 'InsufficientHistoryError';
  }
}

// ============================================
// Alert Errors
// ============================================

export class AlertNotFoundError extends TreasuryError {
  constructor(alertId: string) {
    super(
      `Alert not found: ${alertId}`,
      'ALERT_NOT_FOUND',
      404,
      { alertId }
    );
    this.name = 'AlertNotFoundError';
  }
}

export class AlertAlreadyResolvedError extends TreasuryError {
  constructor(alertId: string) {
    super(
      `Alert ${alertId} is already resolved`,
      'ALERT_ALREADY_RESOLVED',
      400,
      { alertId }
    );
    this.name = 'AlertAlreadyResolvedError';
  }
}

// ============================================
// Business/Validation Errors
// ============================================

export class BusinessNotFoundError extends TreasuryError {
  constructor(businessId: string) {
    super(
      `Business not found: ${businessId}`,
      'BUSINESS_NOT_FOUND',
      404,
      { businessId }
    );
    this.name = 'BusinessNotFoundError';
  }
}

export class DuplicateAccountError extends TreasuryError {
  constructor(businessId: string, accountType: string) {
    super(
      `Account of type ${accountType} already exists for business ${businessId}`,
      'DUPLICATE_ACCOUNT',
      409,
      { businessId, accountType }
    );
    this.name = 'DuplicateAccountError';
  }
}

export class DuplicateInvestmentError extends TreasuryError {
  constructor(businessId: string, investmentName: string) {
    super(
      `Investment "${investmentName}" already exists for business ${businessId}`,
      'DUPLICATE_INVESTMENT',
      409,
      { businessId, investmentName }
    );
    this.name = 'DuplicateInvestmentError';
  }
}

// ============================================
// External Service Errors
// ============================================

export class ExternalServiceError extends TreasuryError {
  constructor(service: string, originalError?: Error) {
    super(
      `External service error: ${service}`,
      'EXTERNAL_SERVICE_ERROR',
      503,
      { service, originalError: originalError?.message }
    );
    this.name = 'ExternalServiceError';
  }
}

export class WalletServiceError extends ExternalServiceError {
  constructor(operation: string, originalError?: Error) {
    super(`Wallet Service: ${operation}`, originalError);
    this.name = 'WalletServiceError';
  }
}

export class PaymentServiceError extends ExternalServiceError {
  constructor(operation: string, originalError?: Error) {
    super(`Payment Service: ${operation}`, originalError);
    this.name = 'PaymentServiceError';
  }
}

export class DatabaseError extends TreasuryError {
  constructor(operation: string, originalError?: Error) {
    super(
      `Database operation failed: ${operation}`,
      'DATABASE_ERROR',
      500,
      { operation, originalError: originalError?.message }
    );
    this.name = 'DatabaseError';
  }
}

export class RedisError extends TreasuryError {
  constructor(operation: string, originalError?: Error) {
    super(
      `Redis operation failed: ${operation}`,
      'REDIS_ERROR',
      500,
      { operation, originalError: originalError?.message }
    );
    this.name = 'RedisError';
  }
}

// ============================================
// Validation Errors
// ============================================

export class ValidationError extends TreasuryError {
  constructor(errors: Array<{ field: string; message: string }>) {
    super(
      `Validation failed: ${errors.map(e => `${e.field}: ${e.message}`).join(', ')}`,
      'VALIDATION_ERROR',
      400,
      { errors }
    );
    this.name = 'ValidationError';
  }
}

export class InvalidCurrencyError extends TreasuryError {
  constructor(currency: string) {
    super(
      `Invalid currency code: ${currency}`,
      'INVALID_CURRENCY',
      400,
      {
        currency,
        validCurrencies: ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'],
      }
    );
    this.name = 'InvalidCurrencyError';
  }
}

// ============================================
// Error Handler Utility
// ============================================

export function isTreasuryError(error: unknown): error is TreasuryError {
  return error instanceof TreasuryError;
}

export function getErrorResponse(error: unknown) {
  if (isTreasuryError(error)) {
    return error.toJSON();
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        name: 'InternalError',
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production'
          ? 'An internal error occurred'
          : error.message,
        statusCode: 500,
      },
    };
  }

  return {
    success: false,
    error: {
      name: 'UnknownError',
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      statusCode: 500,
    },
  };
}

// ============================================
// Validation Helpers
// ============================================

export function validateAmount(amount: number, operation: string): void {
  if (amount <= 0) {
    throw new ZeroAmountError(operation);
  }
}

export function validatePositiveAmount(amount: number, operation: string): void {
  if (amount < 0) {
    throw new NegativeAmountError(operation, amount);
  }
}

export function validateAccountId(accountId: string): void {
  if (!accountId || typeof accountId !== 'string') {
    throw new TreasuryError('Invalid account ID', 'INVALID_ACCOUNT_ID', 400);
  }
}

export function validateBusinessId(businessId: string): void {
  if (!businessId || typeof businessId !== 'string') {
    throw new TreasuryError('Invalid business ID', 'INVALID_BUSINESS_ID', 400);
  }
}

export function validateCurrency(currency: string): void {
  const validCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
  if (!validCurrencies.includes(currency)) {
    throw new InvalidCurrencyError(currency);
  }
}

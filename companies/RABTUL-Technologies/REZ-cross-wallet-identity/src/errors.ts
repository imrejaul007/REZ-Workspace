/**
 * Custom Error Classes for Cross-Wallet Identity System
 */

export class CrossWalletError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: string = 'CROSS_WALLET_ERROR',
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CrossWalletError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CrossWalletError);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

export class ValidationError extends CrossWalletError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class SyncError extends CrossWalletError {
  public readonly walletIds: string[];

  constructor(message: string, walletIds: string[] = [], details?: Record<string, unknown>) {
    super(message, 'SYNC_ERROR', { ...details, walletIds });
    this.name = 'SyncError';
    this.walletIds = walletIds;
  }
}

export class TransactionError extends CrossWalletError {
  public readonly transactionId?: string;
  public readonly walletId?: string;

  constructor(
    message: string,
    transactionId?: string,
    walletId?: string,
    details?: Record<string, unknown>
  ) {
    super(message, 'TRANSACTION_ERROR', { ...details, transactionId, walletId });
    this.name = 'TransactionError';
    this.transactionId = transactionId;
    this.walletId = walletId;
  }
}

export class WalletNotFoundError extends CrossWalletError {
  public readonly walletId: string;

  constructor(walletId: string) {
    super(`Wallet not found: ${walletId}`, 'WALLET_NOT_FOUND', { walletId });
    this.name = 'WalletNotFoundError';
    this.walletId = walletId;
  }
}

export class InsufficientBalanceError extends CrossWalletError {
  public readonly walletId: string;
  public readonly available: number;
  public readonly requested: number;

  constructor(walletId: string, available: number, requested: number) {
    super(
      `Insufficient balance in wallet ${walletId}: available ${available}, requested ${requested}`,
      'INSUFFICIENT_BALANCE',
      { walletId, available, requested }
    );
    this.name = 'InsufficientBalanceError';
    this.walletId = walletId;
    this.available = available;
    this.requested = requested;
  }
}

export class WalletLinkingError extends CrossWalletError {
  public readonly provider: string;

  constructor(message: string, provider: string, details?: Record<string, unknown>) {
    super(message, 'WALLET_LINKING_ERROR', { ...details, provider });
    this.name = 'WalletLinkingError';
    this.provider = provider;
  }
}

export class ProviderError extends CrossWalletError {
  public readonly provider: string;
  public readonly statusCode?: number;

  constructor(message: string, provider: string, statusCode?: number, details?: Record<string, unknown>) {
    super(message, 'PROVIDER_ERROR', { ...details, provider, statusCode });
    this.name = 'ProviderError';
    this.provider = provider;
    this.statusCode = statusCode;
  }
}

export class ConversionError extends CrossWalletError {
  public readonly fromCurrency: string;
  public readonly toCurrency: string;

  constructor(fromCurrency: string, toCurrency: string, message: string, details?: Record<string, unknown>) {
    super(message, 'CONVERSION_ERROR', { ...details, fromCurrency, toCurrency });
    this.name = 'ConversionError';
    this.fromCurrency = fromCurrency;
    this.toCurrency = toCurrency;
  }
}

export class RateLimitError extends CrossWalletError {
  public readonly retryAfterMs: number;

  constructor(message: string, retryAfterMs: number, details?: Record<string, unknown>) {
    super(message, 'RATE_LIMIT_ERROR', { ...details, retryAfterMs });
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

export class AuthenticationError extends CrossWalletError {
  public readonly provider: string;

  constructor(message: string, provider: string, details?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', { ...details, provider });
    this.name = 'AuthenticationError';
    this.provider = provider;
  }
}

// Error factory function for consistent error creation
export function createError(
  type: keyof typeof errorTypes,
  message: string,
  details?: Record<string, unknown>
): CrossWalletError {
  const ErrorClass = errorTypes[type] || CrossWalletError;
  return new ErrorClass(message, details);
}

const errorTypes: Record<string, new (msg: string, details?: Record<string, unknown>) => CrossWalletError> = {
  VALIDATION_ERROR: ValidationError,
  SYNC_ERROR: SyncError,
  TRANSACTION_ERROR: TransactionError,
  WALLET_NOT_FOUND: WalletNotFoundError,
  INSUFFICIENT_BALANCE: InsufficientBalanceError,
  WALLET_LINKING_ERROR: WalletLinkingError,
  PROVIDER_ERROR: ProviderError,
  CONVERSION_ERROR: ConversionError,
  RATE_LIMIT_ERROR: RateLimitError,
  AUTHENTICATION_ERROR: AuthenticationError
};

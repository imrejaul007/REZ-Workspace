// Canonical wallet types from shared-types

// Coin Type - using const object so it can be used as both type and value
export const COIN_TYPE = {
  REZ:      'rez',
  PRIVE:    'prive',
  BRANDED:  'branded',
  PROMO:    'promo',
  CASHBACK: 'cashback',
  REFERRAL: 'referral',
} as const;

export type CoinType = typeof COIN_TYPE[keyof typeof COIN_TYPE];

// Export values for Object.values() usage
export const COIN_TYPE_VALUES = ['rez', 'prive', 'branded', 'promo', 'cashback', 'referral'] as const;

// Transaction Type
export const COIN_TRANSACTION_TYPE = {
  EARNED:        'earned',
  SPENT:         'spent',
  EXPIRED:       'expired',
  REFUNDED:      'refunded',
  BONUS:         'bonus',
  BRANDED_AWARD: 'branded_award',
} as const;

export type CoinTransactionType = typeof COIN_TRANSACTION_TYPE[keyof typeof COIN_TRANSACTION_TYPE];

// Transaction Status (lowercase for MongoDB)
export const TRANSACTION_STATUS = {
  COMPLETED:   'completed',
  PENDING:     'pending',
  FAILED:      'failed',
  CANCELLED:   'cancelled',
  PROCESSING:  'processing',
  REVERSED:    'reversed',
} as const;

export type TransactionStatus = typeof TRANSACTION_STATUS[keyof typeof TRANSACTION_STATUS];

// Re-export for backward compatibility
export const CoinTransactionType = COIN_TRANSACTION_TYPE;
export const TransactionStatus = TRANSACTION_STATUS;

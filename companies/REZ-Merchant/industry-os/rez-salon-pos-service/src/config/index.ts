import dotenv from 'dotenv';
dotenv.config();

// Fail fast in production if required secrets are missing
const isProduction = process.env.NODE_ENV === 'production';

export const config = {
  port: parseInt(process.env.PORT || '4010', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-salon-pos',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    // CRITICAL: Require JWT_SECRET in production
    secret: process.env.JWT_SECRET || (isProduction ? (() => { throw new Error('JWT_SECRET is required in production'); })() : 'dev-only-secret-do-not-use-in-prod'),
  },
  internalTokens: JSON.parse(
    process.env.INTERNAL_SERVICE_TOKENS_JSON || '{}'
  ),
  salon: {
    name: process.env.SALON_NAME || 'ReZ Salon',
    address: process.env.SALON_ADDRESS || 'Address not set',
    phone: process.env.SALON_PHONE || '+91-0000000000',
    gstin: process.env.SALON_GSTIN || 'XXXXXXXXXXXXX',
  },
  business: {
    defaultTaxRate: parseFloat(process.env.DEFAULT_TAX_RATE || '18'),
    currency: process.env.CURRENCY || 'INR',
  },
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi',
  WALLET: 'wallet',
} as const;

export const TRANSACTION_TYPES = {
  SALE: 'sale',
  REFUND: 'refund',
  EXPENSE: 'expense',
  ADVANCE: 'advance',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
} as const;

export const COMMISSION_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
} as const;

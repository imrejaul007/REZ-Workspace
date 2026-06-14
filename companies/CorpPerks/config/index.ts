/**
 * CorpPerks Configuration
 * Environment variables and defaults
 */

export const CorpPerksConfig = {
  // API URLs
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://rez-api-gateway.onrender.com',
  WALLET_SERVICE_URL: process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service.onrender.com',
  FINANCE_SERVICE_URL: process.env.FINANCE_SERVICE_URL || 'https://rez-finance-service.onrender.com',

  // Integration URLs (Sister Companies)
  STAYOWN_URL: process.env.STAYOWN_URL || 'http://localhost:4011',
  NEXTABIZZ_URL: process.env.NEXTABIZZ_URL || 'http://localhost:3000',
  KARMA_URL: process.env.KARMA_URL || 'https://karma.onrender.com',

  // Feature flags
  FEATURES: {
    HOTEL_BOOKINGS: true,
    GST_INVOICES: true,
    REWARDS: true,
    KARMA: true,
    ANALYTICS: true,
  },

  // Limits
  LIMITS: {
    MAX_BENEFIT_AMOUNT: 1000000,
    MAX_EMPLOYEES: 10000,
    MAX_INVOICE_AMOUNT: 10000000,
  },

  // Cache TTL (seconds)
  CACHE: {
    SHORT: 60,
    MEDIUM: 300,
    LONG: 3600,
  },
};

export default CorpPerksConfig;

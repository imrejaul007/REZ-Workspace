/**
 * REZ Go Configuration
 *
 * Environment-based configuration for REZ Go service
 * Supports development, staging, and production environments
 */

// API Configuration
const getApiConfig = () => {
  const ENV = process.env.EXPO_PUBLIC_REZ_GO_ENV || 'development';

  const configs = {
    development: {
      REZ_GO_API: 'http://localhost:4075/api',
      REZ_GO_WS: 'ws://localhost:4075',
      USE_MOCK_DATA: true, // Use mock data in dev for faster testing
    },
    staging: {
      REZ_GO_API: 'https://rez-go-staging.rezapp.com/api',
      REZ_GO_WS: 'wss://rez-go-staging.rezapp.com',
      USE_MOCK_DATA: false,
    },
    production: {
      REZ_GO_API: 'https://rez-go.rezapp.com/api',
      REZ_GO_WS: 'wss://rez-go.rezapp.com',
      USE_MOCK_DATA: false,
    },
  };

  return configs[ENV as keyof typeof configs] || configs.development;
};

// Feature Flags
export const FEATURES = {
  // Enable real-time WebSocket updates
  ENABLE_WEBSOCKET: true,

  // Enable offline mode with local storage
  ENABLE_OFFLINE_MODE: true,

  // Enable haptic feedback on scan
  ENABLE_HAPTICS: true,

  // Enable sound effects
  ENABLE_SOUNDS: true,

  // Enable AI recommendations
  ENABLE_AI_RECOMMENDATIONS: true,

  // Enable budget guardrails
  ENABLE_BUDGET_GUARD: true,

  // Enable exit verification (REQUIRED for fraud prevention)
  ENABLE_EXIT_VERIFICATION: true,

  // Enable combo suggestions
  ENABLE_COMBO_SUGGESTIONS: true,

  // Enable streak tracking
  ENABLE_STREAKS: true,

  // Debug mode
  DEBUG_MODE: __DEV__,
};

// Session Configuration
export const SESSION_CONFIG = {
  // Max session duration in minutes
  MAX_SESSION_DURATION: 120,

  // Max items per session
  MAX_ITEMS_PER_SESSION: 100,

  // Exit verification timeout in seconds
  EXIT_TIMEOUT_SECONDS: 300, // 5 minutes

  // Fraud score thresholds
  FRAUD_THRESHOLD_LOW: 30,
  FRAUD_THRESHOLD_MEDIUM: 50,
  FRAUD_THRESHOLD_HIGH: 75,

  // Scanning velocity (items per minute)
  SCAN_VELOCITY_WARNING: 10,
  SCAN_VELOCITY_CRITICAL: 15,
};

// Cashback Configuration
export const CASHBACK_CONFIG = {
  // Default cashback percentage
  DEFAULT_PERCENT: 2,

  // Max cashback percentage (capped)
  MAX_PERCENT: 50,

  // Time-based bonus hours
  HAPPY_HOUR_START: 14, // 2 PM
  HAPPY_HOUR_END: 17, // 5 PM
  HAPPY_HOUR_BONUS: 1, // +1%

  // Early bird bonus
  EARLY_BIRD_START: 6, // 6 AM
  EARLY_BIRD_END: 9, // 9 AM
  EARLY_BIRD_BONUS: 0.5, // +0.5%

  // Streak bonuses
  STREAK_3_DAY: 1, // +1%
  STREAK_5_DAY: 2, // +2%
  STREAK_7_DAY: 3, // +3%
};

// Barcode API Configuration
export const BARCODE_API_CONFIG = {
  // Primary: UPC Item Database (free)
  UPC_ITEM_DB_API: 'https://api.upcitemdb.com/prod/trial/lookup',

  // Fallback: Google product search
  GOOGLE_PRODUCT_API: 'https://serpapi.com/google/products',

  // Cache duration in hours
  CACHE_DURATION_HOURS: 24,

  // Timeout in ms
  TIMEOUT_MS: 5000,
};

// Export singleton config
export const REZ_GO_CONFIG = {
  ...getApiConfig(),
  ...FEATURES,
  SESSION_CONFIG,
  CASHBACK_CONFIG,
  BARCODE_API_CONFIG,
};

export type RezGoConfig = typeof REZ_GO_CONFIG;

export default REZ_GO_CONFIG;

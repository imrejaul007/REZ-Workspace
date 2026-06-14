/**
 * Checkout Configuration
 *
 * Centralized configuration for all checkout-related constants.
 * These values were previously hardcoded throughout the checkout system.
 */

/**
 * Tax rate applied to orders (5%)
 */
export const TAX_RATE = 0.05;

/**
 * Platform fee is NOT charged to consumers — it is deducted from merchant payouts on the backend.
 * This constant exists for reference only and must not be applied to consumer order totals.
 */
export const PLATFORM_FEE = 0;

/**
 * Maximum percentage of order value that can be paid using REZ coins (100%)
 * REZ coins can cover the entire order amount
 */
export const REZ_COIN_MAX_USAGE_PERCENTAGE = 100;

/**
 * Maximum percentage of order value that can be paid using promo coins (20%)
 * Promo coins are limited to 20% of the remaining order value
 */
export const PROMO_COIN_MAX_USAGE_PERCENTAGE = 20;

/**
 * Maximum percentage of order value that can be paid using store promo coins.
 * H30 fix: Aligned to 20% — backend CURRENCY_RULES.promo.maxUsagePct = 20.
 * The previous 30% value was rejected silently by the backend on every store promo redemption.
 * NOTE: Cap enforcement is authoritative on the backend. This constant is display-only.
 */
export const STORE_PROMO_COIN_MAX_USAGE_PERCENTAGE = 20;

/**
 * Default conversion rate for coins to currency (1 coin = ₹1).
 * This is the static fallback used before the live rate is fetched.
 * The live rate is fetched from GET /api/wallet/coin-rules → coinConversion.rezToInr
 * and applied via getCoinConversionRate() / setCoinConversionRate().
 */
export const COIN_CONVERSION_RATE = 1;

// In-memory cache for the live admin-configured rate.
// Shared across the app lifetime; updated once on first wallet load.
let _liveCoinConversionRate: number = COIN_CONVERSION_RATE;

/** Returns the current (possibly live-fetched) coin-to-rupee rate. */
export function getCoinConversionRate(): number {
  return _liveCoinConversionRate;
}

/** Called by wallet/checkout hooks when the live rate is received from the API. */
export function setCoinConversionRate(rate: number): void {
  if (rate > 0) _liveCoinConversionRate = rate;
}

/**
 * Checkout configuration object for convenient access to all values
 */
export const CHECKOUT_CONFIG = {
  TAX_RATE,
  PLATFORM_FEE,
  REZ_COIN_MAX_USAGE_PERCENTAGE,
  PROMO_COIN_MAX_USAGE_PERCENTAGE,
  STORE_PROMO_COIN_MAX_USAGE_PERCENTAGE,
  COIN_CONVERSION_RATE,
} as const;

export default CHECKOUT_CONFIG;

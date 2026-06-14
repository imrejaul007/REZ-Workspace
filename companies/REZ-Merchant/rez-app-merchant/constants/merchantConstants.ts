/**
 * Merchant App — Business Constants
 *
 * All hardcoded thresholds, default coin amounts, segment spend floors, and
 * user-facing strings live here. Never scatter magic numbers inline in screens.
 *
 * Rules:
 * - Prices/thresholds here are DISPLAY DEFAULTS only.
 *   Actual values must be fetched from the backend API.
 * - One edit here updates every screen that references these constants.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER SEGMENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Minimum lifetime spend (₹) for a customer to appear in "Top Spenders" segment. */
export const SEGMENT_TOP_SPENDERS_MIN_SPEND = 1000;

/** Days-since-last-visit threshold for the "Lapsed" segment. */
export const SEGMENT_LAPSED_DAYS = 30;

/** Maximum visit count for a customer to be in the "New Customers" segment. */
export const SEGMENT_NEW_CUSTOMER_MAX_VISITS = 2;

// ─────────────────────────────────────────────────────────────────────────────
// CAMPAIGN TEMPLATES — default values (merchant can edit before launching)
// ─────────────────────────────────────────────────────────────────────────────

/** Minimum lifetime spend threshold for VIP milestone campaign (₹). */
export const CAMPAIGN_VIP_SPEND_MILESTONE = 5000;

/** Default coin amounts for each campaign template. */
export const CAMPAIGN_DEFAULT_COINS = {
  winBack: 50,
  birthday: 100,
  firstVisit: 25,
  vipMilestone: 200,
  loyaltyMilestone10Visits: 150,
} as const;

/** Win-back campaign: how many days since last visit triggers the campaign. */
export const CAMPAIGN_WINBACK_DAYS = 30;

/** Win-back campaign: cooldown period (days) before the same user is targeted again. */
export const CAMPAIGN_WINBACK_COOLDOWN_DAYS = 90;

/** Birthday campaign: yearly cooldown (days). */
export const CAMPAIGN_BIRTHDAY_COOLDOWN_DAYS = 365;

/** Loyalty milestone: visit count that triggers the milestone reward. */
export const CAMPAIGN_LOYALTY_VISIT_MILESTONE = 10;

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS / SALES FORECAST
// ─────────────────────────────────────────────────────────────────────────────

/** Y-axis baseline label on the sales forecast chart. */
export const SALES_FORECAST_AXIS_ZERO_LABEL = '₹0';

/**
 * App-wide Business Constants — Single Source of Truth
 *
 * All hardcoded prices, percentages, thresholds, and user-facing
 * promotional strings live here. Never scatter magic numbers or
 * promo copy inline in screen files.
 *
 * Rules:
 * - PRICES are default/fallback values only. Real prices MUST come from API.
 *   Always show "Starting from" or "Prices may vary" in the UI.
 * - PERCENTAGES are display defaults; actual rates come from backend.
 * - TEXT constants prevent drift — one edit here updates every screen.
 */

// ─────────────────────────────────────────────────────────────────────────────
// DELIVERY
// ─────────────────────────────────────────────────────────────────────────────

/** Order subtotal above which delivery is free (₹). Source: backend; this is the display fallback. */
export const FREE_DELIVERY_THRESHOLD = 500;

/** Estimated per-store delivery fee used for display purposes when the
 *  backend has not returned an actual fee yet (₹). */
export const DEFAULT_DELIVERY_FEE_PER_STORE = 50;

/** User-facing label shown when delivery is waived. */
export const LABEL_FREE_DELIVERY = 'FREE';

/** Promotional text for the wallet recharge card. Actual discount from API. */
export const WALLET_RECHARGE_CASHBACK_TEXT = 'Save upto 10% on wallet recharge';

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION PRICING  (fallbacks — real prices come from /subscription/tiers)
// ─────────────────────────────────────────────────────────────────────────────

/** VIP tier monthly price fallback (₹). API is authoritative. */
export const SUBSCRIPTION_VIP_MONTHLY_FALLBACK = 299;

/** VIP tier yearly price fallback (₹). API is authoritative. */
export const SUBSCRIPTION_VIP_YEARLY_FALLBACK = 2850;

/** Premium tier monthly price fallback (₹). API is authoritative. */
export const SUBSCRIPTION_PREMIUM_MONTHLY_FALLBACK = 99;

/** Premium tier yearly price fallback (₹). API is authoritative. */
export const SUBSCRIPTION_PREMIUM_YEARLY_FALLBACK = 950;

// ─────────────────────────────────────────────────────────────────────────────
// EMI / PAYMENTS  (fallbacks — real values come from /payments/emi-options)
// ─────────────────────────────────────────────────────────────────────────────

/** Fallback annual interest rate (%) for standard EMI plans. API is authoritative. */
export const EMI_DEFAULT_INTEREST_RATE_PERCENT = 14;

/** Fallback tenure options (months) shown before the bank list loads. */
export const EMI_DEFAULT_TENURE_OPTIONS: number[] = [3, 6, 9, 12, 18, 24];

/** Processing fee fallbacks per bank (₹). API is authoritative — these are display fallbacks only. */
export const EMI_BANK_PROCESSING_FEES: Record<string, number> = {
  hdfc: 199,
  icici: 299,
  sbi: 199,
  axis: 249,
  kotak: 199,
  amex: 499,
};

// ─────────────────────────────────────────────────────────────────────────────
// CAMPAIGN / LOYALTY (merchant & consumer)
// ─────────────────────────────────────────────────────────────────────────────

/** VIP customer lifetime spend threshold used for campaign targeting (₹). */
export const CAMPAIGN_VIP_SPEND_THRESHOLD = 5000;

/** "Top Spenders" segment minimum spend (₹) shown in broadcast UI. */
export const BROADCAST_TOP_SPENDERS_MIN_SPEND = 1000;

/** Lapsed customer threshold in days — customers not seen in this many days
 *  are treated as lapsed for win-back campaigns. */
export const CAMPAIGN_LAPSED_DAYS_THRESHOLD = 30;

/** Default coin amounts for campaign templates. All are configurable in the UI;
 *  these are just sensible starting values. */
export const CAMPAIGN_COIN_DEFAULTS = {
  winBack: 50,
  birthday: 100,
  firstVisit: 25,
  vipMilestone: 200,
  loyaltyMilestone: 150,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT / NEAR-U ZONE
// ─────────────────────────────────────────────────────────────────────────────

/** Extra coin multiplier shown to verified students (%). API is authoritative. */
export const STUDENT_EXTRA_COINS_PERCENT = 20;

/** Max price shown in "Budget Deals" hero tagline (₹). */
export const BUDGET_DEALS_MAX_DISPLAY_PRICE = 199;

/** Budget filter price tiers (₹). */
export const BUDGET_PRICE_TIERS = [49, 99, 149, 199] as const;

/** "Try Before You Buy" commitment fee shown in the student nudge (₹). */
export const TRY_COMMITMENT_FEE = 1;

// ─────────────────────────────────────────────────────────────────────────────
// PROMO / CASHBACK STRINGS
// ─────────────────────────────────────────────────────────────────────────────

/** Cashback badge prefix text. Full sentence: "Earn ₹{N} back" */
export const CASHBACK_BADGE_PREFIX = 'Earn';

/** Generic cashback disclaimer shown near price-sensitive UI. */
export const CASHBACK_DISCLAIMER = 'Cashback credited to Rez Wallet. T&C apply.';

/** Student verified-status badge copy. */
export const STUDENT_VERIFIED_BADGE_TEXT = (pct: number) =>
  `Verified Student — ${pct}% extra coins active`;

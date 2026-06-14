/**
 * Interest Configuration for Credit Line / BNPL module.
 * Centralizes all interest-related settings for easy adjustment.
 */

/**
 * Default interest rate (% per month) for overdue payments.
 * Can be overridden per credit line.
 */
export const DEFAULT_INTEREST_RATE = parseFloat(process.env.DEFAULT_INTEREST_RATE || '2.5');

/**
 * Default grace period (days) after due date before interest starts accruing.
 * No interest is charged during the grace period.
 */
export const DEFAULT_GRACE_DAYS = parseInt(process.env.DEFAULT_GRACE_DAYS || '5', 10);

/**
 * Whether to use compound interest.
 * If true, interest is calculated on outstanding + previously accrued interest.
 * If false, simple interest is used (interest on original principal only).
 */
export const COMPOUND_INTEREST = process.env.COMPOUND_INTEREST === 'true';

/**
 * Maximum interest rate (% per month) that can be set.
 * Prevents predatory lending practices.
 */
export const MAX_INTEREST_RATE = parseFloat(process.env.MAX_INTEREST_RATE || '24');

/**
 * Minimum interest rate (% per month) that can be set.
 */
export const MIN_INTEREST_RATE = parseFloat(process.env.MIN_INTEREST_RATE || '0');

/**
 * Interest calculation frequency in days.
 * Default: 30 (monthly), but can be set to 1 for daily calculation.
 */
export const INTEREST_CALCULATION_DAYS = parseInt(process.env.INTEREST_CALCULATION_DAYS || '30', 10);

/**
 * Overdue threshold tiers for reporting and analytics.
 * Values represent days past due date.
 */
export const OVERDUE_THRESHOLDS = {
  tier1: 0,   // Current (0 days overdue)
  tier2: 30,  // 1-30 days overdue
  tier3: 60,  // 31-60 days overdue
  tier4: 90,  // 61-90 days overdue
  tier5: 120, // 90+ days overdue
} as const;

/**
 * Tier labels for reporting.
 */
export const OVERDUE_TIER_LABELS = {
  [OVERDUE_THRESHOLDS.tier1]: 'Current',
  [OVERDUE_THRESHOLDS.tier2]: '1-30 Days',
  [OVERDUE_THRESHOLDS.tier3]: '31-60 Days',
  [OVERDUE_THRESHOLDS.tier4]: '61-90 Days',
  [OVERDUE_THRESHOLDS.tier5]: '90+ Days',
} as const;

/**
 * Interest rate tiers based on days overdue.
 * Higher overdue = higher interest rate (penalty).
 */
export const TIERED_INTEREST_RATES: Record<keyof typeof OVERDUE_THRESHOLDS, number> = {
  tier1: 0,       // Current: no interest
  tier2: 0,       // 1-30 days: grace period (no interest)
  tier3: 1.5,     // 31-60 days: 1.5% per month penalty
  tier4: 2.5,     // 61-90 days: 2.5% per month penalty
  tier5: 4.0,     // 90+ days: 4% per month penalty
};

/**
 * Minimum amount to trigger interest calculation.
 * Prevents micro-pennies from accumulating.
 */
export const MIN_INTEREST_AMOUNT = 0.01;

/**
 * Maximum interest amount that can be charged on a single entry.
 * Prevents runaway interest on very old debts.
 * Set to 100% of the original amount by default.
 */
export const MAX_INTEREST_MULTIPLIER = parseFloat(process.env.MAX_INTEREST_MULTIPLIER || '1.0');

/**
 * Interest calculation batch size.
 * Used when calculating interest for many entries.
 */
export const INTEREST_BATCH_SIZE = parseInt(process.env.INTEREST_BATCH_SIZE || '100', 10);

/**
 * Days after which entries are marked as "bad debt".
 * Used for reporting and provisioning.
 */
export const BAD_DEBT_DAYS = parseInt(process.env.BAD_DEBT_DAYS || '180', 10);

/**
 * Interest rate for bad debt (maximum penalty).
 */
export const BAD_DEBT_INTEREST_RATE = parseFloat(process.env.BAD_DEBT_INTEREST_RATE || '5.0');

/**
 * Configuration for automatic interest application.
 */
export const AUTO_INTEREST_CONFIG = {
  /** Whether to automatically apply interest daily */
  enabled: process.env.AUTO_INTEREST_ENABLED === 'true',

  /** Hour of day to run interest calculation (0-23) */
  runHour: parseInt(process.env.AUTO_INTEREST_HOUR || '2', 10),

  /** Timezone for scheduling */
  timezone: process.env.AUTO_INTEREST_TIMEZONE || 'Asia/Kolkata',

  /** Whether to send notifications when interest is applied */
  notifyOnApply: process.env.AUTO_INTEREST_NOTIFY === 'true',

  /** Minimum days overdue before auto-interest kicks in */
  minDaysOverdue: parseInt(process.env.AUTO_INTEREST_MIN_DAYS || '5', 10),
};

/**
 * Helper function to get the applicable interest rate for a given days overdue.
 * @param daysOverdue - Number of days past the due date
 * @param baseRate - Base interest rate for the credit line
 * @returns The applicable interest rate
 */
export function getTieredInterestRate(
  daysOverdue: number,
  baseRate: number = DEFAULT_INTEREST_RATE
): number {
  if (daysOverdue <= OVERDUE_THRESHOLDS.tier2) {
    return 0; // Grace period
  }
  if (daysOverdue <= OVERDUE_THRESHOLDS.tier3) {
    return Math.min(TIERED_INTEREST_RATES.tier3, baseRate);
  }
  if (daysOverdue <= OVERDUE_THRESHOLDS.tier4) {
    return Math.min(TIERED_INTEREST_RATES.tier4, baseRate);
  }
  if (daysOverdue <= OVERDUE_THRESHOLDS.tier5) {
    return Math.min(TIERED_INTEREST_RATES.tier5, baseRate);
  }
  return Math.min(BAD_DEBT_INTEREST_RATE, baseRate);
}

/**
 * Helper function to get the overdue tier for a given days overdue.
 * @param daysOverdue - Number of days past the due date
 * @returns The tier key
 */
export function getOverdueTier(daysOverdue: number): keyof typeof OVERDUE_THRESHOLDS {
  if (daysOverdue <= OVERDUE_THRESHOLDS.tier1) return 'tier1';
  if (daysOverdue <= OVERDUE_THRESHOLDS.tier2) return 'tier2';
  if (daysOverdue <= OVERDUE_THRESHOLDS.tier3) return 'tier3';
  if (daysOverdue <= OVERDUE_THRESHOLDS.tier4) return 'tier4';
  return 'tier5';
}

/**
 * Calculate interest for a given principal and period.
 * @param principal - The outstanding amount
 * @param monthlyRate - Monthly interest rate (as decimal, e.g., 0.025 for 2.5%)
 * @param days - Number of days to calculate interest for
 * @returns The calculated interest amount
 */
export function calculateSimpleInterest(
  principal: number,
  monthlyRate: number,
  days: number
): number {
  const dailyRate = monthlyRate / INTEREST_CALCULATION_DAYS;
  const interest = principal * dailyRate * days;
  return Math.round(interest * 100) / 100;
}

/**
 * Calculate compound interest for a given principal and period.
 * @param principal - The outstanding amount (including previous interest)
 * @param monthlyRate - Monthly interest rate (as decimal)
 * @param days - Number of days to calculate interest for
 * @returns The calculated interest amount
 */
export function calculateCompoundInterest(
  principal: number,
  monthlyRate: number,
  days: number
): number {
  const dailyRate = monthlyRate / INTEREST_CALCULATION_DAYS;
  const compounded = principal * Math.pow(1 + dailyRate, days);
  const interest = compounded - principal;
  return Math.round(interest * 100) / 100;
}

/**
 * Get interest config summary for debugging/logging.
 */
export function getInterestConfigSummary(): Record<string, unknown> {
  return {
    defaultInterestRate: DEFAULT_INTEREST_RATE,
    defaultGraceDays: DEFAULT_GRACE_DAYS,
    compoundInterest: COMPOUND_INTEREST,
    maxInterestRate: MAX_INTEREST_RATE,
    minInterestRate: MIN_INTEREST_RATE,
    calculationDays: INTEREST_CALCULATION_DAYS,
    overdueThresholds: OVERDUE_THRESHOLDS,
    tieredRates: TIERED_INTEREST_RATES,
    minInterestAmount: MIN_INTEREST_AMOUNT,
    maxInterestMultiplier: MAX_INTEREST_MULTIPLIER,
    badDebtDays: BAD_DEBT_DAYS,
    badDebtInterestRate: BAD_DEBT_INTEREST_RATE,
    autoInterest: AUTO_INTEREST_CONFIG,
  };
}

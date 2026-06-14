/**
 * Bundle Utilities
 *
 * Helper functions for bundle visibility logic, savings calculations,
 * and status management.
 */

import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface Bundle {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  trialCount: number;
  trialCoinsIncluded: number;
  rezCoinsBonus: number;
  validDays: number;
  category?: string;
  isFeatured?: boolean;
}

export interface ActiveBundle {
  id: string;
  name: string;
  slotsTotal: number;
  slotsUsed: number;
  expiresAt: string;
}

export interface BundleVisibility {
  shouldShow: boolean;
  reason: 'low_coins' | 'no_active_bundle' | 'campaign' | 'none';
  recommendedBundle: Bundle | null;
}

export interface BundleSavings {
  amount: number;
  percentage: number;
}

export type BundleStatus = 'active' | 'expiring_soon' | 'expired';

// =============================================================================
// VISIBILITY LOGIC
// =============================================================================

/**
 * Determines if the bundles upsell card should be displayed to the user.
 *
 * Rules:
 * - Don't show if user has an active bundle
 * - Don't show if user has >= 200 coins (sufficient balance)
 * - Show otherwise, recommending the first available bundle
 */
export function shouldShowBundlesUpsell(
  userCoins: number,
  activeBundles: ActiveBundle[] | null | undefined,
  bundles: Bundle[] | null | undefined
): BundleVisibility {
  // User has active bundle - don't show upsell
  if (activeBundles && activeBundles.length > 0) {
    return {
      shouldShow: false,
      reason: 'no_active_bundle',
      recommendedBundle: null,
    };
  }

  // User has enough coins for trials
  if (userCoins >= 200) {
    return {
      shouldShow: false,
      reason: 'none',
      recommendedBundle: null,
    };
  }

  // Recommend a bundle for upsell
  const recommended = bundles && bundles.length > 0 ? bundles[0] : null;

  return {
    shouldShow: true,
    reason: 'low_coins',
    recommendedBundle: recommended,
  };
}

/**
 * Determines if bundles upsell should show based on simplified parameters.
 * Use this when you have a recommended bundle to show.
 * Returns BundleVisibility with the recommended bundle.
 */
export function shouldShowBundlesUpsellWithRecommendation(
  userCoins: number,
  hasActiveBundle: boolean,
  recommendedBundle?: Bundle | null
): BundleVisibility {
  if (hasActiveBundle) {
    return {
      shouldShow: false,
      reason: 'no_active_bundle',
      recommendedBundle: null,
    };
  }

  if (userCoins >= 200) {
    return {
      shouldShow: false,
      reason: 'none',
      recommendedBundle: null,
    };
  }

  return {
    shouldShow: true,
    reason: 'low_coins',
    recommendedBundle: recommendedBundle || null,
  };
}

// =============================================================================
// SAVINGS CALCULATIONS
// =============================================================================

/**
 * Calculates the savings amount and percentage for a bundle.
 */
export function getBundleSavings(bundle: Bundle): BundleSavings {
  const savings = bundle.originalPrice - bundle.price;
  const percentage = bundle.originalPrice > 0
    ? Math.round((savings / bundle.originalPrice) * 100)
    : 0;

  return {
    amount: Math.max(0, savings),
    percentage: Math.max(0, Math.min(100, percentage)),
  };
}

/**
 * Formats the savings for display.
 */
export function formatBundleSavings(bundle: Bundle): {
  amountText: string;
  percentageText: string;
} {
  const savings = getBundleSavings(bundle);
  const amountText = `Save ₹${savings.amount}`;
  const percentageText = `(Save ${savings.percentage}%)`;

  return {
    amountText,
    percentageText,
  };
}

/**
 * Gets the price per trial for a bundle.
 */
export function getPricePerTrial(bundle: Bundle): number {
  if (bundle.trialCount <= 0) return bundle.price;
  return Math.round(bundle.price / bundle.trialCount);
}

/**
 * Calculates the effective value of a bundle including bonus coins.
 */
export function getBundleEffectiveValue(bundle: Bundle): {
  totalValue: number;
  coinValue: number;
} {
  // Assume each trial has ~50 coin value
  const trialValue = bundle.trialCount * 50;
  const coinValue = bundle.rezCoinsBonus;
  const totalValue = trialValue + coinValue;

  return {
    totalValue,
    coinValue,
  };
}

// =============================================================================
// STATUS MANAGEMENT
// =============================================================================

/**
 * Determines the status of an active bundle based on expiry date.
 *
 * @returns
 * - 'active': More than 3 days remaining
 * - 'expiring_soon': Less than 3 days remaining
 * - 'expired': Already expired
 */
export function getBundleStatus(bundle: ActiveBundle): BundleStatus {
  const now = Date.now();
  const expiry = new Date(bundle.expiresAt).getTime();
  const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);

  if (daysLeft < 0) return 'expired';
  if (daysLeft < 3) return 'expiring_soon';
  return 'active';
}

/**
 * Gets the number of days remaining until bundle expiry.
 */
export function getDaysRemaining(bundle: ActiveBundle): number {
  const now = Date.now();
  const expiry = new Date(bundle.expiresAt).getTime();
  const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);

  return Math.ceil(Math.max(0, daysLeft));
}

/**
 * Formats the expiry date for display.
 */
export function formatExpiryDate(bundle: ActiveBundle): string {
  const expiry = new Date(bundle.expiresAt);
  const days = getDaysRemaining(bundle);

  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  if (days < 7) return `Expires in ${days} days`;

  return `Expires ${expiry.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })}`;
}

/**
 * Gets the slots remaining for a bundle.
 */
export function getSlotsRemaining(bundle: ActiveBundle): {
  remaining: number;
  total: number;
  percentage: number;
} {
  const remaining = bundle.slotsTotal - bundle.slotsUsed;
  const percentage = bundle.slotsTotal > 0
    ? Math.round((remaining / bundle.slotsTotal) * 100)
    : 0;

  return {
    remaining: Math.max(0, remaining),
    total: bundle.slotsTotal,
    percentage: Math.max(0, Math.min(100, percentage)),
  };
}

// =============================================================================
// BUNDLE COMPARISON
// =============================================================================

/**
 * Sorts bundles by value (best deal first).
 */
export function sortBundlesByValue(bundles: Bundle[]): Bundle[] {
  return [...bundles].sort((a, b) => {
    const savingsA = getBundleSavings(a);
    const savingsB = getBundleSavings(b);
    // Sort by savings percentage descending
    return savingsB.percentage - savingsA.percentage;
  });
}

/**
 * Gets the best value bundle from a list.
 */
export function getBestValueBundle(bundles: Bundle[]): Bundle | null {
  if (!bundles || bundles.length === 0) return null;
  const sorted = sortBundlesByValue(bundles);
  return sorted[0];
}

/**
 * Gets featured bundles.
 */
export function getFeaturedBundles(bundles: Bundle[]): Bundle[] {
  return bundles.filter((b) => b.isFeatured);
}

/**
 * Checks if a bundle is a good deal (>= 30% savings).
 */
export function isGoodDeal(bundle: Bundle): boolean {
  const savings = getBundleSavings(bundle);
  return savings.percentage >= 30;
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Generates the bundle display title.
 */
export function getBundleDisplayTitle(bundle: Bundle): string {
  const count = bundle.trialCount;
  if (count === 1) return `${count} Trial`;
  if (count === 2) return `${count} Trials`;
  return `${count} Trials`;
}

/**
 * Generates a short description for a bundle.
 */
export function getBundleShortDescription(bundle: Bundle): string {
  const title = getBundleDisplayTitle(bundle);
  const savings = getBundleSavings(bundle);
  return `${title} for ₹${bundle.price} (Save ${savings.percentage}%)`;
}

/**
 * Generates the full description for a bundle.
 */
export function getBundleFullDescription(bundle: Bundle): string {
  const parts: string[] = [];

  if (bundle.trialCount > 0) {
    parts.push(`${bundle.trialCount} trials`);
  }

  if (bundle.rezCoinsBonus > 0) {
    parts.push(`${bundle.rezCoinsBonus} bonus coins`);
  }

  if (bundle.validDays > 0) {
    parts.push(`Valid for ${bundle.validDays} days`);
  }

  return parts.join(' | ');
}

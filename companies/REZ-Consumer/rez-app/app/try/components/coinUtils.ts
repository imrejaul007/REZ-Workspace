/**
 * ReZ Try - Coin Utility Functions
 *
 * Helper functions for coin balance visibility, tiering, and recommendations.
 */

// ============================================================================
// TYPES
// ============================================================================

export type CoinTier = 'low' | 'medium' | 'high';

// ============================================================================
// COIN BALANCE UTILITIES
// ============================================================================

/**
 * Check if user needs to buy coins
 */
export function needsToBuyCoins(
  requiredCoins: number,
  userBalance: number
): boolean {
  return userBalance < requiredCoins;
}

/**
 * Get coin balance tier for UI visibility
 * - low: < 200 coins (show prominent buy CTA)
 * - medium: 200-499 coins (normal display)
 * - high: >= 500 coins (minimal display)
 */
export function getCoinTier(balance: number): CoinTier {
  if (balance < 200) return 'low';
  if (balance < 500) return 'medium';
  return 'high';
}

/**
 * Should show bundles upsell (simplified version)
 * Shows when user has low coins and no active bundle subscription
 */
export function shouldShowBundlesUpsellSimple(
  coins: number,
  hasActiveBundle: boolean
): boolean {
  return coins < 200 && !hasActiveBundle;
}

/**
 * Format coin amount for display
 * Shows abbreviated format for large numbers (e.g., 1.2k)
 */
export function formatCoins(amount: number): string {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}k`;
  }
  return amount.toString();
}

/**
 * Coin pack configurations
 */
export const COIN_PACKS = [
  { index: 0, coins: 60, price: 49, label: '₹49' },
  { index: 1, coins: 140, price: 99, label: '₹99' },
  { index: 2, coins: 320, price: 199, label: '₹199' },
  { index: 3, coins: 700, price: 399, label: '₹399' },
] as const;

/**
 * Get recommended coin pack based on required coins and current balance
 * Returns index into COIN_PACKS array
 */
export function getRecommendedPack(
  requiredCoins: number,
  currentBalance: number
): number {
  const needed = requiredCoins - currentBalance;
  if (needed <= 60) return 0; // ₹49 pack
  if (needed <= 140) return 1; // ₹99 pack
  if (needed <= 320) return 2; // ₹199 pack
  return 3; // ₹399 pack
}

/**
 * Get pack recommendation with full details
 */
export function getRecommendedPackDetails(
  requiredCoins: number,
  currentBalance: number
): typeof COIN_PACKS[number] {
  const packIndex = getRecommendedPack(requiredCoins, currentBalance);
  return COIN_PACKS[packIndex];
}

// ============================================================================
// COIN VISIBILITY THRESHOLDS
// ============================================================================

export const COIN_VISIBILITY = {
  // Minimum balance to show "normal" display
  LOW_THRESHOLD: 200,

  // Threshold to show "minimal" display
  MEDIUM_THRESHOLD: 500,

  // Coins needed to trigger upsell
  UPSELL_THRESHOLD: 200,

  // Coins to recommend smallest pack
  SMALL_PACK_THRESHOLD: 60,

  // Coins to recommend medium pack
  MEDIUM_PACK_THRESHOLD: 140,

  // Coins to recommend large pack
  LARGE_PACK_THRESHOLD: 320,
} as const;

// ============================================================================
// COIN ACTION HELPERS
// ============================================================================

/**
 * Get visibility level for coin balance display
 */
export function getCoinVisibilityLevel(balance: number): 'prominent' | 'normal' | 'minimal' {
  const tier = getCoinTier(balance);
  switch (tier) {
    case 'low':
      return 'prominent';
    case 'medium':
      return 'normal';
    case 'high':
      return 'minimal';
  }
}

/**
 * Check if coin badge should pulse (low balance indicator)
 */
export function shouldPulseCoinBadge(balance: number): boolean {
  return balance < COIN_VISIBILITY.LOW_THRESHOLD;
}

/**
 * Get urgency message based on balance
 */
export function getCoinUrgencyMessage(balance: number): string | null {
  if (balance === 0) {
    return 'You need coins to try items!';
  }
  if (balance < 50) {
    return 'Running low on coins';
  }
  return null;
}

// ============================================================================
// COIN PURCHASE FLOW HELPERS
// ============================================================================

/**
 * Determine if user should see coin purchase prompt
 */
export function shouldPromptCoinPurchase(
  requiredCoins: number,
  userBalance: number,
  context: 'trial' | 'bundle' | 'general' = 'trial'
): boolean {
  // Never prompt if user has enough
  if (userBalance >= requiredCoins) {
    return false;
  }

  // In trial context, always prompt if insufficient
  if (context === 'trial') {
    return true;
  }

  // In bundle context, only prompt if very low
  if (context === 'bundle') {
    return userBalance < COIN_VISIBILITY.LOW_THRESHOLD;
  }

  // General context - moderate threshold
  return userBalance < requiredCoins * 0.5;
}

/**
 * Get coins needed text
 */
export function getCoinsNeededText(required: number, balance: number): string {
  const needed = required - balance;
  if (needed <= 0) {
    return 'You have enough coins!';
  }
  return `You need ${formatCoins(needed)} more coins`;
}

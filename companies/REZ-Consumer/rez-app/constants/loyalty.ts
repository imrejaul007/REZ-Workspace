/** Tier hierarchy: bronze < silver < gold < platinum < diamond */
export const TIER_HIERARCHY: Record<string, number> = {
  // Canonical lowercase values (used by frontend)
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
  diamond: 5,
  // Backend UPPERCASE values (User.referralTier from MongoDB)
  // Included so TIER_HIERARCHY lookups never silently return 0 for backend-sourced tiers.
  STARTER: 1,  // maps to bronze
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  PLATINUM: 4,
  DIAMOND: 5,
};

/**
 * Normalizes a backend-sourced tier string (UPPERCASE 6-tier) to the canonical
 * frontend lowercase 5-tier representation.
 *
 * Backend model (User.referralTier): 'STARTER' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND'
 * Frontend canonical tiers:          'bronze'  | 'silver' | 'gold'   | 'platinum' | 'diamond'
 *
 * If the value is already lowercase (e.g. from UnifiedUser.loyaltyTier) it passes through unchanged.
 * Falls back to 'bronze' for unknown values.
 */
export function normalizeUserTier(backendTier: string | undefined | null): 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' {
  const map: Record<string, 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'> = {
    // Backend UPPERCASE → frontend lowercase
    STARTER: 'bronze',
    BRONZE: 'bronze',
    SILVER: 'silver',
    GOLD: 'gold',
    PLATINUM: 'platinum',
    DIAMOND: 'diamond',
    // Lowercase passthrough (already normalized)
    bronze: 'bronze',
    silver: 'silver',
    gold: 'gold',
    platinum: 'platinum',
    diamond: 'diamond',
  };
  return map[backendTier ?? ''] ?? 'bronze';
}

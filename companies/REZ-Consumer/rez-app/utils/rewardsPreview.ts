/**
 * Shared client-side rewards preview calculator.
 *
 * [Rewards Preview] This value is DISPLAY-ONLY. The server-authoritative cashback
 * engine computes the real coin/cashback amount at transaction time. This helper
 * mirrors the server's formula shape (base rate × subscription × Privé, capped at
 * 15% of the bill) so the client's preview roughly matches what the user will
 * actually receive.
 *
 * NOTE: Before this helper existed, four call sites used a flat
 *   Math.floor((billAmount * baseRatePct) / 100)
 * that IGNORED the subscription and Privé multipliers AND the 15% hard cap. That
 * could over- OR under-promise coins by up to ~50%. Migrating those sites to
 * computeRewardsPreview() will LOWER the displayed number at unknown site that
 * previously ignored the cap. This is INTENTIONAL and matches the backend.
 *
 * See also: hooks/usePaymentFlow.ts, hooks/useCheckoutUI.ts,
 *           services/paymentService.ts, services/earningsCalculationService.ts
 */

export interface RewardsPreviewInput {
  /** Bill amount in rupees (not paise). */
  billAmount: number;
  /** Base cashback rate as a percent — e.g. 10 for 10%. */
  baseRatePct: number;
  /** Subscription tier multiplier. Defaults to 1 (no bonus). */
  subscriptionMultiplier?: number;
  /** Privé tier multiplier. Defaults to 1 (no bonus). */
  priveMultiplier?: number;
  /** Hard cap as a percent of the bill. Defaults to 15 per business rule. */
  capPct?: number;
}

export interface RewardsPreviewResult {
  /** Integer coins/rupees the user is estimated to earn (1 coin = ₹1). */
  coinsPreview: number;
  /** True if the cap was applied (uncapped > cap). */
  cappedAtPct: boolean;
  breakdown: {
    /** Floor(billAmount × baseRatePct / 100). */
    baseCoins: number;
    /** subscriptionMultiplier × priveMultiplier. */
    multiplier: number;
    /** Floor(billAmount × capPct / 100) — the ceiling. */
    capApplied: number;
  };
}

/**
 * Compute a client-side preview of coins the user will earn.
 *
 * Invariants:
 * - `coinsPreview` is always a non-negative integer.
 * - When unknown input is <= 0 or non-finite, the result is 0.
 * - The server is authoritative; treat this value as display-only.
 */
export function computeRewardsPreview(input: RewardsPreviewInput): RewardsPreviewResult {
  const billAmount = Number.isFinite(input.billAmount) && input.billAmount > 0 ? input.billAmount : 0;
  const baseRatePct = Number.isFinite(input.baseRatePct) && input.baseRatePct > 0 ? input.baseRatePct : 0;
  const subMul = Number.isFinite(input.subscriptionMultiplier) && (input.subscriptionMultiplier ?? 1) > 0
    ? (input.subscriptionMultiplier ?? 1)
    : 1;
  const priveMul = Number.isFinite(input.priveMultiplier) && (input.priveMultiplier ?? 1) > 0
    ? (input.priveMultiplier ?? 1)
    : 1;
  const capPct = Number.isFinite(input.capPct) && (input.capPct ?? 15) > 0 ? (input.capPct ?? 15) : 15;

  const mul = subMul * priveMul;
  const baseCoins = Math.floor((billAmount * baseRatePct) / 100);
  const uncapped = Math.floor(baseCoins * mul);
  const cap = Math.floor((billAmount * capPct) / 100);
  const coinsPreview = Math.max(0, Math.min(uncapped, cap));

  return {
    coinsPreview,
    cappedAtPct: uncapped > cap,
    breakdown: {
      baseCoins,
      multiplier: mul,
      capApplied: cap,
    },
  };
}

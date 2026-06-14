/**
 * DEPRECATED: cashback calculation must happen server-side. This returns 0 until removed.
 *
 * Previously calculated an estimated savings amount from offer/deal data on the frontend.
 * All financial calculations (cashback amounts, discount values) must now be computed
 * by the backend and returned via API. Callers should use the value from the API response
 * (e.g. offer.saveAmount, offer.discountedPrice) directly instead of calling this function.
 */
export function calculateSaveAmount(opts: {
  cashbackPercent?: number;
  averageBill?: number;
  originalPrice?: number;
  discountedPrice?: number;
  fixedDiscount?: number;
}): number {
  return 0;
}

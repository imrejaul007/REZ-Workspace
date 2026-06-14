import { authClient } from './client';

// NW-CRIT-011: Unauthenticated access to coupon codes allows enumeration attacks.
// All coupon list endpoints require authClient. Additionally, validateCoupon should
// implement CAPTCHA after 3 failed attempts per user per hour to prevent brute-forcing.


// NW-MED-005 FIX: Coupon is the canonical interface. AvailableCoupon (in lib/types/index.ts)
// is a re-export alias pointing here, so both names reference the same type.
export interface Coupon {
  code: string;
  description: string;
  /** 'percent' → discountValue is a percentage (0–100). 'flat' → discountValue is in paise. */
  discountType: 'percent' | 'flat';
  discountValue: number;
  /** in paise; 0 or undefined = no minimum */
  minOrderValue?: number;
  maxDiscount?: number;
}

export async function getStoreCoupons(storeSlug: string): Promise<Coupon[]> {
  const { data } = await authClient.get(
    `/api/web-ordering/store/${storeSlug}/coupons`
  );
  // Backend returns { coupons: [...] } or { success, data: { coupons: [...] } }
  const raw = data?.coupons ?? data?.data?.coupons ?? [];
  return raw as Coupon[];
}

/**
 * Calculates the discount amount for a coupon given a subtotal.
 * - percent: Caps at 100% of subtotal, then applies maxDiscount cap if defined
 * - flat:    Math.min(value, subtotal)
 */
export function calculateCouponDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.discountType === 'flat') {
    return Math.min(coupon.discountValue, subtotal);
  }
  // percent — enforce 100% maximum regardless of discountValue
  const MAX_DISCOUNT_PERCENT = 100;
  const raw = Math.min(
    subtotal * (coupon.discountValue / 100),
    subtotal * (MAX_DISCOUNT_PERCENT / 100) // cap at 100% of subtotal
  );
  return coupon.maxDiscount != null
    ? Math.min(raw, coupon.maxDiscount)
    : raw;
}

import { publicClient, authClient } from './client';
import { CartItem, CouponValidateResponse } from '@/lib/types';
import { Coupon } from '@/lib/api/coupons';

export async function validateCart(storeSlug: string, items: CartItem[]) {
  const { data } = await publicClient.post('/api/web-ordering/cart/validate', {
    storeSlug,
    items,
  });
  if (!data.success) throw new Error(data.message || 'Cart validation failed');
  return data.data as {
    validItems: CartItem[];
    unavailableItems: string[];
  };
}

export async function validateCoupon(
  couponCode: string,
  storeSlug: string,
  subtotal: number
): Promise<CouponValidateResponse> {
  const { data } = await authClient.post('/api/web-ordering/coupon/validate', {
    couponCode,
    storeSlug,
    subtotal,
  });
  if (!data.success) throw new Error(data.message || 'Invalid coupon');
  return data as CouponValidateResponse;
}

// NW-CRIT-011: getAvailableCoupons exposes coupon codes to unauthenticated users.
// Requires authClient. If unauthenticated access is needed for marketing, the endpoint
// should return a sanitized view (no code strings, only discount amounts).
export async function getAvailableCoupons(storeSlug: string): Promise<Coupon[]> {
  const { data } = await authClient.get(
    `/api/web-ordering/store/${storeSlug}/coupons`
  );
  if (!data.success) throw new Error(data.message || 'Failed to load coupons');
  return (data.data ?? []) as Coupon[];
}

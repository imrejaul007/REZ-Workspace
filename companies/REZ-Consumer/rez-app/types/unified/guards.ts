/**
 * @fileoverview Type guard functions for @/types/unified
 * Extracted from types/unified/index.ts for the guards submodule path.
 * Re-exported by types/unified/index.ts.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function hasKey<K extends string>(obj: unknown, key: K): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj;
}

// ─── Guards ───────────────────────────────────────────────────────────────────

export function isProduct(value: unknown): value is Record<string, unknown> {
  if (!isNonEmptyObject(value)) return false;
  return value.productType === 'product' || value.productType === 'service' || value.productType === 'event' || value.productType === undefined;
}

export function isProductAvailable(product: unknown): boolean {
  if (!isNonEmptyObject(product)) return false;
  const p = product as Record<string, unknown>;
  if (p.availabilityStatus === 'in_stock' || p.availabilityStatus === 'low_stock') return true;
  if (p.inventory && typeof p.inventory === 'object') {
    const inv = p.inventory as Record<string, unknown>;
    return inv.isAvailable === true && (inv.stock as number) > 0;
  }
  return false;
}

export function isProductLowStock(product: unknown): boolean {
  if (!isNonEmptyObject(product)) return false;
  const p = product as Record<string, unknown>;
  if (p.availabilityStatus === 'low_stock') return true;
  if (p.inventory && typeof p.inventory === 'object') {
    const inv = p.inventory as Record<string, unknown>;
    const stock = inv.stock as number;
    const threshold = inv.lowStockThreshold as number | undefined;
    return threshold !== undefined ? stock <= threshold : stock <= 5;
  }
  return false;
}

export function isProductOutOfStock(product: unknown): boolean {
  if (!isNonEmptyObject(product)) return false;
  const p = product as Record<string, unknown>;
  if (p.availabilityStatus === 'out_of_stock') return true;
  if (p.inventory && typeof p.inventory === 'object') {
    const inv = p.inventory as Record<string, unknown>;
    return (inv.stock as number) <= 0 || inv.isAvailable === false;
  }
  return false;
}

export function isProductOnSale(product: unknown): boolean {
  if (!isNonEmptyObject(product)) return false;
  const p = product as Record<string, unknown>;
  if (p.isOnSale === true) return true;
  if (p.price && typeof p.price === 'object') {
    const price = p.price as Record<string, unknown>;
    const current = price.current as number | undefined;
    const original = price.original as number | undefined;
    return current !== undefined && original !== undefined && current < original;
  }
  return false;
}

export function isStore(value: unknown): value is Record<string, unknown> {
  if (!isNonEmptyObject(value)) return false;
  return value.storeType === 'physical' || value.storeType === 'online' || value.storeType === 'hybrid' || value.storeType === undefined;
}

export function isStoreOpen(store: unknown): boolean {
  if (!isNonEmptyObject(store)) return false;
  const s = store as Record<string, unknown>;
  return hasKey(s.status, 'isOpen') && s.status.isOpen === true;
}

export function isStoreVerified(store: unknown): boolean {
  if (!isNonEmptyObject(store)) return false;
  const s = store as Record<string, unknown>;
  return s.verified === true;
}

export function isDeliveryAvailable(store: unknown): boolean {
  if (!isNonEmptyObject(store)) return false;
  const s = store as Record<string, unknown>;
  return hasKey(s.delivery, 'isAvailable') && s.delivery.isAvailable === true;
}

export function isPickupAvailable(store: unknown): boolean {
  if (!isNonEmptyObject(store)) return false;
  const s = store as Record<string, unknown>;
  return hasKey(s.pickup, 'isAvailable') && s.pickup.isAvailable === true;
}

export function isCartItem(value: unknown): value is Record<string, unknown> {
  if (!isNonEmptyObject(value)) return false;
  return value.category === 'products' || value.category === 'services' || value.category === 'events' || value.category === undefined;
}

export function isCartItemAvailable(item: unknown): boolean {
  if (!isNonEmptyObject(item)) return false;
  const i = item as Record<string, unknown>;
  if (i.availabilityStatus === 'in_stock' || i.availabilityStatus === 'low_stock') return true;
  if (i.inventory && typeof i.inventory === 'object') {
    const inv = i.inventory as Record<string, unknown>;
    return inv.isAvailable === true && (inv.stock as number) > 0;
  }
  return false;
}

export function isCartItemLocked(item: unknown): boolean {
  if (!isNonEmptyObject(item)) return false;
  const i = item as Record<string, unknown>;
  if (i.isLocked !== true) return false;
  if (typeof i.lockExpiresAt === 'string') {
    return new Date(i.lockExpiresAt) > new Date();
  }
  return false;
}

export function isUser(value: unknown): value is Record<string, unknown> {
  if (!isNonEmptyObject(value)) return false;
  return ['user', 'admin', 'merchant', 'support', 'operator', 'super_admin', 'consumer'].includes(value.role as string);
}

export function isUserVerified(user: unknown): boolean {
  if (!isNonEmptyObject(user)) return false;
  return (user as Record<string, unknown>).emailVerified === true;
}

export function isUserAdmin(user: unknown): boolean {
  if (!isNonEmptyObject(user)) return false;
  return (user as Record<string, unknown>).role === 'admin';
}

export function isUserMerchant(user: unknown): boolean {
  if (!isNonEmptyObject(user)) return false;
  return (user as Record<string, unknown>).role === 'merchant';
}

export function isOrder(value: unknown): value is Record<string, unknown> {
  return isNonEmptyObject(value);
}

export function canCancelOrder(order: unknown): boolean {
  if (!isNonEmptyObject(order)) return false;
  const o = order as Record<string, unknown>;
  if (o.canCancel === false) return false;
  const cancelable = ['placed', 'confirmed', 'pending'];
  return cancelable.includes(o.status as string);
}

export function canReturnOrder(order: unknown): boolean {
  if (!isNonEmptyObject(order)) return false;
  const o = order as Record<string, unknown>;
  if (o.canReturn === false) return false;
  if (o.status !== 'delivered') return false;
  return !o.return;
}

export function isOrderPaid(order: unknown): boolean {
  if (!isNonEmptyObject(order)) return false;
  return (order as Record<string, unknown>).paymentStatus === 'paid';
}

export function isOrderDelivered(order: unknown): boolean {
  if (!isNonEmptyObject(order)) return false;
  return (order as Record<string, unknown>).status === 'delivered';
}

export function isReview(value: unknown): value is Record<string, unknown> {
  if (!isNonEmptyObject(value)) return false;
  const r = value as Record<string, unknown>;
  const rating = r.rating as number;
  return typeof rating === 'number' && rating >= 1 && rating <= 5;
}

export function isVerifiedReview(review: unknown): boolean {
  if (!isNonEmptyObject(review)) return false;
  return (review as Record<string, unknown>).verified === true;
}

export function hasReviewImages(review: unknown): boolean {
  if (!isNonEmptyObject(review)) return false;
  const r = review as Record<string, unknown>;
  return Array.isArray(r.images) && r.images.length > 0;
}

export function hasMerchantReply(review: unknown): boolean {
  if (!isNonEmptyObject(review)) return false;
  const r = review as Record<string, unknown>;
  return typeof r.merchantReply === 'string' && r.merchantReply.length > 0;
}

export function isRecentReview(review: unknown): boolean {
  if (!isNonEmptyObject(review)) return false;
  const r = review as Record<string, unknown>;
  if (typeof r.createdAt !== 'string') return false;
  const created = new Date(r.createdAt).getTime();
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return created >= thirtyDaysAgo;
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value);
}

export function isPositiveNumber(value: unknown): value is number {
  return isValidNumber(value) && value > 0;
}

export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

export function isNonEmptyArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * usePOSCartState - Extracted state definitions for POS cart
 * Part of usePOSCart.ts refactoring (Phase 7)
 */

import { POSBillItem } from '@/services/api/pos';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem extends POSBillItem {
  cartId: string;
  gstRate?: number;
  stock?: number;
}

export interface ProductModifierOption {
  label: string;
  price: number;
  isDefault?: boolean;
}

export interface ProductModifier {
  name: string;
  required: boolean;
  multiSelect: boolean;
  options: ProductModifierOption[];
}

export interface SimpleProduct {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  category?: string;
  inStock: boolean;
  stock?: number;
  modifiers?: ProductModifier[];
  gstRate?: number;
}

export interface UpsellSuggestion {
  ruleId: string;
  productId: string;
  name: string;
  price: number;
  finalPrice: number;
  image?: string;
  badgeText: string;
  discountPercent?: number;
}

export interface SyncStatus {
  isSyncing: boolean;
  pendingActions: number;
  lastSyncAt: Date | null;
  syncErrors: string[];
}

export type CustomerMode = 'none' | 'walk-in' | 'selected';

// ─── GST Helpers (also used by the screen) ───────────────────────────────────

export function calcLineGST(price: number, qty: number, gstRate: number) {
  const baseAmount = (price * qty * 100) / (100 + gstRate);
  const gstAmount = price * qty - baseAmount;
  return {
    baseAmount: Math.round(baseAmount * 100) / 100,
    gstAmount: Math.round(gstAmount * 100) / 100,
  };
}

export function calcBillGST(cartItems: CartItem[]) {
  let subtotal = 0;
  let totalGST = 0;
  const breakdown: Record<number, { base: number; gst: number }> = {};

  for (const item of cartItems) {
    const rate = item.gstRate || 0;
    const { baseAmount, gstAmount } = calcLineGST(item.price, item.quantity, rate);
    subtotal += baseAmount;
    totalGST += gstAmount;
    if (!breakdown[rate]) breakdown[rate] = { base: 0, gst: 0 };
    breakdown[rate].base += baseAmount;
    breakdown[rate].gst += gstAmount;
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    cgst: Math.round((totalGST / 2) * 100) / 100,
    sgst: Math.round((totalGST / 2) * 100) / 100,
    totalGST: Math.round(totalGST * 100) / 100,
    grandTotal: Math.round((subtotal + totalGST) * 100) / 100,
    breakdown,
  };
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

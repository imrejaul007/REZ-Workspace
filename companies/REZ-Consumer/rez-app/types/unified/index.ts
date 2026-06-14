/**
 * @fileoverview Unified type stubs for @/types/unified
 *
 * These stubs provide the types, mappers, and validators that were referenced
 * across rez-app-consumer but never existed at this path.
 *
 * NOTE: This module is a temporary shim. The canonical source of truth for shared
 * types is @rez/shared-types (packages/shared-types/src/index.ts). Types here that
 * are used in production code should eventually be migrated to shared-types and
 * imported from there instead.
 */

// ─── Re-export guards from submodule ───────────────────────────────────────────
export * from './guards';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  productId?: string;
  storeId?: string;
  name?: string;
  price?: number;
  quantity?: number;
  category?: 'products' | 'services' | 'events';
  availabilityStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  inventory?: { stock?: number; isAvailable?: boolean };
  isLocked?: boolean;
  lockExpiresAt?: string;
}

export interface Store {
  id?: string;
  name?: string;
  location?: {
    address?: string;
    coordinates?: { latitude?: number; longitude?: number };
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  hours?: Record<string, unknown>;
  status?: { isOpen?: boolean; status?: string };
  verified?: boolean;
  storeType?: 'physical' | 'online' | 'hybrid';
  delivery?: { isAvailable?: boolean };
  pickup?: { isAvailable?: boolean };
  [key: string]: unknown;
}

export interface Product {
  id?: string;
  name?: string;
  storeId?: string;
  price?: { current?: number; original?: number; currency?: string };
  images?: Array<{ id?: string; url?: string; alt?: string; isMain?: boolean }>;
  inventory?: { stock?: number; isAvailable?: boolean };
  productType?: 'product' | 'service' | 'event';
  availabilityStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  isOnSale?: boolean;
  [key: string]: unknown;
}

export interface User {
  id?: string;
  email?: string;
  profile?: { name?: string; avatar?: string };
  preferences?: Record<string, unknown>;
  role?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  [key: string]: unknown;
}

export interface Order {
  id?: string;
  orderNumber?: string;
  userId?: string;
  items?: unknown[];
  pricing?: { total?: number };
  shippingAddress?: unknown;
  paymentMethod?: unknown;
  status?: string;
  paymentStatus?: string;
  canCancel?: boolean;
  canReturn?: boolean;
  return?: unknown;
  [key: string]: unknown;
}

export interface CartItemType {
  id: string;
  productId?: string;
  storeId?: string;
  name?: string;
  price?: number;
  quantity?: number;
  category?: 'products' | 'services' | 'events';
  availabilityStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  inventory?: { stock?: number; isAvailable?: boolean };
  isLocked?: boolean;
  lockExpiresAt?: string;
}

// Aliases for compatibility with existing re-exports
export type OrderItem = Record<string, unknown>;
export type UnifiedOrder = Order;
export type UnifiedOrderItem = OrderItem;
export type UnifiedCartItem = CartItem;
export type UnifiedStore = Store;
export type UnifiedProduct = Product;
export type UnifiedUser = User;

// ─── Mappers (passthrough — data is already in the right shape) ───────────────

export function toOrder(data: unknown): unknown {
  return data;
}

export function toCartItem(data: unknown): CartItem {
  return (data as CartItem) ?? { id: '' };
}

export function toStore(data: unknown): Store {
  return (data as Store) ?? {};
}

export function toProduct(data: unknown): Product {
  return (data as Product) ?? {};
}

// ─── Validators ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors?: Array<{ message: string }>;
}

export function validateCartItem(item: unknown): boolean {
  if (!item || typeof item !== 'object') return false;
  return true;
}

export function validateUser(user: unknown): boolean {
  if (!user || typeof user !== 'object') return false;
  return true;
}

export function validateStore(store: unknown): ValidationResult {
  if (!store || typeof store !== 'object') {
    return { valid: false, errors: [{ message: 'Store must be an object' }] };
  }
  return { valid: true };
}

export function validateProduct(product: unknown): ValidationResult {
  if (!product || typeof product !== 'object') {
    return { valid: false, errors: [{ message: 'Product must be an object' }] };
  }
  return { valid: true };
}

export function validateUnifiedStore(store: unknown): ValidationResult {
  return validateStore(store);
}

export function validateUnifiedProduct(product: unknown): ValidationResult {
  return validateProduct(product);
}

export function validateUnifiedCartItem(item: unknown): boolean {
  return validateCartItem(item);
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

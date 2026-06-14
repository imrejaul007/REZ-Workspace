'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/lib/types';

interface CartState {
  storeSlug: string | null;
  tableNumber: string | null;
  items: CartItem[];
  groupOrderId: string | null;
  scheduledFor: string | null;

  setStore: (slug: string, tableNumber?: string) => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (itemId: string, customizations?: Record<string, string[]>) => void;
  updateQuantity: (itemId: string, quantity: number, customizations?: Record<string, string[]>) => void;
  clearCart: () => void;
  setGroupOrderId: (id: string | null) => void;
  setScheduledFor: (dt: string | null) => void;

  // Computed
  totalItems: () => number;
  subtotal: () => number;
}

/** Stable key for deduplication: sorts groups and option arrays so order doesn't matter */
function cartKey(itemId: string, customizations: Record<string, string[]>): string {
  const sorted = Object.entries(customizations)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => [k, [...v].sort()]);
  return `${itemId}__${JSON.stringify(sorted)}`;
}

function sameItem(a: CartItem, itemId: string, customizations: Record<string, string[]>): boolean {
  return cartKey(a.itemId, a.customizations) === cartKey(itemId, customizations);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      storeSlug: null,
      tableNumber: null,
      items: [],
      groupOrderId: null,
      scheduledFor: null,

      setStore: (slug, tableNumber) => {
        // If switching stores, clear cart
        if (get().storeSlug && get().storeSlug !== slug) {
          set({ storeSlug: slug, tableNumber: tableNumber || null, items: [], groupOrderId: null });
        } else {
          set({ storeSlug: slug, tableNumber: tableNumber || null });
        }
      },

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => sameItem(i, item.itemId, item.customizations));
          if (existing) {
            return {
              items: state.items.map((i) =>
                sameItem(i, item.itemId, item.customizations)
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        });
      },

      removeItem: (itemId, customizations = {}) => {
        set((state) => ({
          items: state.items.filter((i) => !sameItem(i, itemId, customizations as Record<string, string[]>)),
        }));
      },

      updateQuantity: (itemId, quantity, customizations = {}) => {
        if (quantity <= 0) {
          get().removeItem(itemId, customizations as Record<string, string[]>);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            sameItem(i, itemId, customizations as Record<string, string[]>) ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [], groupOrderId: null, scheduledFor: null }),

      setGroupOrderId: (id) => set({ groupOrderId: id }),

      setScheduledFor: (dt) => set({ scheduledFor: dt }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'rez-cart' }
  )
);

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BillItem {
  id: string; // local id for keying
  name: string;
  qty: number;
  unitPrice: number; // in paise
}

interface BillBuilderStore {
  items: BillItem[];
  discount: number; // in paise

  addItem: (name: string, unitPrice: number, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  updatePrice: (id: string, unitPrice: number) => void;
  setDiscount: (paise: number) => void;
  clearBill: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

// NW-MED-024: Use crypto.randomUUID() instead of Date.now() to avoid collision on same-millisecond calls.
function localId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const useBillBuilderStore = create<BillBuilderStore>()(
  persist(
    (set, get) => ({
      items: [],
      discount: 0,

      addItem: (name, unitPrice, qty = 1) => {
        set((s) => ({
          items: [...s.items, { id: localId(), name, unitPrice, qty }],
        }));
      },

      removeItem: (id) => {
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
      },

      updateQty: (id, qty) => {
        if (qty < 1) return;
        set((s) => ({
          items: s.items.map((i) => i.id === id ? { ...i, qty } : i),
        }));
      },

      updatePrice: (id, unitPrice) => {
        if (unitPrice < 0) return;
        set((s) => ({
          items: s.items.map((i) => i.id === id ? { ...i, unitPrice } : i),
        }));
      },

      setDiscount: (paise) => {
        set({ discount: Math.max(0, paise) });
      },

      clearBill: () => {
        set({ items: [], discount: 0 });
      },

      getSubtotal: () => {
        return get().items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
      },

      getTotal: () => {
        const { items, discount } = get();
        return Math.max(0, items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0) - discount);
      },
    }),
    {
      name: 'rez-bill-builder',
      // NW-MED-030: Persist bill builder state so users don't lose work on reload.
      // CartStore already uses persist; BillBuilderStore now does too.
      partialize: (state) => ({
        items: state.items,
        discount: state.discount,
      }),
    }
  )
);

'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { useCartStore } from '@/lib/store/cartStore';
import { StoreInfo, MenuCategory } from '@/lib/types';

interface StoreContextValue {
  store: StoreInfo;
  categories: MenuCategory[];
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreContextProvider');
  return ctx;
}

export default function StoreContextProvider({
  store,
  categories = [],
  children,
}: {
  store: StoreInfo;
  categories?: MenuCategory[];
  children: React.ReactNode;
}) {
  const items = useCartStore((s) => s.items);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for cart store tracking
  const _storeSlug = useCartStore((s) => s.storeSlug);

  // NW-MED-011: Show confirmation when switching to a different store with items in cart.
  // Uses a ref to track the previous store slug so we can detect cross-store navigation.
  const prevSlugRef = useRef<string | null>(null);

  useEffect(() => {
    const prevSlug = prevSlugRef.current;
    prevSlugRef.current = store.slug;

    if (prevSlug && prevSlug !== store.slug && items.length > 0) {
      const confirmed = window.confirm(
        'Switching stores will clear your current cart. Continue?',
      );
      if (!confirmed) {
        // Restore the previous slug in the store so cart state stays consistent
        useCartStore.getState().setStore(prevSlug);
      }
      // If confirmed, setStore will be called and will clear the cart
    }
    useCartStore.getState().setStore(store.slug);
  }, [store.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <StoreContext.Provider value={{ store, categories }}>
      {children}
    </StoreContext.Provider>
  );
}

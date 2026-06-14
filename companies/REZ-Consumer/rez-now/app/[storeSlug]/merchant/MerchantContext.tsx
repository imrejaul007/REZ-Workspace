'use client';

import { createContext, useContext, ReactNode } from 'react';
import { OutletOption } from '@/components/merchant/StoreSwitcher';

interface MerchantContextValue {
  outlets: OutletOption[];
  selectedOutlet: string; // '' means "all outlets"
  setSelectedOutlet: (slug: string) => void;
  isMultiStore: boolean;
}

const MerchantContext = createContext<MerchantContextValue>({
  outlets: [],
  selectedOutlet: '',
  setSelectedOutlet: () => {},
  isMultiStore: false,
});

export function useMerchantContext() {
  return useContext(MerchantContext);
}

export function MerchantContextProvider({
  outlets,
  selectedOutlet,
  setSelectedOutlet,
  children,
}: {
  outlets: OutletOption[];
  selectedOutlet: string;
  setSelectedOutlet: (slug: string) => void;
  children: ReactNode;
}) {
  return (
    <MerchantContext.Provider
      value={{
        outlets,
        selectedOutlet,
        setSelectedOutlet,
        isMultiStore: outlets.length > 1,
      }}
    >
      {children}
    </MerchantContext.Provider>
  );
}

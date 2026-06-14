import { create } from 'zustand';
import {
  OffersTheme,
  OffersThemeMode,
  LightTheme,
  getOffersTheme,
} from '@/constants/OffersTheme';

interface OffersThemeStoreState {
  theme: OffersTheme;
  mode: OffersThemeMode;
  isDark: boolean;
  setMode: (mode: OffersThemeMode) => void;
}

type StoreSet = (partial: Partial<OffersThemeStoreState> | ((s: OffersThemeStoreState) => Partial<OffersThemeStoreState>), replace?: boolean) => void;
type StoreGet = () => OffersThemeStoreState;

export const useOffersThemeStore = create<OffersThemeStoreState>((set: StoreSet) => ({
  theme: LightTheme,
  mode: 'light',
  isDark: false,

  setMode: (mode: OffersThemeMode) => {
    set({
      theme: getOffersTheme(mode),
      mode,
      isDark: mode === 'dark',
    });
  },
}));

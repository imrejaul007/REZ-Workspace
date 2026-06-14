// @ts-nocheck
/**
 * Screen State Persistence Store
 * Persists scroll positions, form data, and navigation state across app restarts
 * Uses MMKV for high-performance storage (10-100x faster than AsyncStorage)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkv } from '@/utils/mmkvStorage';

interface ScrollPosition {
  x: number;
  y: number;
}

interface FormData {
  [key: string]: string | number | boolean | null;
}

interface ScreenState {
  // Scroll positions per route
  scrollPositions: Record<string, ScrollPosition>;

  // Form drafts per route
  formDrafts: Record<string, FormData>;

  // Filter/sort selections
  filterSelections: Record<string, Record<string, string | string[]>>;

  // Last visited routes
  recentRoutes: string[];

  // Actions
  setScrollPosition: (route: string, position: ScrollPosition) => void;
  getScrollPosition: (route: string) => ScrollPosition | null;

  setFormDraft: (route: string, data: FormData) => void;
  getFormDraft: (route: string) => FormData | null;
  clearFormDraft: (route: string) => void;

  setFilterSelection: (route: string, filters: Record<string, string | string[]>) => void;
  getFilterSelection: (route: string) => Record<string, string | string[]> | null;

  addRecentRoute: (route: string) => void;
  getRecentRoutes: () => string[];
}

// MMKV-based storage for Zustand persist
const mmkvStorage = {
  getItem: (name: string): string | null => {
    const value = mmkv.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    mmkv.setString(name, value);
  },
  removeItem: (name: string): void => {
    mmkv.delete(name);
  },
};

export const useScreenStateStore = create<ScreenState>()(
  persist(
    (set, get) => ({
      scrollPositions: {},
      formDrafts: {},
      filterSelections: {},
      recentRoutes: [],

      setScrollPosition: (route, position) =>
        set((state) => ({
          scrollPositions: {
            ...state.scrollPositions,
            [route]: position,
          },
        })),

      getScrollPosition: (route) => {
        const state = get();
        return state.scrollPositions[route] || null;
      },

      setFormDraft: (route, data) =>
        set((state) => ({
          formDrafts: {
            ...state.formDrafts,
            [route]: {
              ...data,
              _savedAt: Date.now(),
            },
          },
        })),

      getFormDraft: (route) => {
        const state = get();
        const draft = state.formDrafts[route];
        if (!draft) return null;

        const savedAt = (draft as FormData & { _savedAt?: number })._savedAt;
        if (savedAt && Date.now() - savedAt > 24 * 60 * 60 * 1000) {
          get().clearFormDraft(route);
          return null;
        }

        return draft;
      },

      clearFormDraft: (route) =>
        set((state) => {
          const { [route]: _, ...restDrafts } = state.formDrafts;
          return { formDrafts: restDrafts };
        }),

      setFilterSelection: (route, filters) =>
        set((state) => ({
          filterSelections: {
            ...state.filterSelections,
            [route]: filters,
          },
        })),

      getFilterSelection: (route) => {
        const state = get();
        return state.filterSelections[route] || null;
      },

      addRecentRoute: (route) =>
        set((state) => {
          const filtered = state.recentRoutes.filter((r) => r !== route);
          const updated = [route, ...filtered].slice(0, 10);
          return { recentRoutes: updated };
        }),

      getRecentRoutes: () => {
        return get().recentRoutes;
      },
    }),
    {
      name: 'rez-screen-state-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        scrollPositions: state.scrollPositions,
        formDrafts: state.formDrafts,
        filterSelections: state.filterSelections,
        recentRoutes: state.recentRoutes,
      }),
    }
  )
);

// Hook for easy scroll position persistence
export function useScrollPosition(route: string) {
  const scrollPosition = useScreenStateStore((state) => state.scrollPositions[route]);
  const setScrollPosition = useScreenStateStore((state) => state.setScrollPosition);

  return {
    initialScrollPosition: scrollPosition || { x: 0, y: 0 },
    saveScrollPosition: (position: ScrollPosition) => setScrollPosition(route, position),
  };
}

// Hook for form draft persistence
export function useFormDraft(route: string) {
  const draft = useScreenStateStore((state) => state.formDrafts[route]);
  const setFormDraft = useScreenStateStore((state) => state.setFormDraft);
  const clearFormDraft = useScreenStateStore((state) => state.clearFormDraft);

  const cleanDraft = draft && (draft as unknown)._savedAt
    ? (Date.now() - (draft as unknown)._savedAt > 24 * 60 * 60 * 1000 ? null : draft)
    : draft;

  return {
    initialValues: cleanDraft || {},
    saveDraft: (data: FormData) => setFormDraft(route, data),
    clearDraft: () => clearFormDraft(route),
  };
}

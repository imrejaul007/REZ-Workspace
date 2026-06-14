import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { TabId } from '@/components/homepage/HomeTabSection';
import { logger } from '@/utils/logger';

// Legacy type alias for backward compatibility
export type HomeTabId = 'rez' | 'rez-mall' | 'cash-store';

const TAB_STORAGE_KEY = '@rez_active_tab';

const TAB_TO_LEGACY: Record<TabId, HomeTabId> = {
  'near-u': 'rez',
  'mall': 'rez-mall',
  'cash': 'cash-store',
  'prive': 'rez',
};

const LEGACY_TO_TAB: Record<HomeTabId, TabId> = {
  'rez': 'near-u',
  'rez-mall': 'mall',
  'cash-store': 'cash',
};

interface PriveEligibility {
  isEligible: boolean;
  score: number;
  tier: 'none' | 'entry' | 'signature' | 'elite';
  pillars: unknown[];
  trustScore: number;
  hasSeenGlowThisSession: boolean;
}

const DEFAULT_PRIVE_ELIGIBILITY: PriveEligibility = {
  isEligible: false,
  score: 0,
  tier: 'none',
  pillars: [],
  trustScore: 0,
  hasSeenGlowThisSession: false,
};

interface HomeTabState {
  activeTab: TabId;
  isLoaded: boolean;
  isTransitioning: boolean;
  priveEligibility: PriveEligibility;

  // Derived (computed from activeTab)
  activeHomeTab: HomeTabId;
  isNearUActive: boolean;
  isMallActive: boolean;
  isCashActive: boolean;
  isPriveActive: boolean;
  isRezMallActive: boolean;
  isCashStoreActive: boolean;
  isPriveEligible: boolean;

  // Actions
  setActiveTab: (tab: TabId) => void;
  setActiveHomeTab: (tab: HomeTabId) => void;
  refreshPriveEligibility: () => Promise<void>;
  markPriveGlowSeen: () => void;
  loadPersistedTab: () => void;

  // Scroll to top
  scrollToTop: () => void;
  registerScrollToTop: (callback: () => void) => void;
}

// Scroll callback stored outside Zustand (ref-like behavior)
let _scrollToTopCallback: (() => void) | null = null;
let _transitionTimer: ReturnType<typeof setTimeout> | null = null;

type StoreSet = (partial: Partial<HomeTabState> | ((s: HomeTabState) => Partial<HomeTabState>), replace?: boolean) => void;
type StoreGet = () => HomeTabState;

export const useHomeTabStore = create<HomeTabState>((set: StoreSet) => ({
  activeTab: 'near-u',
  isLoaded: false,
  isTransitioning: false,
  priveEligibility: DEFAULT_PRIVE_ELIGIBILITY,

  // Derived
  activeHomeTab: 'rez',
  isNearUActive: true,
  isMallActive: false,
  isCashActive: false,
  isPriveActive: false,
  isRezMallActive: false,
  isCashStoreActive: false,
  isPriveEligible: false,

  setActiveTab: (tab: TabId) => {
    set({
      activeTab: tab,
      isTransitioning: true,
      activeHomeTab: TAB_TO_LEGACY[tab],
      isNearUActive: tab === 'near-u',
      isMallActive: tab === 'mall',
      isCashActive: tab === 'cash',
      isPriveActive: tab === 'prive',
      isRezMallActive: tab === 'mall',
      isCashStoreActive: tab === 'cash',
    });

    // Persist
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TAB_STORAGE_KEY, tab);
      }
      AsyncStorage.setItem(TAB_STORAGE_KEY, tab).catch(() => {});
    } catch {}

    // End transition
    if (_transitionTimer) clearTimeout(_transitionTimer);
    _transitionTimer = setTimeout(() => {
      set({ isTransitioning: false });
    }, 250);
  },

  setActiveHomeTab: (tab: HomeTabId) => {
    const newTab = LEGACY_TO_TAB[tab] || 'near-u';
    useHomeTabStore.getState().setActiveTab(newTab);
  },

  refreshPriveEligibility: async () => {
    try {
      // Import here to avoid circular dependencies
      const apiClient = require('@/services/apiClient').default || require('@/services/apiClient');

      const response = await (apiClient.get as Function)(
        '/api/v1/user/prive/eligibility'
      ) as { success: boolean; data?: PriveEligibility };

      if (response.success && response.data) {
        set({
          priveEligibility: {
            isEligible: response.data.isEligible ?? false,
            score: response.data.score ?? 0,
            tier: response.data.tier ?? 'none',
            pillars: response.data.pillars ?? [],
            trustScore: response.data.trustScore ?? 0,
            hasSeenGlowThisSession: false,
          },
        });
      }
    } catch (error) {
      logger.warn('[homeTabStore] Failed to fetch Prive eligibility:', { error });
      // Keep the default state on error
    }
  },

  markPriveGlowSeen: () => {
    set((state: HomeTabState) => ({
      priveEligibility: {
        ...state.priveEligibility,
        hasSeenGlowThisSession: true,
      },
    }));
  },

  loadPersistedTab: () => {
    // Only restore tabs the user explicitly chose — never restore 'mall' because
    // the old auto-switch bug may have persisted it incorrectly. Always start on near-u.
    const allowPersisted: TabId[] = ['near-u', 'cash'];

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedTab = window.localStorage.getItem(TAB_STORAGE_KEY);
        // Clear any stale 'mall' or 'prive' persisted by old auto-switch logic
        if (storedTab && !allowPersisted.includes(storedTab as TabId)) {
          window.localStorage.removeItem(TAB_STORAGE_KEY);
        } else if (storedTab && allowPersisted.includes(storedTab as TabId)) {
          const tab = storedTab as TabId;
          set({
            activeTab: tab,
            activeHomeTab: TAB_TO_LEGACY[tab],
            isNearUActive: tab === 'near-u',
            isMallActive: tab === 'mall',
            isCashActive: tab === 'cash',
            isPriveActive: tab === 'prive',
            isRezMallActive: tab === 'mall',
            isCashStoreActive: tab === 'cash',
          });
        }
      } catch {}
      set({ isLoaded: true });
      return;
    }

    AsyncStorage.getItem(TAB_STORAGE_KEY).then(storedTab => {
      if (storedTab && !allowPersisted.includes(storedTab as TabId)) {
        // Clear stale value set by the old buggy auto-switch
        AsyncStorage.removeItem(TAB_STORAGE_KEY).catch(() => {});
      } else if (storedTab && allowPersisted.includes(storedTab as TabId)) {
        const tab = storedTab as TabId;
        set({
          activeTab: tab,
          activeHomeTab: TAB_TO_LEGACY[tab],
          isNearUActive: tab === 'near-u',
          isMallActive: tab === 'mall',
          isCashActive: tab === 'cash',
          isPriveActive: tab === 'prive',
          isRezMallActive: tab === 'mall',
          isCashStoreActive: tab === 'cash',
        });
      }
    }).catch(() => {}).finally(() => set({ isLoaded: true }));
  },

  scrollToTop: () => {
    if (_scrollToTopCallback) _scrollToTopCallback();
  },

  registerScrollToTop: (callback: () => void) => {
    _scrollToTopCallback = callback;
  },
}));

// Auto-load persisted tab on import
useHomeTabStore.getState().loadPersistedTab();

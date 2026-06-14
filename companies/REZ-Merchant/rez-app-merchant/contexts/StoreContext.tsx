import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { storeService, Store, CreateStoreData, UpdateStoreData } from '../services/api/stores';
import { storageService } from '../services/storage';
import { useAuth } from './AuthContext';
import { logger } from '@/utils/logger';

interface StoreContextType {
  stores: Store[];
  activeStore: Store | null;
  isLoading: boolean;
  error: string | null;
  refreshStores: () => Promise<void>;
  setActiveStore: (store: Store) => Promise<void>;
  activateStoreById: (storeId: string) => Promise<void>;
  deactivateStoreById: (storeId: string) => Promise<void>;
  createStore: (storeData: CreateStoreData) => Promise<Store>;
  updateStore: (storeId: string, storeData: UpdateStoreData) => Promise<Store>;
  deleteStore: (storeId: string) => Promise<void>;
  /** Persist the active store's slug to local storage so it survives re-login */
  setActiveStoreSlug: (slug: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

/** Typed key into storageService.StorageKeys for the active store ID */
const ACTIVE_STORE_KEY = 'ACTIVE_STORE_ID' as const;
/** Typed key for the active store's slug (persisted so re-login doesn't lose it) */
const ACTIVE_STORE_SLUG_KEY = 'ACTIVE_STORE_SLUG' as const;

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [activeStore, setActiveStoreState] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load stores from API
   * MERCH-008: Fixed circular dependency - removed activeStore from dependencies
   * since we only check it locally within the function scope
   */
  const loadStores = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await storeService.getStores();
      const loadedStores = response.data || [];

      setStores(loadedStores);

      // If we have stores but no active store, try to load active store
      // Note: We check activeStore as a local variable to avoid dependency issues
      if (loadedStores.length > 0) {
        // Don't reference activeStore from state here to avoid circular dependency
        // The separate useEffect will handle loading active store when needed
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('[StoreContext] loadStores failed:', error);
      setError(err.message || 'Failed to load stores');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load active store
   * MERCH-010: Removed eslint-disable and fixed dependencies to avoid circular reference
   *
   * Also restores the persisted slug from local storage so re-login doesn't lose
   * the REZ Now page URL set during the onboarding wizard.
   */
  const loadActiveStore = useCallback(async (storesList?: Store[]) => {
    // Note: storesList is passed as parameter to avoid circular dependency with stores
    try {
      const availableStores = storesList || [];
      // Restore persisted slug so REZ Now wizard state survives re-login
      const storedSlug = (await storageService.getItem<string>(ACTIVE_STORE_SLUG_KEY)) || undefined;

      // Helper: set active store, merging in the persisted slug if store lacks one
      const setActive = (store: Store) => {
        // MED-6 FIX: Log in dev mode when setActive is called with null/undefined
        if (!store) {
          logger.warn('[StoreContext] setActive called with null or undefined store');
          return;
        }
        setActiveStoreState(storedSlug && !store.slug ? { ...store, slug: storedSlug } : store);
      };

      // First try to get from storage
      const storedStoreId = await storageService.getItem<string>(ACTIVE_STORE_KEY);

      if (storedStoreId) {
        // Check if stored store is in the available stores list
        const storedStore = availableStores.find((s) => s._id === storedStoreId);
        if (storedStore) {
          setActive(storedStore);
          return;
        }

        // Try to fetch the store by ID
        try {
          const store = await storeService.getStoreById(storedStoreId);
          setActive(store);
          return;
        } catch (error: unknown) {
          // Graceful handling - just log and continue to next step
          logger.warn(`[StoreContext] Failed to fetch stored store by ID: ${storedStoreId}`, error);
          // Store ID in storage might be invalid, try to get active store from API
        }
      }

      // Get active store from API
      try {
        const store = await storeService.getActiveStore();
        setActive(store);

        // Save to storage
        if (store) {
          await storageService.setItem(ACTIVE_STORE_KEY, store._id);
        }
        return;
      } catch (error: unknown) {
        logger.warn('[StoreContext] Failed to fetch active store from API:', error);
        // No active store from API, will use first available store
      }

      // If no active store from API, use first store if available
      if (availableStores.length > 0) {
        logger.debug('Using first available store as fallback:', availableStores[0]._id);
        setActive(availableStores[0]);
        await storageService.setItem(ACTIVE_STORE_KEY, availableStores[0]._id);
      } else {
        logger.warn('No stores available for fallback active store selection');
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('[StoreContext] loadActiveStore failed:', error);
      // If no active store, use first store if available
      const finalAvailableStores = storesList || [];
      if (finalAvailableStores.length > 0) {
        setActiveStoreState(finalAvailableStores[0]);
        await storageService.setItem(ACTIVE_STORE_KEY, finalAvailableStores[0]._id);
      }
    }
  }, []);

  /**
   * Persist the active store's slug to local storage so it survives re-login.
   * Called by the REZ Now wizard after the slug is saved to the backend.
   */
  const setActiveStoreSlug = useCallback(
    async (slug: string) => {
      await storageService.setItem(ACTIVE_STORE_SLUG_KEY, slug);
      if (activeStore) {
        setActiveStoreState({ ...activeStore, slug });
      }
    },
    [activeStore]
  );

  /**
   * Refresh stores list
   */
  const refreshStores = useCallback(async () => {
    await loadStores();
  }, [loadStores]);

  /**
   * Set active store (selects store and activates it)
   */
  const setActiveStore = useCallback(
    async (store: Store) => {
      try {
        setError(null);

        // Activate store on backend
        await storeService.activateStore(store._id);

        // Update local state
        setActiveStoreState(store);

        // Save to storage
        await storageService.setItem(ACTIVE_STORE_KEY, store._id);

        // Refresh stores to get updated status
        await loadStores();
      } catch (error: unknown) {
        const err = error as { message?: string };
        logger.error('[StoreContext] setActiveStore failed:', error);
        setError(err.message || 'Failed to set active store');
        throw error;
      }
    },
    [loadStores]
  );

  /**
   * Activate store by ID (just activates, doesn't change selected store)
   */
  const activateStoreById = useCallback(
    async (storeId: string) => {
      try {
        setError(null);

        // Activate store on backend
        await storeService.activateStore(storeId);

        // Refresh stores to get updated status
        await loadStores();
      } catch (error: unknown) {
        const err = error as { message?: string };
        logger.error('[StoreContext] activateStoreById failed:', error);
        setError(err.message || 'Failed to activate store');
        throw error;
      }
    },
    [loadStores]
  );

  /**
   * Deactivate store by ID
   */
  const deactivateStoreById = useCallback(
    async (storeId: string) => {
      try {
        setError(null);

        // Deactivate store on backend
        await storeService.deactivateStore(storeId);

        // Refresh stores to get updated status
        await loadStores();
      } catch (error: unknown) {
        const err = error as { message?: string };
        logger.error('[StoreContext] deactivateStoreById failed:', error);
        setError(err.message || 'Failed to deactivate store');
        throw error;
      }
    },
    [loadStores]
  );

  /**
   * Create new store
   */
  const createStore = useCallback(
    async (storeData: CreateStoreData): Promise<Store> => {
      try {
        setError(null);
        const newStore = await storeService.createStore(storeData);

        // Refresh stores list and check if this is the only store (first store).
        // Read fresh data from API rather than stale `stores` closure to avoid
        // the race condition where React state update hasn't propagated yet.
        const freshResult = await storeService.getStores();
        await loadStores();
        if (freshResult.data.length === 1) {
          await setActiveStore(newStore);
        }

        return newStore;
      } catch (error: unknown) {
        const err = error as { message?: string };
        logger.error('[StoreContext] createStore failed:', error);
        setError(err.message || 'Failed to create store');
        throw error;
      }
    },
    [stores.length, loadStores, setActiveStore]
  );

  /**
   * Update store
   */
  const updateStore = useCallback(
    async (storeId: string, storeData: UpdateStoreData): Promise<Store> => {
      try {
        setError(null);
        const updatedStore = await storeService.updateStore(storeId, storeData);

        // Update in stores list
        setStores((prevStores) => {
          const updated = prevStores.map((store) => (store._id === storeId ? updatedStore : store));
          return updated;
        });

        // Update active store if it's the one being updated
        if (activeStore?._id === storeId) {
          setActiveStoreState(updatedStore);
        }

        return updatedStore;
      } catch (error: unknown) {
        const err = error as { message?: string };
        logger.error('[StoreContext] updateStore failed:', error);
        setError(err.message || 'Failed to update store');
        throw error;
      }
    },
    [activeStore]
  );

  /**
   * Delete store
   */
  const deleteStore = useCallback(
    async (storeId: string): Promise<void> => {
      try {
        setError(null);
        await storeService.deleteStore(storeId);

        // Remove from stores list and handle active store update atomically
        let remainingStores: typeof stores = [];
        setStores((prevStores) => {
          remainingStores = prevStores.filter((store) => store._id !== storeId);
          return remainingStores;
        });

        // If deleted store was active, set first available store as active
        if (activeStore?._id === storeId) {
          if (remainingStores.length > 0) {
            await setActiveStore(remainingStores[0]);
          } else {
            setActiveStoreState(null);
            await storageService.removeItem(ACTIVE_STORE_KEY);
          }
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        logger.error('[StoreContext] deleteStore failed:', error);
        setError(err.message || 'Failed to delete store');
        throw error;
      }
    },
    [activeStore, stores, setActiveStore]
  );

  // Load stores only AFTER auth resolves and the user is authenticated.
  // Without this gate, cold-start fires getStores() against an unauthenticated
  // apiClient, which 401s and triggers the logout cascade.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      // Clear state on logout so a different user doesn't see stale stores.
      setStores([]);
      setActiveStoreState(null);
      setIsLoading(false);
      return;
    }
    loadStores();
  }, [authLoading, isAuthenticated, loadStores]);

  // Load active store when stores are loaded (but not if we already have one)
  useEffect(() => {
    if (stores.length > 0 && !activeStore) {
      loadActiveStore(stores);
    }
  }, [stores, activeStore, loadActiveStore]);

  const value: StoreContextType = {
    stores,
    activeStore,
    isLoading,
    error,
    refreshStores,
    setActiveStore,
    activateStoreById,
    deactivateStoreById,
    createStore,
    updateStore,
    deleteStore,
    setActiveStoreSlug,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

// @ts-nocheck
import { useState, useCallback, useEffect, useRef } from 'react';
import { Store, storeSearchService } from '@/services/storeSearchService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

const COMPARISON_STORAGE_KEY = 'store_comparison';

interface UseStoreComparisonReturn {
  comparisonStores: Store[];
  comparisonId: string | null;
  addToComparison: (store: Store) => Promise<boolean>;
  removeFromComparison: (storeId: string) => Promise<void>;
  clearComparison: () => Promise<void>;
  isInComparison: (storeId: string) => boolean;
  canAddToComparison: (store: Store) => boolean;
  loadComparisonFromStorage: () => Promise<void>;
  saveComparisonToStorage: () => Promise<void>;
}

export const useStoreComparison = (): UseStoreComparisonReturn => {
  const [comparisonStores, setComparisonStores] = useState<Store[]>([]);
  const [comparisonId, setComparisonId] = useState<string | null>(null);
  const comparisonIdRef = useRef<string | null>(null);

  const MAX_COMPARISON_STORES = 4;

  const addToComparison = useCallback(async (store: Store): Promise<boolean> => {
    // Check if store is already in comparison
    if (comparisonStores.some(s => s._id === store._id)) {
      return false;
    }

    // Check if we've reached the maximum limit
    if (comparisonStores.length >= MAX_COMPARISON_STORES) {
      return false;
    }

    try {
      // If this is the first store, create a new comparison
      if (comparisonStores.length === 0) {
        const response = await storeSearchService.createComparison({
          storeIds: [store._id],
          name: `Comparison ${new Date().toLocaleDateString()}`
        });

        if (response.success && response.data) {
          const newComparisonStores = [store];
          setComparisonStores(newComparisonStores);
          const newId = response.data.comparison?._id || response.data.id;
          setComparisonId(newId);
          comparisonIdRef.current = newId;
          await AsyncStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify({
            stores: newComparisonStores,
            comparisonId: newId
          }));
          return true;
        }
        return false;
      } else {
        // Add to existing comparison via backend
        if (comparisonIdRef.current) {
          const response = await storeSearchService.addStoreToComparison({
            comparisonId: comparisonIdRef.current,
            storeId: store._id
          });

          if (response.success) {
            const newComparisonStores = [...comparisonStores, store];
            setComparisonStores(newComparisonStores);
            await AsyncStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify({
              stores: newComparisonStores,
              comparisonId: comparisonIdRef.current
            }));
            return true;
          }
        }

        // Fallback to local storage if backend fails
        const newComparisonStores = [...comparisonStores, store];
        setComparisonStores(newComparisonStores);
        await AsyncStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify({
          stores: newComparisonStores,
          comparisonId: comparisonIdRef.current
        }));
        return true;
      }
    } catch (error) {
      // Fallback to local storage only
      logger.warn('[useStoreComparison] Backend unavailable, using local storage:', error);
      const newComparisonStores = [...comparisonStores, store];
      setComparisonStores(newComparisonStores);
      await AsyncStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify({
        stores: newComparisonStores,
        comparisonId: comparisonIdRef.current
      }));
      return true;
    }
  }, [comparisonStores, comparisonId]);

  const removeFromComparison = useCallback(async (storeId: string): Promise<void> => {
    const newComparisonStores = comparisonStores.filter(store => store._id !== storeId);
    setComparisonStores(newComparisonStores);

    // Try to update backend
    if (comparisonIdRef.current) {
      try {
        const storeIds = newComparisonStores.map(s => s._id);
        await storeSearchService.updateComparison({
          comparisonId: comparisonIdRef.current,
          storeIds
        });
      } catch (error) {
        logger.warn('[useStoreComparison] Failed to update backend:', error);
      }
    }

    // Save to local storage
    await AsyncStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify({
      stores: newComparisonStores,
      comparisonId: comparisonIdRef.current
    }));
  }, [comparisonStores]);

  const clearComparison = useCallback(async (): Promise<void> => {
    // Clear from backend
    if (comparisonIdRef.current) {
      try {
        await storeSearchService.deleteComparison(comparisonIdRef.current);
      } catch (error) {
        logger.warn('[useStoreComparison] Failed to delete from backend:', error);
      }
    }

    setComparisonStores([]);
    setComparisonId(null);
    comparisonIdRef.current = null;

    // Clear from local storage
    await AsyncStorage.removeItem(COMPARISON_STORAGE_KEY);
  }, []);

  const isInComparison = useCallback((storeId: string): boolean => {
    return comparisonStores.some(store => store._id === storeId);
  }, [comparisonStores]);

  const canAddToComparison = useCallback((store: Store): boolean => {
    if (isInComparison(store._id)) {
      return false;
    }
    if (comparisonStores.length >= MAX_COMPARISON_STORES) {
      return false;
    }
    return true;
  }, [comparisonStores, isInComparison]);

  const loadComparisonFromStorage = useCallback(async (): Promise<void> => {
    try {
      // Try to load from backend first
      const response = await storeSearchService.getUserComparisons();
      if (response.success && response.data?.comparisons?.length > 0) {
        const latestComparison = response.data.comparisons[0];
        setComparisonStores(latestComparison.stores || []);
        const id = latestComparison._id || latestComparison.id;
        setComparisonId(id);
        comparisonIdRef.current = id;
        await AsyncStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify({
          stores: latestComparison.stores || [],
          comparisonId: id
        }));
        return;
      }
    } catch (error) {
      logger.warn('[useStoreComparison] Failed to load from backend:', error);
    }

    // Fallback to local storage
    try {
      const storedComparison = await AsyncStorage.getItem(COMPARISON_STORAGE_KEY);
      if (storedComparison) {
        const parsed = JSON.parse(storedComparison);
        setComparisonStores(parsed.stores || []);
        setComparisonId(parsed.comparisonId || null);
        comparisonIdRef.current = parsed.comparisonId || null;
      }
    } catch (error) {
      logger.warn('[useStoreComparison] Failed to load from local storage:', error);
    }
  }, []);

  const saveComparisonToStorage = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify({
        stores: comparisonStores,
        comparisonId: comparisonIdRef.current
      }));
    } catch (error) {
      logger.warn('[useStoreComparison] Failed to save to local storage:', error);
    }
  }, [comparisonStores]);

  // Load comparison on mount
  useEffect(() => {
    loadComparisonFromStorage();
  }, []);

  return {
    comparisonStores,
    comparisonId,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    canAddToComparison,
    loadComparisonFromStorage,
    saveComparisonToStorage,
  };
};

export default useStoreComparison;

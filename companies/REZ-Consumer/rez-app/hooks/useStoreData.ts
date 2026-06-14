// @ts-nocheck
/**
 * useStoreData Hook
 *
 * Custom hook for fetching and managing store data
 * Handles loading states, error handling, and data refetching
 *
 * @module hooks/useStoreData
 */

import { useState, useEffect } from 'react';
import storesService from '@/services/storesApi';
import { errorReporter } from '@/utils/errorReporter';

interface UseStoreDataResult {
  data: unknown | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching store data by ID
 *
 * @param storeId - The ID of the store to fetch
 * @returns Object containing store data, loading state, error state, and refetch function
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useStoreData('store-123');
 *
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} />;
 * return <StoreDetails store={data} />;
 * ```
 */
export function useStoreData(storeId: string): UseStoreDataResult {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStore = async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response: unknown = await storesService.getStoreById(storeId);

      if (response.success && response.data) {
        // Backend returns { store: {...}, products: [...] } — unwrap the store object
        const storeObj = response.data.store || response.data;
        setData(storeObj);
      } else {
        throw new Error(response.message || 'Failed to load store');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load store');
      setError(error);

      // Report error to monitoring service
      errorReporter.captureError(error, {
        context: 'useStoreData',
        metadata: { storeId },
        severity: 'error',
        category: 'network'
      } as unknown);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  return {
    data,
    loading,
    error,
    refetch: fetchStore
  };
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiResponse, PaginatedResponse } from '../api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UsePaginatedApiState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  refetch: () => void;
}

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data) => void;
  onError?: (error: string) => void;
}

// Generic hook for API calls
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiState<T> {
  const { immediate = true, onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall();

      if (mounted.current) {
        setData(response.data);
        onSuccess?.(response.data);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const errorMessage = axiosErr?.response?.data?.message || (err instanceof Error ? err.message : String(err));

      if (mounted.current) {
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [apiCall, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      mounted.current = false;
    };
  }, [execute, immediate]);

  return {
    data,
    loading,
    error,
    refetch: execute,
  };
}

// Hook for paginated API calls
export function usePaginatedApi<T>(
  apiCall: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
  limit: number = 20,
  options: UseApiOptions = {}
): UsePaginatedApiState<T> {
  const { immediate = true, onSuccess, onError } = options;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const mounted = useRef(true);

  const execute = useCallback(async (currentPage: number = page) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(currentPage, limit);

      if (mounted.current) {
        setData(response.data);
        setTotalPages(response.totalPages);
        setTotal(response.total);
        setPage(currentPage);
        onSuccess?.(response.data);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const errorMessage = axiosErr?.response?.data?.message || (err instanceof Error ? err.message : String(err));

      if (mounted.current) {
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [apiCall, limit, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute(1);
    }

    return () => {
      mounted.current = false;
    };
  }, [execute, immediate]);

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      execute(page + 1);
    }
  }, [page, totalPages, execute]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      execute(page - 1);
    }
  }, [page, execute]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      execute(newPage);
    }
  }, [totalPages, execute]);

  const refetch = useCallback(() => {
    execute(page);
  }, [execute, page]);

  return {
    data,
    loading,
    error,
    page,
    totalPages,
    total,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage,
    prevPage,
    goToPage,
    refetch,
  };
}

// Hook for mutations (POST, PUT, DELETE operations)
export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: string, variables: TVariables) => void;
  } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { onSuccess, onError } = options;

  const mutate = useCallback(async (variables: TVariables) => {
    try {
      setLoading(true);
      setError(null);

      const response = await mutationFn(variables);

      setLoading(false);
      onSuccess?.(response.data, variables);

      return response.data;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const errorMessage = axiosErr?.response?.data?.message || (err instanceof Error ? err.message : String(err));

      setLoading(false);
      setError(errorMessage);
      onError?.(errorMessage, variables);

      throw err;
    }
  }, [mutationFn, onSuccess, onError]);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    mutate,
    loading,
    error,
    reset,
  };
}

// Hook for optimistic updates
export function useOptimisticMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options: {
    optimisticUpdate?: (variables: TVariables) => TData;
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: string, variables: TVariables) => void;
    onSettled?: () => void;
  } = {}
) {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { optimisticUpdate, onSuccess, onError, onSettled } = options;

  const mutate = useCallback(async (variables: TVariables) => {
    try {
      setLoading(true);
      setError(null);

      // Apply optimistic update
      if (optimisticUpdate) {
        const optimisticData = optimisticUpdate(variables);
        setData(optimisticData);
      }

      const response = await mutationFn(variables);

      setData(response.data);
      onSuccess?.(response.data, variables);

      return response.data;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const errorMessage = axiosErr?.response?.data?.message || (err instanceof Error ? err.message : String(err));

      // Revert optimistic update on error
      setData(null);
      setError(errorMessage);
      onError?.(errorMessage, variables);

      throw err;
    } finally {
      setLoading(false);
      onSettled?.();
    }
  }, [mutationFn, optimisticUpdate, onSuccess, onError, onSettled]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return {
    data,
    mutate,
    loading,
    error,
    reset,
  };
}

// Hook for infinite scroll/loading
export function useInfiniteApi<T>(
  apiCall: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
  limit: number = 20,
  options: UseApiOptions = {}
): {
  data: T[];
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
} {
  const { immediate = true, onSuccess, onError } = options;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const mounted = useRef(true);

  const fetchPage = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(pageNum, limit);

      if (mounted.current) {
        setData(prev => append ? [...prev, ...response.data] : response.data);
        setHasNextPage(pageNum < response.totalPages);
        setPage(pageNum);
        onSuccess?.(response.data);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const errorMessage = axiosErr?.response?.data?.message || (err instanceof Error ? err.message : String(err));

      if (mounted.current) {
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [apiCall, limit, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      fetchPage(1);
    }

    return () => {
      mounted.current = false;
    };
  }, [fetchPage, immediate]);

  const fetchNextPage = useCallback(() => {
    if (hasNextPage && !loading) {
      fetchPage(page + 1, true);
    }
  }, [hasNextPage, loading, page, fetchPage]);

  const refetch = useCallback(() => {
    setPage(1);
    setHasNextPage(true);
    fetchPage(1);
  }, [fetchPage]);

  return {
    data,
    loading,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
  };
}
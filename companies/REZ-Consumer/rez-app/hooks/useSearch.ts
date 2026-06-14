// @ts-nocheck
import { useState, useCallback, useEffect } from 'react';
import searchService, {
  ProductSearchParams,
  StoreSearchParams,
  ProductSearchResult,
  StoreSearchResult
} from '@/services/searchApi';
import { useUserId } from '@/stores/selectors';

export interface SearchState {
  query: string;
  isSearching: boolean;
  productResults: ProductSearchResult[];
  storeResults: StoreSearchResult[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    sortBy?: string;
  };
}

const initialState: SearchState = {
  query: '',
  isSearching: false,
  productResults: [],
  storeResults: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  },
  filters: {},
};

export const useSearch = () => {
  const [state, setState] = useState<SearchState>(initialState);
  const userId = useUserId();

  // Search products
  // FIX 4: Accept an explicit page parameter (defaults to 1) so new queries
  // always start at page 1 instead of using the stale pagination.page from
  // a previous scroll position. The loadMore/pagination effect passes the
  // incremented page explicitly.
  const searchProducts = useCallback(async (query: string, filters?: Partial<ProductSearchParams>, page: number = 1) => {
    if (!query.trim()) {
      setState(prev => ({ ...prev, productResults: [], query: '' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, isSearching: true, query, error: null }));

    try {

      const response: unknown = await searchService.searchProducts({
        q: query,
        page,
        limit: state.pagination.limit,
        ...(userId ? { userId } : {}),
        ...filters,
        ...state.filters,
      });

      if (response.success && response.data) {
        const { products, pagination } = response.data;

        setState(prev => ({
          ...prev,
          productResults: pagination.page === 1 ? products : [...prev.productResults, ...products],
          loading: false,
          isSearching: false,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            hasMore: pagination.page < pagination.pages,
          },
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        isSearching: false,
        error: error instanceof Error ? error.message : 'Failed to search products',
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pagination.page, state.pagination.limit, state.filters]);

  // Search stores
  const searchStores = useCallback(async (query: string, filters?: Partial<StoreSearchParams>) => {
    if (!query.trim()) {
      setState(prev => ({ ...prev, storeResults: [], query: '' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, isSearching: true, query, error: null }));

    try {

      const response: unknown = await searchService.searchStores({
        q: query,
        page: state.pagination.page,
        limit: state.pagination.limit,
        ...(userId ? { userId } : {}),
        ...filters,
      });

      if (response.success && response.data) {
        const { stores, pagination } = response.data;

        setState(prev => ({
          ...prev,
          storeResults: pagination.page === 1 ? stores : [...prev.storeResults, ...stores],
          loading: false,
          isSearching: false,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            hasMore: pagination.page < pagination.pages,
          },
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        isSearching: false,
        error: error instanceof Error ? error.message : 'Failed to search stores',
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pagination.page, state.pagination.limit]);

  // Combined search (both products and stores)
  const searchAll = useCallback(async (query: string) => {
    if (!query.trim()) {
      setState(initialState);
      return;
    }

    setState(prev => ({ ...prev, loading: true, isSearching: true, query, error: null }));

    try {

      const [productsResponse, storesResponse] = await Promise.all([
        searchService.searchProducts({
          q: query,
          page: 1,
          limit: 10,
          ...(userId ? { userId } : {}),
        }),
        searchService.searchStores({
          q: query,
          page: 1,
          limit: 5,
          ...(userId ? { userId } : {}),
        }),
      ]);

      const productResults = productsResponse.success && productsResponse.data
        ? productsResponse.data.products
        : [];

      const storeResults = storesResponse.success && storesResponse.data
        ? storesResponse.data.stores
        : [];

      setState(prev => ({
        ...prev,
        productResults,
        storeResults,
        loading: false,
        isSearching: false,
        pagination: {
          ...prev.pagination,
          total: (productsResponse.data?.pagination?.total || 0) + (storesResponse.data?.pagination?.total || 0),
        },
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        isSearching: false,
        error: error instanceof Error ? error.message : 'Failed to search',
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply filters
  const applyFilters = useCallback((filters: SearchState['filters']) => {
    setState(prev => ({
      ...prev,
      filters,
      pagination: { ...prev.pagination, page: 1 },
    }));

    // Re-search with new filters
    if (state.query) {
      searchProducts(state.query);
    }
  }, [state.query, searchProducts]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {},
      pagination: { ...prev.pagination, page: 1 },
    }));

    // Re-search without filters
    if (state.query) {
      searchProducts(state.query);
    }
  }, [state.query, searchProducts]);

  // Load more results (pagination)
  const loadMore = useCallback(() => {
    if (!state.pagination.hasMore || state.loading) return;

    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page: prev.pagination.page + 1 },
    }));
  }, [state.pagination.hasMore, state.loading]);

  // Clear search
  const clearSearch = useCallback(() => {
    setState(initialState);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Auto-trigger search when pagination changes (pass page explicitly)
  useEffect(() => {
    if (state.pagination.page > 1 && state.query) {
      searchProducts(state.query, undefined, state.pagination.page);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pagination.page]);

  return {
    state,
    actions: {
      searchProducts,
      searchStores,
      searchAll,
      applyFilters,
      clearFilters,
      loadMore,
      clearSearch,
      clearError,
    },
  };
};

export default useSearch;

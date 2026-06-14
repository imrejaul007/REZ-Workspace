// @ts-nocheck
// Product Search Hook
// Custom hook for searching and managing product selection for UGC tagging

import { useState, useCallback, useRef, useEffect } from 'react';
import productsService from '@/services/productsApi';
import {
  ProductSelectorProduct,
  ProductSearchHookResult,
  ProductSearchParams,
} from '@/types/product-selector.types';
import { logger } from '@/utils/logger';

interface UseProductSearchOptions {
  maxProducts?: number;
  minProducts?: number;
  initialProducts?: ProductSelectorProduct[];
  debounceMs?: number;
}

export function useProductSearch(
  options: UseProductSearchOptions = {}
): ProductSearchHookResult {
  const {
    maxProducts = 10,
    minProducts = 1,
    initialProducts = [],
    debounceMs = 500,
  } = options;

  // Search state
  const [products, setProducts] = useState<ProductSelectorProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [total, setTotal] = useState(0);

  // Selection state
  const [selectedProducts, setSelectedProducts] = useState<ProductSelectorProduct[]>(
    initialProducts
  );

  // Refs for debouncing
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // Check if a product is selected
  const isSelected = useCallback(
    (productId: string): boolean => {
      return selectedProducts.some((p) => p._id === productId);
    },
    [selectedProducts]
  );

  // Check if can select more products
  const canSelectMore = selectedProducts.length < maxProducts;

  // Fetch products from API
  const fetchProducts = useCallback(
    async (searchQuery: string, pageNum: number, append: boolean = false) => {
      try {
        // Cancel previous request
        if (abortController.current) {
          abortController.current.abort();
        }
        abortController.current = new AbortController();

        setLoading(true);
        setError(null);

        logger.debug('🔍 [useProductSearch] Fetching products:', {
          query: searchQuery,
          page: pageNum,
          append,
        });

        // Build search params
        const params: ProductSearchParams = {
          query: searchQuery || undefined,
          page: pageNum,
          limit: 20,
          sortBy: 'newest',
        };

        // Use search API if query exists, otherwise get all products
        const response = searchQuery
          ? await productsService.searchProducts({
              q: searchQuery,
              page: pageNum,
              limit: 20
            })
          : await productsService.getProducts({
              page: pageNum,
              limit: 20,
              status: 'active',
              visibility: 'public',
            });

        if (response.success && response.data) {
          // Handle different response structures
          let fetchedProducts: ProductSelectorProduct[] = [];
          let pagination: unknown = null;

          if (searchQuery && 'products' in response.data) {
            // Search response
            fetchedProducts = (response.data as unknown).products || [];
            pagination = (response.data as unknown).pagination;
          } else if ('products' in response.data) {
            // ProductsResponse
            fetchedProducts = (response.data as unknown).products || [];
            pagination = (response.data as unknown).pagination;
          } else if (Array.isArray(response.data)) {
            // Direct array response
            fetchedProducts = response.data as unknown;
            pagination = {
              current: pageNum,
              pages: 1,
              total: fetchedProducts.length,
              hasMore: false,
            };
          }

          // Transform products to match ProductSelectorProduct interface
          const transformedProducts: ProductSelectorProduct[] = fetchedProducts.map(
            (product) => ({
              _id: product._id || product.id,
              name: product.name,
              description: product.description,
              basePrice: product.pricing?.basePrice || product.price?.current || 0,
              salePrice: product.pricing?.salePrice || product.price?.original,
              images: product.images?.map((img) =>
                typeof img === 'string' ? img : img.url
              ) || [product.image],
              store: {
                _id: product.store?._id || product.store?.id || '',
                name: product.store?.name || product.brand || 'Unknown Store',
                logo: product.store?.logo,
              },
              category: product.category?.name || product.category,
              rating: product.ratings || product.rating,
              inStock: product.availabilityStatus === 'in_stock' ||
                       product.inventory?.stock > 0,
              tags: product.tags || [],
              availability: product.availabilityStatus,
            })
          );

          logger.debug('✅ [useProductSearch] Fetched products:', {
            count: transformedProducts.length,
            append,
            total: pagination?.total || transformedProducts.length,
          });

          setProducts((prev) =>
            append ? [...prev, ...transformedProducts] : transformedProducts
          );
          setTotal(pagination?.total || transformedProducts.length);
          setHasMore(pagination?.hasMore ??
                     (pagination ? pageNum < pagination.pages : false));
          setPage(pageNum);
        } else {
          throw new Error(response.error || 'Failed to fetch products');
        }
      } catch (err) {
        // Ignore abort errors
        if (err.name === 'AbortError') {
          logger.debug('⚠️ [useProductSearch] Request aborted');
          return;
        }

        logger.error('❌ [useProductSearch] Error fetching products:', err);
        setError(err.message || 'Failed to load products');
        if (!append) setProducts([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        abortController.current = null;
      }
    },
    []
  );

  // Search products with debounce - Fixed stale closure
  const searchProducts = useCallback(
    (searchQuery: string) => {
      logger.debug('🔎 [useProductSearch] Search triggered:', searchQuery);

      setQuery(searchQuery);
      setPage(1);

      // Clear previous debounce timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }

      // Debounce search using latest searchQuery from closure
      const timerId = setTimeout(() => {
        // Only fetch if this timer hasn't been cancelled
        if (debounceTimer.current === timerId) {
          fetchProducts(searchQuery, 1, false);
        }
      }, debounceMs);

      debounceTimer.current = timerId;
    },
    [fetchProducts, debounceMs]
  );

  // Load more products (pagination)
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) {
      logger.debug('⏭️ [useProductSearch] Skip load more:', { loading, hasMore });
      return;
    }

    logger.debug('📄 [useProductSearch] Loading more products, page:', page + 1);
    await fetchProducts(query, page + 1, true);
  }, [loading, hasMore, query, page, fetchProducts]);

  // Clear search
  const clearSearch = useCallback(() => {
    logger.debug('🗑️ [useProductSearch] Clearing search');
    setQuery('');
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setTotal(0);

    // Clear debounce timer to prevent memory leak
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }

    // Load initial products
    fetchProducts('', 1, false);
  }, [fetchProducts]);

  // Refresh products
  const refresh = useCallback(async () => {
    logger.debug('🔄 [useProductSearch] Refreshing products');
    await fetchProducts(query, 1, false);
  }, [query, fetchProducts]);

  // Select product
  const selectProduct = useCallback(
    (product: ProductSelectorProduct): boolean => {
      if (selectedProducts.length >= maxProducts) {
        logger.warn('⚠️ [useProductSearch] Max products reached:', maxProducts);
        return false;
      }

      if (isSelected(product._id)) {
        logger.warn('⚠️ [useProductSearch] Product already selected:', product._id);
        return false;
      }

      logger.debug('✅ [useProductSearch] Product selected:', product._id);
      setSelectedProducts((prev) => [...prev, product]);
      return true;
    },
    [selectedProducts, maxProducts, isSelected]
  );

  // Deselect product
  const deselectProduct = useCallback((productId: string) => {
    logger.debug('➖ [useProductSearch] Product deselected:', productId);
    setSelectedProducts((prev) => prev.filter((p) => p._id !== productId));
  }, []);

  // Toggle product selection
  const toggleProduct = useCallback(
    (product: ProductSelectorProduct) => {
      if (isSelected(product._id)) {
        deselectProduct(product._id);
      } else {
        selectProduct(product);
      }
    },
    [isSelected, selectProduct, deselectProduct]
  );

  // Clear selection
  const clearSelection = useCallback(() => {
    logger.debug('🗑️ [useProductSearch] Clearing selection');
    setSelectedProducts([]);
  }, []);

  // Load initial products on mount
  useEffect(() => {
    fetchProducts('', 1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch on mount, fetchProducts is stable via useCallback

  return {
    // State
    products,
    loading,
    error,
    hasMore,
    page,
    query,
    total,

    // Actions
    searchProducts,
    loadMore,
    clearSearch,
    refresh,

    // Selection management
    selectedProducts,
    selectProduct,
    deselectProduct,
    toggleProduct,
    clearSelection,
    isSelected,
    canSelectMore,

    // Config
    maxProducts,
    minProducts,
  };
}

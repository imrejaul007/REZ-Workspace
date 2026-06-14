import {
  useQuery,
  useInfiniteQuery,
  UseQueryOptions,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import { Product, ProductCategory, ProductSearchRequest } from '@/shared/types';
import { productsService } from '@/services/api/products';
import { queryConfig } from '@/config/reactQuery';

// Inline query keys
const productKeys = {
  all: ['products'] as const,
  list: (filters?) => ['products', 'list', filters] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
  categories: () => ['products', 'categories'] as const,
  search: (query: string, filters?) => ['products', 'search', query, filters] as const,
  byCategory: (categoryId: string) => ['products', 'byCategory', categoryId] as const,
  lowStock: () => ['products', 'lowStock'] as const,
  stock: (id: string) => ['products', 'stock', id] as const,
};

/**
 * Hook to fetch a paginated list of products
 */
export function useProducts(
  filters?: Partial<ProductSearchRequest>,
  options?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const response = await productsService.getProducts(filters as unknown);
      return response;
    },
    ...queryConfig.products,
    ...options,
  });
}

/**
 * Hook to fetch infinite list of products (for pagination)
 */
export function useInfiniteProducts(
  filters?: Partial<ProductSearchRequest>,
  options?: Omit<
    UseInfiniteQueryOptions<unknown>,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
  >
) {
  return useInfiniteQuery({
    queryKey: productKeys.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await productsService.getProducts({
        ...filters,
        page: pageParam as number,
      } as unknown);
      return response;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    ...queryConfig.products,
    ...options,
  });
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(
  id: string,
  options?: Omit<UseQueryOptions<Product>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const response = await productsService.getProduct(id);
      return response;
    },
    enabled: !!id,
    ...queryConfig.products,
    ...options,
  });
}

/**
 * Hook to fetch product categories
 */
export function useProductCategories(options?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: async () => {
      const response = await productsService.getCategories();
      return response || [];
    },
    staleTime: 30 * 60 * 1000, // Categories rarely change
    gcTime: 60 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to search products
 */
export function useSearchProducts(
  query: string,
  filters?,
  options?: Omit<UseQueryOptions<Product[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: productKeys.search(query, filters),
    queryFn: async () => {
      if (!query.trim()) {
        return [];
      }
      const response = await productsService.getProducts({
        query,
        ...filters,
      } as unknown);
      return response.products || [];
    },
    enabled: !!query.trim(),
    ...queryConfig.products,
    ...options,
  });
}

/**
 * Hook to fetch products by category
 */
export function useProductsByCategory(
  categoryId: string,
  options?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: productKeys.byCategory(categoryId),
    queryFn: async () => {
      const response = await productsService.getProducts({
        category: categoryId,
      } as unknown);
      return response;
    },
    enabled: !!categoryId,
    ...queryConfig.products,
    ...options,
  });
}

/**
 * Hook to fetch low stock products
 */
export function useLowStockProducts(
  options?: Omit<UseQueryOptions<Product[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: productKeys.lowStock(),
    queryFn: async () => {
      const response = await productsService.getLowStockProducts();
      return response || [];
    },
    ...queryConfig.products,
    ...options,
  });
}

/**
 * Hook to fetch product stock status
 */
export function useProductStock(
  id: string,
  options?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: productKeys.stock(id),
    queryFn: async () => {
      const response = await productsService.getProduct(id);
      return (response as unknown).inventory || null;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // Stock changes frequently
    gcTime: 5 * 60 * 1000,
    ...options,
  });
}

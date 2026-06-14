import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { vendorsApi } from '@/lib/api/vendors';
import { EnhancedSupplier, PaginatedResponse, SearchFilters } from '@/types/api';
import { toast } from 'react-hot-toast';

// Query keys for marketplace/suppliers
export const marketplaceKeys = {
  all: ['marketplace'] as const,
  suppliers: () => [...marketplaceKeys.all, 'suppliers'] as const,
  suppliersList: (filters?: SearchFilters) => [...marketplaceKeys.suppliers(), 'list', filters] as const,
  supplier: (id: string) => [...marketplaceKeys.suppliers(), 'detail', id] as const,
  products: () => [...marketplaceKeys.all, 'products'] as const,
  productsList: (supplierId?: string, filters?: SearchFilters) => [...marketplaceKeys.products(), 'list', supplierId, filters] as const,
  categories: () => [...marketplaceKeys.all, 'categories'] as const,
  search: (query: string, filters?: SearchFilters) => [...marketplaceKeys.all, 'search', query, filters] as const,
  featured: () => [...marketplaceKeys.all, 'featured'] as const,
  favorites: () => [...marketplaceKeys.all, 'favorites'] as const,
  orders: () => [...marketplaceKeys.all, 'orders'] as const,
  reviews: (supplierId: string) => [...marketplaceKeys.all, 'reviews', supplierId] as const,
};

// Enhanced marketplace hooks
export function useSuppliers(filters?: SearchFilters, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: marketplaceKeys.suppliersList({ ...filters, page, limit }),
    queryFn: () => vendorsApi.getVendors(filters, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as unknown).status;
        if (status >= 400 && status < 500) return false;
      }
      return failureCount < 3;
    },
    onError: (error) => {
      console.error('Failed to fetch suppliers:', error);
      toast.error('Failed to load suppliers. Please try again.');
    },
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });
}

export function useInfiniteSuppliers(filters?: SearchFilters, limit: number = 20) {
  return useInfiniteQuery({
    queryKey: marketplaceKeys.suppliersList(filters),
    queryFn: ({ pageParam = 1 }) => vendorsApi.getVendors(filters, pageParam, limit),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch infinite suppliers:', error);
      toast.error('Failed to load more suppliers.');
    },
  });
}

export function useSupplier(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: marketplaceKeys.supplier(id),
    queryFn: () => vendorsApi.getVendor(id),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch supplier details:', error);
      toast.error('Failed to load supplier details.');
    },
  });
}

export function useSupplierProducts(supplierId: string, filters?: SearchFilters, enabled: boolean = true) {
  return useQuery({
    queryKey: marketplaceKeys.productsList(supplierId, filters),
    queryFn: () => vendorsApi.getVendorProducts(supplierId, filters),
    enabled: enabled && !!supplierId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch supplier products:', error);
      toast.error('Failed to load products.');
    },
  });
}

export function useMarketplaceSearch(query: string, filters?: SearchFilters, enabled: boolean = true) {
  return useQuery({
    queryKey: marketplaceKeys.search(query, filters),
    queryFn: () => vendorsApi.searchVendors(query, filters),
    enabled: enabled && query.trim().length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    onError: (error) => {
      console.error('Failed to search marketplace:', error);
      toast.error('Search failed. Please try again.');
    },
  });
}

export function useFeaturedSuppliers() {
  return useQuery({
    queryKey: marketplaceKeys.featured(),
    queryFn: () => vendorsApi.getFeaturedVendors(),
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch featured suppliers:', error);
    },
  });
}

export function useMarketplaceCategories() {
  return useQuery({
    queryKey: marketplaceKeys.categories(),
    queryFn: () => vendorsApi.getCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes - categories don't change often
    cacheTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch categories:', error);
    },
  });
}

export function useNearbySuppliers(
  latitude?: number,
  longitude?: number,
  radius: number = 25,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [...marketplaceKeys.suppliers(), 'nearby', latitude, longitude, radius],
    queryFn: () => vendorsApi.getNearbyVendors(latitude!, longitude!, radius),
    enabled: enabled && !!(latitude && longitude),
    staleTime: 10 * 60 * 1000,
    cacheTime: 20 * 60 * 1000,
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch nearby suppliers:', error);
    },
  });
}

export function useSupplierReviews(supplierId: string, page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: [...marketplaceKeys.reviews(supplierId), page, limit],
    queryFn: () => vendorsApi.getVendorReviews(supplierId, page, limit),
    enabled: !!supplierId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch supplier reviews:', error);
    },
  });
}

export function useFavoriteSuppliers(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: [...marketplaceKeys.favorites(), page, limit],
    queryFn: () => vendorsApi.getFavoriteVendors(page, limit),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch favorite suppliers:', error);
    },
  });
}

export function useSupplierOrders(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: [...marketplaceKeys.orders(), page, limit],
    queryFn: () => vendorsApi.getOrders(page, limit),
    staleTime: 2 * 60 * 1000, // More frequent updates for orders
    cacheTime: 5 * 60 * 1000,
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders.');
    },
  });
}

// Mutation hooks
export function useAddToFavorites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vendorsApi.addToFavorites,
    onMutate: async (supplierId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(marketplaceKeys.supplier(supplierId));

      // Snapshot the previous value
      const previousSupplier = queryClient.getQueryData(marketplaceKeys.supplier(supplierId));

      // Optimistically update the supplier
      queryClient.setQueryData(marketplaceKeys.supplier(supplierId), (old) => {
        if (old) {
          return {
            ...old,
            data: {
              ...old.data,
              favorited: true,
            },
          };
        }
        return old;
      });

      return { previousSupplier };
    },
    onSuccess: (_, supplierId) => {
      queryClient.invalidateQueries(marketplaceKeys.favorites());
      toast.success('Added to favorites!');
    },
    onError: (error, supplierId, context) => {
      // Revert optimistic update
      if (context?.previousSupplier) {
        queryClient.setQueryData(marketplaceKeys.supplier(supplierId), context.previousSupplier);
      }
      console.error('Failed to add to favorites:', error);
      toast.error('Failed to add to favorites. Please try again.');
    },
    onSettled: (_, __, supplierId) => {
      queryClient.invalidateQueries(marketplaceKeys.supplier(supplierId));
    },
  });
}

export function useRemoveFromFavorites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vendorsApi.removeFromFavorites,
    onMutate: async (supplierId) => {
      await queryClient.cancelQueries(marketplaceKeys.supplier(supplierId));
      const previousSupplier = queryClient.getQueryData(marketplaceKeys.supplier(supplierId));

      queryClient.setQueryData(marketplaceKeys.supplier(supplierId), (old) => {
        if (old) {
          return {
            ...old,
            data: {
              ...old.data,
              favorited: false,
            },
          };
        }
        return old;
      });

      return { previousSupplier };
    },
    onSuccess: (_, supplierId) => {
      queryClient.invalidateQueries(marketplaceKeys.favorites());
      toast.success('Removed from favorites!');
    },
    onError: (error, supplierId, context) => {
      if (context?.previousSupplier) {
        queryClient.setQueryData(marketplaceKeys.supplier(supplierId), context.previousSupplier);
      }
      console.error('Failed to remove from favorites:', error);
      toast.error('Failed to remove from favorites. Please try again.');
    },
    onSettled: (_, __, supplierId) => {
      queryClient.invalidateQueries(marketplaceKeys.supplier(supplierId));
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vendorsApi.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries(marketplaceKeys.orders());
      toast.success('Order placed successfully!');
    },
    onError: (error) => {
      console.error('Failed to create order:', error);
      toast.error('Failed to place order. Please try again.');
    },
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ supplierId, reviewData }: { supplierId: string; reviewData: unknown }) =>
      vendorsApi.submitReview(supplierId, reviewData),
    onSuccess: (_, { supplierId }) => {
      queryClient.invalidateQueries(marketplaceKeys.reviews(supplierId));
      queryClient.invalidateQueries(marketplaceKeys.supplier(supplierId));
      toast.success('Review submitted successfully!');
    },
    onError: (error) => {
      console.error('Failed to submit review:', error);
      toast.error('Failed to submit review. Please try again.');
    },
  });
}

export function useContactSupplier() {
  return useMutation({
    mutationFn: ({ supplierId, message }: { supplierId: string; message: string }) =>
      vendorsApi.contactVendor(supplierId, message),
    onSuccess: () => {
      toast.success('Message sent successfully!');
    },
    onError: (error) => {
      console.error('Failed to contact supplier:', error);
      toast.error('Failed to send message. Please try again.');
    },
  });
}

export function useReportSupplier() {
  return useMutation({
    mutationFn: ({ supplierId, reason, details }: { supplierId: string; reason: string; details?: string }) =>
      vendorsApi.reportVendor(supplierId, reason, details),
    onSuccess: () => {
      toast.success('Report submitted successfully. We will review it shortly.');
    },
    onError: (error) => {
      console.error('Failed to report supplier:', error);
      toast.error('Failed to submit report. Please try again.');
    },
  });
}

// Utility hooks
export function usePrefetchSupplier(id: string) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: marketplaceKeys.supplier(id),
      queryFn: () => vendorsApi.getVendor(id),
      staleTime: 10 * 60 * 1000,
    });
  };
}

export function useMarketplaceCache() {
  const queryClient = useQueryClient();

  return {
    getSupplier: (id: string) => queryClient.getQueryData(marketplaceKeys.supplier(id)),
    setSupplier: (id: string, data) => queryClient.setQueryData(marketplaceKeys.supplier(id), data),
    invalidateSupplier: (id: string) => queryClient.invalidateQueries(marketplaceKeys.supplier(id)),
    invalidateAllSuppliers: () => queryClient.invalidateQueries(marketplaceKeys.suppliers()),
    clearMarketplaceCache: () => {
      queryClient.removeQueries(marketplaceKeys.all);
    },
  };
}
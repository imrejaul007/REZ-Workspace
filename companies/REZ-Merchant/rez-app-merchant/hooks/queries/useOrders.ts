import {
  useQuery,
  useInfiniteQuery,
  UseQueryOptions,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import { Order, OrderStatus } from '@/shared/types';
import { ordersService, OrderSearchParams } from '@/services/api/orders';
import { queryConfig } from '@/config/reactQuery';

// Inline query keys
const orderKeys = {
  all: ['orders'] as const,
  list: (filters?) => ['orders', 'list', filters] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
  pending: () => ['orders', 'pending'] as const,
  completed: () => ['orders', 'completed'] as const,
  cancelled: () => ['orders', 'cancelled'] as const,
  byStatus: (status: string) => ['orders', 'byStatus', status] as const,
  analytics: (period: string) => ['orders', 'analytics', period] as const,
  timeline: (orderId: string) => ['orders', 'timeline', orderId] as const,
};

/**
 * Hook to fetch a paginated list of orders
 */
export function useOrders(
  filters?: {
    status?: OrderStatus;
    page?: number;
    limit?: number;
    sortBy?: string;
    search?: string;
    storeId?: string;
  },
  options?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: async () => {
      const params: OrderSearchParams = {};
      if (filters?.status) params.status = filters.status;
      if (filters?.page) params.page = filters.page;
      if (filters?.limit) params.limit = filters.limit;
      if (filters?.sortBy) params.sortBy = filters.sortBy as OrderSearchParams['sortBy'];
      if (filters?.storeId) params.storeId = filters.storeId;
      const response = await ordersService.getOrders(params);
      return response;
    },
    ...queryConfig.orders,
    ...options,
  });
}

/**
 * Hook to fetch infinite list of orders (for pagination/lazy loading)
 */
export function useInfiniteOrders(
  filters?: {
    status?: OrderStatus;
    sortBy?: string;
    search?: string;
    storeId?: string;
  },
  options?: Omit<
    UseInfiniteQueryOptions<unknown>,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
  >
) {
  return useInfiniteQuery({
    queryKey: orderKeys.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await ordersService.getOrders({
        ...filters,
        page: pageParam as number,
        limit: 20,
      } as OrderSearchParams);
      return response;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    ...queryConfig.orders,
    ...options,
  });
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(
  id: string,
  options?: Omit<UseQueryOptions<Order>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async () => {
      const response = await ordersService.getOrderById(id);
      return response;
    },
    enabled: !!id,
    ...queryConfig.orders,
    ...options,
  });
}

/**
 * Hook to fetch pending orders
 */
export function usePendingOrders(
  storeId?: string,
  options?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: orderKeys.pending(),
    queryFn: async () => {
      const response = await ordersService.getOrders({
        status: 'placed',
        ...(storeId ? { storeId } : {}),
      });
      return response;
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch completed orders
 */
export function useCompletedOrders(
  storeId?: string,
  options?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: orderKeys.completed(),
    queryFn: async () => {
      const response = await ordersService.getOrders({
        status: 'delivered',
        ...(storeId ? { storeId } : {}),
      });
      return response;
    },
    ...queryConfig.orders,
    ...options,
  });
}

/**
 * Hook to fetch cancelled orders
 */
export function useCancelledOrders(
  storeId?: string,
  options?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: orderKeys.cancelled(),
    queryFn: async () => {
      const response = await ordersService.getOrders({
        status: 'cancelled',
        ...(storeId ? { storeId } : {}),
      });
      return response;
    },
    ...queryConfig.orders,
    ...options,
  });
}

/**
 * Hook to fetch orders by status
 */
export function useOrdersByStatus(
  status: OrderStatus,
  storeId?: string,
  options?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: orderKeys.byStatus(status),
    queryFn: async () => {
      const response = await ordersService.getOrders({
        status,
        ...(storeId ? { storeId } : {}),
      });
      return response;
    },
    enabled: !!status,
    ...queryConfig.orders,
    ...options,
  });
}

/**
 * Hook to fetch order analytics
 */
export function useOrderAnalytics(
  period: '7d' | '30d' | '90d' = '30d',
  options?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: orderKeys.analytics(period),
    queryFn: async () => {
      const response = await ordersService.getAnalytics();
      return response;
    },
    ...queryConfig.orders,
    ...options,
  });
}

/**
 * Compound hook that fetches multiple order data points
 */
export function useOrdersOverview(
  storeId?: string,
  options?: {
    includePending?: boolean;
    includeCompleted?: boolean;
    includeCancelled?: boolean;
    includeAnalytics?: boolean;
    period?: '7d' | '30d' | '90d';
  }
) {
  const {
    includePending = true,
    includeCompleted = true,
    includeCancelled = true,
    includeAnalytics = true,
    period = '30d',
  } = (options || {}) as unknown;

  const pendingQuery = useQuery({
    queryKey: orderKeys.pending(),
    queryFn: async () => {
      const response = await ordersService.getOrders({
        status: 'placed',
        storeId,
      });
      return response.orders || [];
    },
    enabled: includePending,
    staleTime: 1 * 60 * 1000,
  });

  const completedQuery = useQuery({
    queryKey: orderKeys.completed(),
    queryFn: async () => {
      const response = await ordersService.getOrders({
        status: 'delivered',
        storeId,
      });
      return response.orders || [];
    },
    enabled: includeCompleted,
    ...queryConfig.orders,
  });

  const cancelledQuery = useQuery({
    queryKey: orderKeys.cancelled(),
    queryFn: async () => {
      const response = await ordersService.getOrders({
        status: 'cancelled',
        storeId,
      });
      return response.orders || [];
    },
    enabled: includeCancelled,
    ...queryConfig.orders,
  });

  const analyticsQuery = useQuery({
    queryKey: orderKeys.analytics(period),
    queryFn: async () => {
      const response = await ordersService.getAnalytics();
      return response;
    },
    enabled: includeAnalytics,
    ...queryConfig.orders,
  });

  return {
    pending: pendingQuery,
    completed: completedQuery,
    cancelled: cancelledQuery,
    analytics: analyticsQuery,
    isLoading:
      pendingQuery.isLoading ||
      completedQuery.isLoading ||
      cancelledQuery.isLoading ||
      analyticsQuery.isLoading,
    isError:
      pendingQuery.isError ||
      completedQuery.isError ||
      cancelledQuery.isError ||
      analyticsQuery.isError,
  };
}

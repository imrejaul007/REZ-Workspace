import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { cashbackService } from '@/services/api/cashback';
import { queryConfig } from '@/config/reactQuery';

// Inline query keys since queryKeys is not exported from reactQuery config
const cashbackKeys = {
  all: ['cashback'] as const,
  list: (filters?) => ['cashback', 'list', filters] as const,
  detail: (id: string) => ['cashback', 'detail', id] as const,
  pending: () => ['cashback', 'pending'] as const,
  paid: () => ['cashback', 'paid'] as const,
  requests: () => ['cashback', 'requests'] as const,
  analytics: (period: string) => ['cashback', 'analytics', period] as const,
  metrics: (dateRange?) => ['cashback', 'metrics', dateRange] as const,
};

/**
 * Hook to fetch a paginated list of cashback entries
 * O-7: Set staleTime to 1 minute for cashback data
 */
export function useCashback(
  filters?: {
    status?: 'pending' | 'paid' | 'rejected';
    page?: number;
    limit?: number;
    sortBy?: string;
    search?: string;
  },
  options?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: cashbackKeys.list(filters),
    queryFn: async () => {
      const response = await cashbackService.getCashbackRequests(filters as unknown);
      return response;
    },
    staleTime: 60_000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Hook to fetch a single cashback entry by ID
 * O-7: Set staleTime to 1 minute for cashback data
 */
export function useCashbackDetail(
  id: string,
  options?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: cashbackKeys.detail(id),
    queryFn: async () => {
      const response = await cashbackService.getCashbackRequest(id);
      return response;
    },
    enabled: !!id,
    staleTime: 60_000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Hook to fetch pending cashback requests
 */
export function usePendingCashback(options?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: cashbackKeys.pending(),
    queryFn: async () => {
      const response = await cashbackService.getCashbackRequests({
        status: 'pending',
      } as unknown);
      return response;
    },
    staleTime: 2 * 60 * 1000, // Update frequently for pending items
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch paid cashback
 * O-7: Set staleTime to 1 minute for cashback data
 */
export function usePaidCashback(options?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: cashbackKeys.paid(),
    queryFn: async () => {
      const response = await cashbackService.getCashbackRequests({
        status: 'paid',
      } as unknown);
      return response;
    },
    staleTime: 60_000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Hook to fetch cashback requests
 * O-7: Set staleTime to 1 minute for cashback data
 */
export function useCashbackRequests(options?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: cashbackKeys.requests(),
    queryFn: async () => {
      const response = await cashbackService.getCashbackRequests();
      return response.requests || [];
    },
    staleTime: 60_000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Hook to fetch cashback metrics
 * O-7: Set staleTime to 1 minute for cashback data
 */
export function useCashbackAnalytics(
  period: '7d' | '30d' | '90d' = '30d',
  options?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: cashbackKeys.analytics(period),
    queryFn: async () => {
      const response = await cashbackService.getCashbackMetrics();
      return response;
    },
    staleTime: 60_000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Compound hook for cashback overview
 */
export function useCashbackOverview(options?: {
  includePending?: boolean;
  includePaid?: boolean;
  includeRequests?: boolean;
  includeAnalytics?: boolean;
  period?: '7d' | '30d' | '90d';
}) {
  const {
    includePending = true,
    includePaid = true,
    includeRequests = false,
    includeAnalytics = true,
    period = '30d',
  } = options || {};

  const pendingQuery = useQuery({
    queryKey: cashbackKeys.pending(),
    queryFn: async () => {
      const response = await cashbackService.getCashbackRequests({
        status: 'pending',
      } as unknown);
      return response.requests || [];
    },
    enabled: includePending,
    staleTime: 2 * 60 * 1000,
  });

  const paidQuery = useQuery({
    queryKey: cashbackKeys.paid(),
    queryFn: async () => {
      const response = await cashbackService.getCashbackRequests({
        status: 'paid',
      } as unknown);
      return response.requests || [];
    },
    enabled: includePaid,
    ...queryConfig.cashback,
  });

  const requestsQuery = useQuery({
    queryKey: cashbackKeys.requests(),
    queryFn: async () => {
      const response = await cashbackService.getCashbackRequests();
      return response.requests || [];
    },
    enabled: includeRequests,
    ...queryConfig.cashback,
  });

  const analyticsQuery = useQuery({
    queryKey: cashbackKeys.analytics(period),
    queryFn: async () => {
      const response = await cashbackService.getCashbackMetrics();
      return response;
    },
    enabled: includeAnalytics,
    ...queryConfig.cashback,
  });

  return {
    pending: pendingQuery,
    paid: paidQuery,
    requests: requestsQuery,
    analytics: analyticsQuery,
    isLoading:
      pendingQuery.isLoading ||
      paidQuery.isLoading ||
      requestsQuery.isLoading ||
      analyticsQuery.isLoading,
    isError:
      pendingQuery.isError || paidQuery.isError || requestsQuery.isError || analyticsQuery.isError,
  };
}

import { QueryClient, DefaultOptions } from '@tanstack/react-query';

// Define default query and mutation options
const defaultOptions: DefaultOptions = {
  queries: {
    // Data will be considered fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Cache data for 10 minutes
    gcTime: 10 * 60 * 1000,
    // Retry failed requests up to 3 times with exponential backoff
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Don't refetch on window focus by default
    refetchOnWindowFocus: false,
    // Don't refetch on mount by default
    refetchOnMount: false,
    // Refetch on reconnect so merchants get fresh data after connectivity loss
    refetchOnReconnect: true,
  },
  mutations: {
    // Retry mutations once on failure
    retry: 1,
    retryDelay: 1000,
  },
};

// Create and configure QueryClient
export const queryClient = new QueryClient({
  defaultOptions,
});

// Custom configuration for specific query types
export const queryConfig = {
  // Dashboard queries - less frequent updates, longer cache
  dashboard: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  },
  // Product queries - moderate update frequency
  products: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  },
  // Order queries - frequent updates
  orders: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
  // Cashback queries - frequent updates
  cashback: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
  // Authentication queries - keep short cache
  auth: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  // Analytics queries - less frequent updates
  analytics: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  // Store queries - moderate update frequency
  stores: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  },
  // Team queries - less frequent
  team: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  },
  // Wallet queries - frequent updates
  wallet: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
  // Fraud queries - moderate
  fraud: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  },
  // Feature flags - infrequent changes
  featureFlags: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
};

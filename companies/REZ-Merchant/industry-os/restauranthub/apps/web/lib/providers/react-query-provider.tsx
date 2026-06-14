'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React, { useState } from 'react';

interface ReactQueryProviderProps {
  children: React.ReactNode;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: Data considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Cache time: Unused data removed after 10 minutes
            gcTime: 10 * 60 * 1000,
            // Retry configuration
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }
              // Retry up to 3 times for network errors
              return failureCount < 3;
            },
            // Retry delay with exponential backoff
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Background refetch settings
            refetchOnWindowFocus: false,
            refetchOnReconnect: 'always',
            refetchOnMount: true,
          },
          mutations: {
            // Retry mutations once
            retry: 1,
            // Mutation retry delay
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}
'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/lib/auth/auth-provider';
import { CartProvider } from '@/lib/cart/cart-context';
import { ErrorBoundary } from '@/components/error-boundaries';
import { WebVitalsProvider } from '@/components/analytics/web-vitals-provider';
// import { SocketProvider } from '@/lib/socket/socket-provider';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: (failureCount, error) => {
        if (error?.status === 404 || error?.status === 403) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary level="critical" enableRetry={true}>
      <WebVitalsProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ErrorBoundary level="page">
              <AuthProvider>
                <CartProvider>
                  {children}
                </CartProvider>
              </AuthProvider>
            </ErrorBoundary>
            <ReactQueryDevtools initialIsOpen={false} />
          </ThemeProvider>
        </QueryClientProvider>
      </WebVitalsProvider>
    </ErrorBoundary>
  );
}
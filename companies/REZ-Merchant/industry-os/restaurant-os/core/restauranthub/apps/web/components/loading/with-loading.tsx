'use client';

import React, { Suspense } from 'react';
import { LoadingSpinner } from './loading-spinner';
import { ErrorBoundary } from '@/components/error-boundaries';

interface WithLoadingProps {
  isLoading?: boolean;
  error?: Error | null;
  fallback?: React.ReactNode;
  skeleton?: React.ComponentType;
  children: React.ReactNode;
  className?: string;
}

export function WithLoading({
  isLoading = false,
  error = null,
  fallback,
  skeleton: SkeletonComponent,
  children,
  className,
}: WithLoadingProps) {
  if (error) {
    throw error;
  }

  if (isLoading) {
    if (SkeletonComponent) {
      return <SkeletonComponent />;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className={className}>
        <LoadingSpinner size="lg" variant="restaurant" />
      </div>
    );
  }

  return <>{children}</>;
}

interface AsyncComponentProps<T> {
  asyncData: {
    data: T | null;
    isLoading: boolean;
    error: Error | null;
  };
  fallback?: React.ReactNode;
  skeleton?: React.ComponentType;
  children: (data: T) => React.ReactNode;
  className?: string;
}

export function AsyncComponent<T>({
  asyncData,
  fallback,
  skeleton,
  children,
  className,
}: AsyncComponentProps<T>) {
  const { data, isLoading, error } = asyncData;

  return (
    <ErrorBoundary level="component">
      <WithLoading
        isLoading={isLoading}
        error={error}
        fallback={fallback}
        skeleton={skeleton}
        className={className}
      >
        {data ? children(data) : null}
      </WithLoading>
    </ErrorBoundary>
  );
}

// HOC for wrapping components with loading states
export function withLoading<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode;
    skeleton?: React.ComponentType;
  }
) {
  return function WrappedComponent(
    props: P & { isLoading?: boolean; error?: Error | null }
  ) {
    const { isLoading, error, ...componentProps } = props;

    return (
      <ErrorBoundary level="component">
        <WithLoading
          isLoading={isLoading}
          error={error}
          fallback={options?.fallback}
          skeleton={options?.skeleton}
        >
          <Component {...(componentProps as P)} />
        </WithLoading>
      </ErrorBoundary>
    );
  };
}

// Suspense wrapper with error boundary
export function SuspenseWrapper({
  fallback,
  children,
  className,
}: {
  fallback?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const defaultFallback = (
    <div className={className}>
      <LoadingSpinner size="lg" variant="restaurant" />
    </div>
  );

  return (
    <ErrorBoundary level="component">
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
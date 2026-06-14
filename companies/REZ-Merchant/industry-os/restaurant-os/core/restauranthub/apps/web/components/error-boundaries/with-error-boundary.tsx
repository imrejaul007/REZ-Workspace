'use client';

import React from 'react';
import ErrorBoundary, { ErrorFallbackProps } from './error-boundary';

interface WithErrorBoundaryOptions {
  fallbackComponent?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  enableRetry?: boolean;
  level?: 'page' | 'component' | 'critical';
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const {
    fallbackComponent,
    onError,
    enableRetry = true,
    level = 'component',
    resetOnPropsChange = false,
    resetKeys = [],
  } = options;

  const WrappedComponent = React.forwardRef<unknown, P>((props, ref) => {
    const [resetCount, setResetCount] = React.useState(0);

    // Reset error boundary when props change (if enabled)
    const prevResetKeys = React.useRef(resetKeys);
    React.useEffect(() => {
      if (resetOnPropsChange) {
        const hasChanged = resetKeys.some((key, index) => key !== prevResetKeys.current[index]);
        if (hasChanged) {
          setResetCount(count => count + 1);
        }
        prevResetKeys.current = resetKeys;
      }
    }, resetKeys);

    return (
      <ErrorBoundary
        key={resetCount}
        fallbackComponent={fallbackComponent}
        onError={onError}
        enableRetry={enableRetry}
        level={level}
      >
        <Component {...props} ref={ref} />
      </ErrorBoundary>
    );
  });

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Convenience HOC for page-level error boundaries
export function withPageErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<WithErrorBoundaryOptions, 'level'> = {}
) {
  return withErrorBoundary(Component, { ...options, level: 'page' });
}

// Convenience HOC for component-level error boundaries
export function withComponentErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<WithErrorBoundaryOptions, 'level'> = {}
) {
  return withErrorBoundary(Component, { ...options, level: 'component' });
}

// Convenience HOC for critical error boundaries
export function withCriticalErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<WithErrorBoundaryOptions, 'level'> = {}
) {
  return withErrorBoundary(Component, { ...options, level: 'critical' });
}
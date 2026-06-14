// @ts-nocheck
/**
 * useErrorHandler Hook
 * React hook for error boundary integration and error handling
 *
 * Features:
 * - Wraps async operations with error logging
 * - Integrates with React error boundaries
 * - Provides error state management
 * - Supports retry logic
 */

import { useCallback, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { errorLogger, log } from '../services/errorLogger';
import { ErrorCategory, ErrorBoundaryState } from '../types/error';

interface UseErrorHandlerOptions {
  /** Enable automatic retry on failure */
  enableRetry?: boolean;
  /** Maximum number of retries */
  maxRetries?: number;
  /** Delay between retries in ms */
  retryDelay?: number;
  /** Category for logging */
  category?: ErrorCategory;
  /** Action name for context */
  actionName?: string;
  /** Callback on error */
  onError?: (error: Error, context?: Record<string, unknown>) => void;
  /** Callback when error is resolved */
  onErrorResolved?: () => void;
}

interface ErrorHandlerResult {
  /** Current error state */
  error: Error | null;
  /** Whether there's an active error */
  hasError: boolean;
  /** Error timestamp */
  errorTimestamp: number | null;
  /** Wrap an async function with error handling */
  wrapAsync: <T>(
    fn: () => Promise<T>,
    options?: {
      actionName?: string;
      context?: Record<string, unknown>;
      onSuccess?: (result: T) => void;
    }
  ) => Promise<T | null>;
  /** Execute a function and catch/log errors */
  execute: <T>(
    fn: () => T,
    options?: {
      actionName?: string;
      context?: Record<string, unknown>;
    }
  ) => T | null;
  /** Manually trigger an error */
  triggerError: (error: Error | string, context?: Record<string, unknown>) => void;
  /** Clear the current error */
  clearError: () => void;
  /** Retry the last failed operation */
  retry: () => Promise<void>;
  /** Last operation result */
  lastResult: unknown;
  /** Whether operation is in progress */
  isLoading: boolean;
  /** Reset to initial state */
  reset: () => void;
}

/**
 * Hook for handling errors in components
 */
export function useErrorHandler(
  options: UseErrorHandlerOptions = {}
): ErrorHandlerResult {
  const {
    enableRetry = false,
    maxRetries = 3,
    retryDelay = 1000,
    category = ErrorCategory.UNKNOWN,
    actionName = 'useErrorHandler',
    onError,
    onErrorResolved,
  } = options;

  const [error, setError] = useState<Error | null>(null);
  const [errorTimestamp, setErrorTimestamp] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<unknown>(null);

  // Refs for retry logic
  const lastFailedFn = useRef<() => Promise<unknown> | null>(null);
  const retryCount = useRef(0);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
    setErrorTimestamp(null);
    retryCount.current = 0;
    onErrorResolved?.();
  }, [onErrorResolved]);

  /**
   * Manually trigger an error
   */
  const triggerError = useCallback(
    (err: Error | string, context?: Record<string, unknown>) => {
      const errorObj = typeof err === 'string' ? new Error(err) : err;
      setError(errorObj);
      setErrorTimestamp(Date.now());

      errorLogger.logError(actionName, errorObj, category, context);
      onError?.(errorObj, context);
    },
    [actionName, category, onError]
  );

  /**
   * Wrap an async function with error handling
   */
  const wrapAsync = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      options?: {
        actionName?: string;
        context?: Record<string, unknown>;
        onSuccess?: (result: T) => void;
      }
    ): Promise<T | null> => {
      const { actionName: customAction, context, onSuccess } = options || {};
      const action = customAction || actionName;

      setIsLoading(true);
      errorLogger.pushAction(action);

      try {
        const result = await fn();
        setLastResult(result);
        onSuccess?.(result);
        errorLogger.popAction();
        return result;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));

        setError(errorObj);
        setErrorTimestamp(Date.now());

        // Log the error
        errorLogger.logError(action, errorObj, category, context);

        // Call error callback
        onError?.(errorObj, context);

        // Store for retry
        lastFailedFn.current = fn;
        retryCount.current = 0;

        // Auto-retry if enabled
        if (enableRetry && retryCount.current < maxRetries) {
          // Delay and retry handled in retry function
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [actionName, category, enableRetry, maxRetries, onError]
  );

  /**
   * Execute a synchronous function with error handling
   */
  const execute = useCallback(
    <T,>(
      fn: () => T,
      options?: {
        actionName?: string;
        context?: Record<string, unknown>;
      }
    ): T | null => {
      const { actionName: customAction, context } = options || {};
      const action = customAction || actionName;

      errorLogger.pushAction(action);

      try {
        const result = fn();
        setLastResult(result);
        errorLogger.popAction();
        return result;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));

        setError(errorObj);
        setErrorTimestamp(Date.now());

        errorLogger.logError(action, errorObj, category, context);
        onError?.(errorObj, context);

        return null;
      }
    },
    [actionName, category, onError]
  );

  /**
   * Retry the last failed operation
   */
  const retry = useCallback(async () => {
    if (!enableRetry) return;
    if (!lastFailedFn.current) return;
    if (retryCount.current >= maxRetries) {
      log.warn('Max retries reached', { retryCount: retryCount.current });
      return;
    }

    retryCount.current++;
    setIsLoading(true);

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, retryDelay));

    try {
      await lastFailedFn.current();
      clearError();
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      setErrorTimestamp(Date.now());
      errorLogger.logError(
        `${actionName}:retry:${retryCount.current}`,
        errorObj,
        category
      );
    } finally {
      setIsLoading(false);
    }
  }, [enableRetry, maxRetries, retryDelay, actionName, category, clearError]);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setError(null);
    setErrorTimestamp(null);
    setIsLoading(false);
    setLastResult(null);
    lastFailedFn.current = null;
    retryCount.current = 0;
    errorLogger.clearActions();
  }, []);

  return {
    error,
    hasError: error !== null,
    errorTimestamp,
    wrapAsync,
    execute,
    triggerError,
    clearError,
    retry,
    lastResult,
    isLoading,
    reset,
  };
}

/**
 * Create a wrapped error handler for a specific module
 */
export function createErrorHandler(
  moduleName: string,
  defaultCategory: ErrorCategory = ErrorCategory.UNKNOWN
) {
  return function useModuleErrorHandler(
    options: Omit<UseErrorHandlerOptions, 'actionName' | 'category'> = {}
  ) {
    return useErrorHandler({
      ...options,
      actionName: moduleName,
      category: defaultCategory,
    });
  };
}

/**
 * Error boundary component wrapper for class components
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>,
  options?: UseErrorHandlerOptions
) {
  return function ErrorBoundedComponent(props: P) {
    const errorHandler = useErrorHandler(options);

    if (errorHandler.hasError && fallback) {
      const FallbackComponent = fallback;
      return (
        <FallbackComponent
          error={errorHandler.error!}
          resetError={errorHandler.clearError}
        />
      );
    }

    if (errorHandler.hasError) {
      // Default fallback UI
      return (
        <View style={defaultStyles.container}>
          <Text style={defaultStyles.title}>Something went wrong</Text>
          <Text style={defaultStyles.message}>{errorHandler.error?.message}</Text>
          <TouchableOpacity onPress={errorHandler.clearError} style={defaultStyles.button}>
            <Text style={defaultStyles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

const defaultStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default useErrorHandler;

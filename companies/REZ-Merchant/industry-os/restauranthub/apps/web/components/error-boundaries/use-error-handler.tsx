'use client';

import { useCallback, useEffect, useState } from 'react';

interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

interface UseErrorHandlerOptions {
  onError?: (error: Error, errorId: string) => void;
  resetOnMount?: boolean;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { onError, resetOnMount = true } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorId: '',
  });

  // Reset error state on mount if enabled
  useEffect(() => {
    if (resetOnMount) {
      setErrorState({
        hasError: false,
        error: null,
        errorId: '',
      });
    }
  }, [resetOnMount]);

  const handleError = useCallback((error: Error) => {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newErrorState = {
      hasError: true,
      error,
      errorId,
    };

    setErrorState(newErrorState);

    // Log error to console
    console.error('Error handled by useErrorHandler:', error);

    // Call custom error handler
    onError?.(error, errorId);

    // Report to error tracking service
    if (typeof window !== 'undefined') {
      // This would integrate with your error tracking service
      // Example: Sentry.captureException(error, { extra: { errorId } });
      console.log('Error reported:', { error: error.message, errorId });
    }

    return errorId;
  }, [onError]);

  const resetError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorId: '',
    });
  }, []);

  const throwError = useCallback((error: Error) => {
    handleError(error);
    throw error;
  }, [handleError]);

  return {
    ...errorState,
    handleError,
    resetError,
    throwError,
  };
}

// Hook for handling async operations with error handling
export function useAsyncErrorHandler<T>(
  asyncOperation: () => Promise<T>,
  options: UseErrorHandlerOptions & {
    onSuccess?: (result: T) => void;
    dependencies?: React.DependencyList;
  } = {}
) {
  const { onSuccess, dependencies = [], ...errorOptions } = options;
  const { handleError, ...errorState } = useErrorHandler(errorOptions);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<T | null>(null);

  const execute = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await asyncOperation();
      setResult(data);
      onSuccess?.(data);
      return data;
    } catch (error) {
      const errorId = handleError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [asyncOperation, handleError, onSuccess]);

  useEffect(() => {
    execute().catch(() => {
      // Error already handled by handleError
    });
  }, dependencies);

  return {
    ...errorState,
    isLoading,
    result,
    execute,
  };
}
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('[ErrorBoundary] Caught render error', { error, componentStack: info.componentStack });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-8 text-center">
          <p className="text-sm font-medium text-gray-700">
            Something went wrong in this section.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error?.message && (
            <pre className="w-full max-w-sm text-left text-xs bg-gray-100 text-gray-600 rounded-lg p-3 overflow-auto whitespace-pre-wrap break-words">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleRetry}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-2 focus:outline-2 focus:outline-indigo-400 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 rounded"
            aria-label="Retry the operation"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

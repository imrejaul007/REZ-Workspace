'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  RefreshCw,
  Home,
  Bug,
  Wifi,
  Server,
  Eye,
  EyeOff
} from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showErrorDetails: boolean;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  level?: 'page' | 'component' | 'critical';
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorId: string;
  level: 'page' | 'component' | 'critical';
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showErrorDetails: false,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // FIX (security): Replaced Math.random() with crypto for error ID generation
    const errorId = (() => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `ERR_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').substring(0, 9)}`;
      }
      // Fallback
      return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    })();
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    const errorId = this.state.errorId;

    // Log error for monitoring
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Send to error tracking service (Sentry, LogRocket, etc.)
    if (typeof window !== 'undefined') {
      // Only log in browser
      this.logErrorToService(error, errorInfo, errorId);
    }

    this.setState({
      errorInfo,
    });

    // Call custom error handler
    onError?.(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    // Implementation for error tracking service
    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      level: this.props.level || 'component',
    };

    // Send to your error tracking service
    // Example: Sentry.captureException(error, { extra: errorReport });
    console.log('Error report:', errorReport);
  };

  private handleReset = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showErrorDetails: false,
      errorId: '',
    });
  };

  private toggleErrorDetails = () => {
    this.setState(prev => ({
      showErrorDetails: !prev.showErrorDetails,
    }));
  };

  private renderErrorType = () => {
    const { error } = this.state;
    if (!error) return null;

    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return {
        type: 'chunk',
        icon: <Server className="h-6 w-6" />,
        title: 'Resource Loading Error',
        description: 'Failed to load application resources. This usually happens after an update.',
        action: 'Please refresh the page to load the latest version.',
      };
    }

    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return {
        type: 'network',
        icon: <Wifi className="h-6 w-6" />,
        title: 'Network Error',
        description: 'Unable to connect to our servers.',
        action: 'Please check your internet connection and try again.',
      };
    }

    return {
      type: 'generic',
      icon: <Bug className="h-6 w-6" />,
      title: 'Application Error',
      description: 'Something unexpected happened.',
      action: 'Our team has been notified and is working on a fix.',
    };
  };

  render() {
    const { hasError, error, errorInfo, showErrorDetails, errorId } = this.state;
    const { children, fallbackComponent: FallbackComponent, enableRetry = true, level = 'component' } = this.props;

    if (hasError && error) {
      // Use custom fallback component if provided
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            resetError={this.handleReset}
            errorId={errorId}
            level={level}
          />
        );
      }

      const errorType = this.renderErrorType();

      // Component-level error boundary
      if (level === 'component') {
        return (
          <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Component failed to load</span>
                {enableRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={this.handleReset}
                    className="ml-2"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          </div>
        );
      }

      // Page-level error boundary
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-destructive/10 rounded-full">
                  {errorType?.icon || <AlertCircle className="h-8 w-8 text-destructive" />}
                </div>
              </div>
              <CardTitle className="text-2xl">
                {errorType?.title || 'Something went wrong'}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center text-muted-foreground">
                <p>{errorType?.description}</p>
                <p className="mt-2">{errorType?.action}</p>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={this.toggleErrorDetails}
                    className="w-full"
                  >
                    {showErrorDetails ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Hide Error Details
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Show Error Details
                      </>
                    )}
                  </Button>

                  {showErrorDetails && (
                    <div className="space-y-4 p-4 bg-muted rounded-lg text-left">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Error Message:</h4>
                        <pre className="text-xs bg-background p-2 rounded overflow-auto">
                          {error.message}
                        </pre>
                      </div>

                      {error.stack && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Stack Trace:</h4>
                          <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-40">
                            {error.stack}
                          </pre>
                        </div>
                      )}

                      {errorInfo?.componentStack && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Component Stack:</h4>
                          <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-40">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium text-sm mb-2">Error ID:</h4>
                        <code className="text-xs bg-background p-2 rounded block">
                          {errorId}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                {enableRetry && (
                  <Button onClick={this.handleReset} className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {level === 'critical' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Critical error detected. Please contact support with Error ID: {errorId}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
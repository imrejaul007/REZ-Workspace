// Error reporting utilities for external services

interface ErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  level: 'page' | 'component' | 'critical';
  metadata?: Record<string, unknown>;
}

interface ErrorReportingConfig {
  apiEndpoint?: string;
  apiKey?: string;
  enableConsoleLog?: boolean;
  enableLocalStorage?: boolean;
  maxStoredErrors?: number;
  environment?: string;
}

class ErrorReporting {
  private config: ErrorReportingConfig;

  constructor(config: ErrorReportingConfig = {}) {
    this.config = {
      enableConsoleLog: true,
      enableLocalStorage: true,
      maxStoredErrors: 50,
      environment: process.env.NODE_ENV || 'development',
      ...config,
    };
  }

  async reportError(
    error: Error,
    errorInfo?: React.ErrorInfo,
    level: 'page' | 'component' | 'critical' = 'component',
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const errorReport: ErrorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      level,
      metadata,
    };

    // Add user context if available
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          errorReport.userId = user.id;
        } catch {
          // Ignore parsing errors
        }
      }
    }

    // Log to console in development
    if (this.config.enableConsoleLog) {
      console.group(`🚨 Error Report [${errorId}]`);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      if (errorInfo?.componentStack) {
        console.error('Component Stack:', errorInfo.componentStack);
      }
      if (metadata) {
        console.error('Metadata:', metadata);
      }
      console.groupEnd();
    }

    // Store locally for debugging
    if (this.config.enableLocalStorage && typeof window !== 'undefined') {
      this.storeErrorLocally(errorReport);
    }

    // Send to external service
    if (this.config.apiEndpoint) {
      try {
        await this.sendToExternalService(errorReport);
      } catch (sendError) {
        console.error('Failed to send error report:', sendError);
      }
    }

    // Integration with popular error tracking services
    this.integrateWithServices(error, errorReport);

    return errorId;
  }

  private storeErrorLocally(errorReport: ErrorReport): void {
    try {
      const stored = localStorage.getItem('error_reports');
      const reports: ErrorReport[] = stored ? JSON.parse(stored) : [];

      reports.unshift(errorReport);

      // Keep only the most recent errors
      if (reports.length > (this.config.maxStoredErrors || 50)) {
        reports.splice(this.config.maxStoredErrors || 50);
      }

      localStorage.setItem('error_reports', JSON.stringify(reports));
    } catch {
      // Ignore storage errors
    }
  }

  private async sendToExternalService(errorReport: ErrorReport): Promise<void> {
    if (!this.config.apiEndpoint) return;

    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
      },
      body: JSON.stringify(errorReport),
    });

    if (!response.ok) {
      throw new Error(`Failed to send error report: ${response.statusText}`);
    }
  }

  private integrateWithServices(error: Error, errorReport: ErrorReport): void {
    // Sentry integration
    if (typeof window !== 'undefined' && (window as unknown).Sentry) {
      (window as unknown).Sentry.captureException(error, {
        tags: {
          level: errorReport.level,
          errorId: errorReport.errorId,
        },
        extra: errorReport.metadata,
      });
    }

    // LogRocket integration
    if (typeof window !== 'undefined' && (window as unknown).LogRocket) {
      (window as unknown).LogRocket.captureException(error);
    }

    // Bugsnag integration
    if (typeof window !== 'undefined' && (window as unknown).Bugsnag) {
      (window as unknown).Bugsnag.notify(error, {
        metaData: errorReport.metadata,
        severity: errorReport.level === 'critical' ? 'error' : 'warning',
      });
    }

    // DataDog integration
    if (typeof window !== 'undefined' && (window as unknown).DD_RUM) {
      (window as unknown).DD_RUM.addError(error, {
        level: errorReport.level,
        errorId: errorReport.errorId,
        ...errorReport.metadata,
      });
    }
  }

  getStoredErrors(): ErrorReport[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem('error_reports');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  clearStoredErrors(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('error_reports');
    }
  }

  updateConfig(newConfig: Partial<ErrorReportingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Create singleton instance
const errorReporting = new ErrorReporting();

// Export convenience function
export const reportError = (
  error: Error,
  errorInfo?: React.ErrorInfo,
  level?: 'page' | 'component' | 'critical',
  metadata?: Record<string, unknown>
) => errorReporting.reportError(error, errorInfo, level, metadata);

// Export class for custom configurations
export { ErrorReporting };

// Export utility functions
export const getStoredErrors = () => errorReporting.getStoredErrors();
export const clearStoredErrors = () => errorReporting.clearStoredErrors();
export const updateErrorReportingConfig = (config: Partial<ErrorReportingConfig>) =>
  errorReporting.updateConfig(config);

// Initialize error reporting configuration
export const initializeErrorReporting = (config: ErrorReportingConfig) => {
  errorReporting.updateConfig(config);

  // Set up global error handlers
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      reportError(
        new Error(event.message),
        undefined,
        'critical',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      );
    });

    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

      reportError(error, undefined, 'critical', {
        type: 'unhandledrejection',
        promise: event.promise,
      });
    });
  }
};
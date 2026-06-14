import { logger } from '../../shared/logger';
/**
 * Crash Reporting Service - Sentry integration
 */

import * as Sentry from 'sentry-expo';

const SENTRY_DSN = process.env.SENTRY_DSN || 'https://xxx@sentry.io/xxx';

class CrashReportingService {
  initialize(): void {
    Sentry.init({
      dsn: SENTRY_DSN,
      enableInExpoDevelopment: true,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV || 'development',
    });

    logger.info('Crash reporting initialized');
  }

  setUser(userId: string, email?: string): void {
    Sentry.Native.setUser({
      id: userId,
      email,
    });
  }

  clearUser(): void {
    Sentry.Native.setUser(null);
  }

  setTag(key: string, value: string): void {
    Sentry.Native.setTag(key, value);
  }

  addBreadcrumb(message: string, data?: Record<string, any>): void {
    Sentry.Native.addBreadcrumb({
      message,
      data,
      timestamp: Date.now(),
    });
  }

  captureError(error: Error, context?: Record<string, any>): void {
    Sentry.Native.captureException(error, {
      extra: context,
    });
  }

  captureMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' = 'info'): void {
    Sentry.Native.captureMessage(message, level);
  }

  // Navigation breadcrumb
  logNavigation(from: string, to: string): void {
    this.addBreadcrumb(`Navigation: ${from} -> ${to}`, { from, to });
  }

  // API error
  logApiError(endpoint: string, statusCode: number, error?: string): void {
    this.captureMessage(`API Error: ${endpoint}`, 'error');
    this.addBreadcrumb('API Error', { endpoint, statusCode, error });
  }

  // User action
  logUserAction(action: string, data?: Record<string, any>): void {
    this.addBreadcrumb(`User Action: ${action}`, data);
  }

  // Manual test crash (for testing)
  testCrash(): void {
    throw new Error('Test crash - this is intentional!');
  }
}

export const crashReporting = new CrashReportingService();
export default crashReporting;

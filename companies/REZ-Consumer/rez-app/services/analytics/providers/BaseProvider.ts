// @ts-nocheck
/**
 * Base Analytics Provider
 *
 * Abstract base class for all analytics providers
 */

import { AnalyticsProvider, PurchaseTransaction } from '../types';

export abstract class BaseAnalyticsProvider implements AnalyticsProvider {
  abstract name: string;
  protected enabled: boolean = true;
  protected debug: boolean = false;

  abstract initialize(config): Promise<void>;

  abstract trackEvent(name: string, properties?: Record<string, unknown>): void;

  abstract trackScreen(name: string, properties?: Record<string, unknown>): void;

  abstract setUserId(userId: string): void;

  abstract setUserProperties(properties: Record<string, unknown>): void;

  abstract trackPurchase(transaction: PurchaseTransaction): void;

  trackError(error: Error, context?: Record<string, unknown>): void {
    this.trackEvent('error_occurred', {
      error_message: error.message,
      error_name: error.name,
      error_stack: error.stack,
      ...context,
    });
  }

  async flush(): Promise<void> {
    // Default implementation - override if provider supports batching
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setDebug(debug: boolean): void {
    this.debug = debug;
  }

  protected log(...args: unknown[]): void {
    if (this.debug || __DEV__) {
      logger.debug(`[${this.name}]`, ...args);
    }
  }

  protected warn(...args: unknown[]): void {
    if (this.debug || __DEV__) {
      logger.warn(`[${this.name}]`, ...args);
    }
  }

  protected error(...args: unknown[]): void {
  }
}

/**
 * Provider Configurations Service
 * Manages webhook provider configurations with built-in support for common providers
 */

import { ProviderType, VerificationAlgorithm, ProviderConfig } from '../types';
import { logger } from '../utils/logger';

export class ProviderConfigsService {
  private providers: Map<string, ProviderConfig> = new Map();
  private readonly DEFAULT_SIGNATURE_HEADERS: Record<string, string> = {
    [ProviderType.RAZORPAY]: 'x-razorpay-signature',
    [ProviderType.PAYU]: 'hash',
    [ProviderType.PHONEPE]: 'x-verify',
    [ProviderType.PAYTM]: 'x-verify',
    [ProviderType.STRIPE]: 'stripe-signature',
    [ProviderType.SHOPIFY]: 'x-shopify-hmac-sha256',
    [ProviderType.WOOCOMMERCE]: 'x-wc-webhook-signature',
    [ProviderType.CUSTOM]: 'x-signature'
  };

  constructor() {
    this.initializeDefaultProviders();
  }

  /**
   * Initialize default provider configurations
   */
  private initializeDefaultProviders(): void {
    // Razorpay configuration
    this.providers.set('razorpay', {
      id: 'razorpay',
      name: 'Razorpay',
      type: ProviderType.RAZORPAY,
      algorithm: VerificationAlgorithm.HMAC_SHA256,
      secret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
      signatureHeader: 'x-razorpay-signature',
      timestampHeader: 'x-razorpay-timestamp',
      timestampTolerance: 300,
      enabled: true,
      allowedEvents: [
        'payment.authorized',
        'payment.captured',
        'payment.failed',
        'order.paid',
        'refund.created',
        'refund.processed'
      ]
    });

    // PayU configuration
    this.providers.set('payu', {
      id: 'payu',
      name: 'PayU',
      type: ProviderType.PAYU,
      algorithm: VerificationAlgorithm.HMAC_SHA512,
      secret: process.env.PAYU_SALT || '',
      signatureHeader: 'hash',
      timestampTolerance: 300,
      enabled: true,
      allowedEvents: [
        'payment.success',
        'payment.failed',
        'refund.initiated',
        'refund.processed'
      ]
    });

    // PhonePe configuration
    this.providers.set('phonepe', {
      id: 'phonepe',
      name: 'PhonePe',
      type: ProviderType.PHONEPE,
      algorithm: VerificationAlgorithm.HMAC_SHA256,
      secret: process.env.PHONEPE_SALT_KEY || '',
      signatureHeader: 'x-verify',
      timestampTolerance: 300,
      enabled: true,
      allowedEvents: [
        'PAYMENT_SUCCESS',
        'PAYMENT_FAILED',
        'REFUND_SUCCESS',
        'REFUND_INITIATED'
      ]
    });

    // Paytm configuration
    this.providers.set('paytm', {
      id: 'paytm',
      name: 'Paytm',
      type: ProviderType.PAYTM,
      algorithm: VerificationAlgorithm.HMAC_SHA256,
      secret: process.env.PAYTM_MERCHANT_KEY || '',
      signatureHeader: 'x-verify',
      timestampTolerance: 300,
      enabled: true,
      allowedEvents: [
        'payment',
        'refund',
        'settlement'
      ]
    });

    // Stripe configuration
    this.providers.set('stripe', {
      id: 'stripe',
      name: 'Stripe',
      type: ProviderType.STRIPE,
      algorithm: VerificationAlgorithm.HMAC_SHA256,
      secret: process.env.STRIPE_WEBHOOK_SECRET || '',
      signatureHeader: 'stripe-signature',
      timestampTolerance: 300,
      enabled: true,
      allowedEvents: [
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'charge.refunded',
        'customer.created',
        'customer.updated',
        'subscription.created',
        'subscription.updated',
        'subscription.deleted'
      ]
    });

    // Shopify configuration
    this.providers.set('shopify', {
      id: 'shopify',
      name: 'Shopify',
      type: ProviderType.SHOPIFY,
      algorithm: VerificationAlgorithm.HMAC_SHA256,
      secret: process.env.SHOPIFY_WEBHOOK_SECRET || '',
      signatureHeader: 'x-shopify-hmac-sha256',
      timestampHeader: 'x-shopify-shop-domain',
      timestampTolerance: 300,
      enabled: true,
      allowedEvents: [
        'orders/create',
        'orders/updated',
        'orders/paid',
        'orders/cancelled',
        'refunds/create',
        'customers/create',
        'customers/update',
        'products/create',
        'products/update'
      ]
    });

    logger.info('Default provider configurations initialized', {
      count: this.providers.size
    });
  }

  /**
   * Get provider configuration by ID
   */
  getProvider(id: string): ProviderConfig | undefined {
    return this.providers.get(id);
  }

  /**
   * Get provider configuration by type
   */
  getProviderByType(type: ProviderType): ProviderConfig | undefined {
    for (const provider of this.providers.values()) {
      if (provider.type === type) {
        return provider;
      }
    }
    return undefined;
  }

  /**
   * Get all providers
   */
  getAllProviders(): ProviderConfig[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get enabled providers
   */
  getEnabledProviders(): ProviderConfig[] {
    return Array.from(this.providers.values()).filter(p => p.enabled);
  }

  /**
   * Add a new provider configuration
   */
  addProvider(config: ProviderConfig): ProviderConfig {
    const validatedConfig: ProviderConfig = {
      ...config,
      signatureHeader: config.signatureHeader || this.DEFAULT_SIGNATURE_HEADERS[config.type] || 'x-signature',
      timestampTolerance: config.timestampTolerance || 300,
      enabled: config.enabled ?? true
    };

    this.providers.set(config.id, validatedConfig);
    logger.info('Provider added', { providerId: config.id, name: config.name });
    return validatedConfig;
  }

  /**
   * Update provider configuration
   */
  updateProvider(id: string, updates: Partial<ProviderConfig>): ProviderConfig | undefined {
    const existing = this.providers.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: ProviderConfig = {
      ...existing,
      ...updates,
      id: existing.id // Preserve original ID
    };

    this.providers.set(id, updated);
    logger.info('Provider updated', { providerId: id });
    return updated;
  }

  /**
   * Enable/disable provider
   */
  setProviderEnabled(id: string, enabled: boolean): boolean {
    const provider = this.providers.get(id);
    if (!provider) {
      return false;
    }

    provider.enabled = enabled;
    this.providers.set(id, provider);
    logger.info('Provider enabled state changed', { providerId: id, enabled });
    return true;
  }

  /**
   * Delete provider configuration
   */
  deleteProvider(id: string): boolean {
    const deleted = this.providers.delete(id);
    if (deleted) {
      logger.info('Provider deleted', { providerId: id });
    }
    return deleted;
  }

  /**
   * Check if event type is allowed for provider
   */
  isEventAllowed(providerId: string, eventType: string): boolean {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return false;
    }

    if (!provider.allowedEvents || provider.allowedEvents.length === 0) {
      return true; // No restrictions if no allowed events specified
    }

    return provider.allowedEvents.includes(eventType);
  }

  /**
   * Get provider secret for verification
   */
  getProviderSecret(id: string): string | undefined {
    const provider = this.providers.get(id);
    return provider?.secret;
  }

  /**
   * Get signature header name for provider
   */
  getSignatureHeader(providerId: string): string | undefined {
    const provider = this.providers.get(providerId);
    return provider?.signatureHeader;
  }

  /**
   * Reload providers from environment (for dynamic updates)
   */
  reloadFromEnvironment(): void {
    // Update Razorpay
    if (process.env.RAZORPAY_WEBHOOK_SECRET) {
      this.updateProvider('razorpay', { secret: process.env.RAZORPAY_WEBHOOK_SECRET });
    }

    // Update Stripe
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      this.updateProvider('stripe', { secret: process.env.STRIPE_WEBHOOK_SECRET });
    }

    // Update Shopify
    if (process.env.SHOPIFY_WEBHOOK_SECRET) {
      this.updateProvider('shopify', { secret: process.env.SHOPIFY_WEBHOOK_SECRET });
    }

    logger.info('Providers reloaded from environment');
  }

  /**
   * Get provider statistics
   */
  getStatistics(): {
    total: number;
    enabled: number;
    disabled: number;
    byType: Record<string, number>;
  } {
    const providers = this.getAllProviders();
    const byType: Record<string, number> = {};

    for (const provider of providers) {
      byType[provider.type] = (byType[provider.type] || 0) + 1;
    }

    return {
      total: providers.length,
      enabled: providers.filter(p => p.enabled).length,
      disabled: providers.filter(p => !p.enabled).length,
      byType
    };
  }
}

// Singleton instance
export const providerConfigs = new ProviderConfigsService();

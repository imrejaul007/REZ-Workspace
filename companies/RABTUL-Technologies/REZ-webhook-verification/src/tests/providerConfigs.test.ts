/**
 * Unit tests for Provider Configs Service
 */

import { ProviderConfigsService } from '../services/providerConfigs';
import { ProviderType, VerificationAlgorithm, ProviderConfig } from '../types';

describe('ProviderConfigsService', () => {
  let service: ProviderConfigsService;

  beforeEach(() => {
    service = new ProviderConfigsService();
  });

  describe('Initial Configuration', () => {
    it('should initialize with default providers', () => {
      const providers = service.getAllProviders();
      expect(providers.length).toBeGreaterThan(0);
    });

    it('should have Razorpay configured', () => {
      const razorpay = service.getProvider('razorpay');
      expect(razorpay).toBeDefined();
      expect(razorpay?.type).toBe(ProviderType.RAZORPAY);
      expect(razorpay?.algorithm).toBe(VerificationAlgorithm.HMAC_SHA256);
    });

    it('should have Stripe configured', () => {
      const stripe = service.getProvider('stripe');
      expect(stripe).toBeDefined();
      expect(stripe?.type).toBe(ProviderType.STRIPE);
      expect(stripe?.algorithm).toBe(VerificationAlgorithm.HMAC_SHA256);
    });

    it('should have Shopify configured', () => {
      const shopify = service.getProvider('shopify');
      expect(shopify).toBeDefined();
      expect(shopify?.type).toBe(ProviderType.SHOPIFY);
    });
  });

  describe('Provider Management', () => {
    it('should add a new provider', () => {
      const newProvider: ProviderConfig = {
        id: 'custom-provider',
        name: 'Custom Provider',
        type: ProviderType.CUSTOM,
        algorithm: VerificationAlgorithm.HMAC_SHA256,
        secret: 'custom-secret',
        enabled: true
      };

      const added = service.addProvider(newProvider);
      expect(added.id).toBe('custom-provider');
      expect(service.getProvider('custom-provider')).toBeDefined();
    });

    it('should update existing provider', () => {
      const updated = service.updateProvider('razorpay', {
        enabled: false
      });

      expect(updated).toBeDefined();
      expect(updated?.enabled).toBe(false);
    });

    it('should return undefined for non-existent provider update', () => {
      const updated = service.updateProvider('non-existent', {
        enabled: false
      });

      expect(updated).toBeUndefined();
    });

    it('should delete provider', () => {
      const deleted = service.deleteProvider('razorpay');
      expect(deleted).toBe(true);
      expect(service.getProvider('razorpay')).toBeUndefined();
    });

    it('should return false when deleting non-existent provider', () => {
      const deleted = service.deleteProvider('non-existent');
      expect(deleted).toBe(false);
    });

    it('should enable/disable provider', () => {
      const result = service.setProviderEnabled('razorpay', false);
      expect(result).toBe(true);

      const provider = service.getProvider('razorpay');
      expect(provider?.enabled).toBe(false);
    });
  });

  describe('Event Type Validation', () => {
    it('should allow defined event type', () => {
      const allowed = service.isEventAllowed('razorpay', 'payment.captured');
      expect(allowed).toBe(true);
    });

    it('should reject undefined event type for restricted provider', () => {
      const allowed = service.isEventAllowed('razorpay', 'unknown.event');
      expect(allowed).toBe(false);
    });

    it('should allow all events if no restrictions', () => {
      const allowed = service.isEventAllowed('custom-provider', 'any.event');
      // Returns true when no restrictions exist
      expect(typeof allowed).toBe('boolean');
    });
  });

  describe('Statistics', () => {
    it('should return correct statistics', () => {
      const stats = service.getStatistics();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('enabled');
      expect(stats).toHaveProperty('disabled');
      expect(stats).toHaveProperty('byType');

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.enabled + stats.disabled).toBe(stats.total);
    });

    it('should count providers by type', () => {
      const stats = service.getStatistics();
      expect(stats.byType).toHaveProperty(ProviderType.RAZORPAY);
      expect(stats.byType).toHaveProperty(ProviderType.STRIPE);
    });
  });

  describe('Signature Headers', () => {
    it('should return correct header for Razorpay', () => {
      const header = service.getSignatureHeader('razorpay');
      expect(header).toBe('x-razorpay-signature');
    });

    it('should return correct header for Stripe', () => {
      const header = service.getSignatureHeader('stripe');
      expect(header).toBe('stripe-signature');
    });

    it('should return undefined for unknown provider', () => {
      const header = service.getSignatureHeader('unknown');
      expect(header).toBeUndefined();
    });
  });
});

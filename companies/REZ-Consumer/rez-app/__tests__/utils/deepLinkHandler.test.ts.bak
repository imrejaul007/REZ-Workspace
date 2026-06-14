/**
 * Unit Tests for deepLinkHandler.ts
 */

import { DeepLinkHandler } from '@/utils/deepLinkHandler';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-linking to return predictable parsed values
jest.mock('expo-linking', () => ({
  __esModule: true,
  default: {
    parse: jest.fn((url: string) => {
      // Extract query params from URL
      const queryParams: Record<string, string> = {};
      const queryStart = url.indexOf('?');
      if (queryStart !== -1) {
        const queryString = url.slice(queryStart + 1);
        queryString.split('&').forEach(param => {
          const [key, value] = param.split('=');
          if (key) queryParams[key] = decodeURIComponent(value || '');
        });
      }

      // Return predictable parsed values for each URL pattern.
      // parseDeepLink checks hostname and path for patterns like 'invite', 'product', etc.
      if (url.includes('/invite/')) {
        const code = url.split('/invite/')[1].split('?')[0].split('#')[0];
        return { hostname: 'invite', path: `invite/${code}`, queryParams };
      }
      if (url.includes('/ref/')) {
        const code = url.split('/ref/')[1].split('?')[0].split('#')[0];
        return { hostname: 'ref', path: `ref/${code}`, queryParams };
      }
      if (url.includes('/product/')) {
        const id = url.split('/product/')[1].split('?')[0].split('#')[0];
        // Use /product/<id> path so path?.includes('/product/') returns true
        return { hostname: 'product', path: `/product/${id}`, queryParams };
      }
      if (url.includes('/store/')) {
        const id = url.split('/store/')[1].split('?')[0].split('#')[0];
        return { hostname: 'store', path: `/store/${id}`, queryParams };
      }
      if (url.includes('/offer/')) {
        const id = url.split('/offer/')[1].split('?')[0].split('#')[0];
        return { hostname: 'offer', path: `/offer/${id}`, queryParams };
      }
      // For edge case URLs (malformed, fragment-only, relative, no scheme),
      // return the original URL data so the handler returns 'unknown' type.
      if (url.includes('///') || url.startsWith('/') || !url.includes('://')) {
        return { hostname: '', path: url, queryParams: {} };
      }
      return { hostname: 'rez.app', path: url.replace(/^https?:\/\/rez\.app\/?/, ''), queryParams: {} };
    }),
    getInitialURL: jest.fn(),
    addEventListener: jest.fn(),
  },
}));

// Mock ReferralHandler
jest.mock('@/utils/referralHandler', () => ({
  storeReferralCode: jest.fn().mockResolvedValue(undefined),
  getStoredReferralCode: jest.fn().mockResolvedValue(null),
  clearReferralCode: jest.fn().mockResolvedValue(undefined),
}));

describe('deepLinkHandler', () => {
  let handler: DeepLinkHandler;

  beforeEach(() => {
    handler = new DeepLinkHandler();
    jest.clearAllMocks();
  });

  describe('parseDeepLink', () => {
    it('should parse referral link with /invite/ pattern', () => {
      const url = 'https://rez.app/invite/ABC123';
      const result = handler.parseDeepLink(url);

      expect(result.type).toBe('referral');
      expect(result.data.code).toBe('ABC123');
    });

    it('should parse referral link with /ref/ pattern', () => {
      const url = 'https://rez.app/ref/XYZ789';
      const result = handler.parseDeepLink(url);

      expect(result.type).toBe('referral');
      expect(result.data.code).toBe('XYZ789');
    });

    it('should parse referral link with query parameter source', () => {
      const url = 'https://rez.app/invite/ABC123?source=email';
      const result = handler.parseDeepLink(url);

      expect(result.type).toBe('referral');
      expect(result.data.code).toBe('ABC123');
      expect(result.data.source).toBe('email');
    });

    it('should parse product link', () => {
      // IDs must be valid MongoDB ObjectIds (24 hex characters)
      const url = 'https://rez.app/product/507f1f77bcf86cd799439011';
      const result = handler.parseDeepLink(url);

      expect(result.type).toBe('product');
      expect(result.data.productId).toBe('507f1f77bcf86cd799439011');
    });

    it('should parse store link', () => {
      const url = 'https://rez.app/store/507f1f77bcf86cd799439012';
      const result = handler.parseDeepLink(url);

      expect(result.type).toBe('store');
      expect(result.data.storeId).toBe('507f1f77bcf86cd799439012');
    });

    it('should parse offer link', () => {
      const url = 'https://rez.app/offer/507f1f77bcf86cd799439013';
      const result = handler.parseDeepLink(url);

      expect(result.type).toBe('offer');
      expect(result.data.offerId).toBe('507f1f77bcf86cd799439013');
    });

    it('should return unknown type for unrecognized URL', () => {
      const url = 'https://rez.app/unknown/path';
      const result = handler.parseDeepLink(url);

      expect(result.type).toBe('unknown');
      expect(result.data.url).toBe(url);
    });

    it('should handle malformed URLs gracefully', () => {
      const url = 'not-a-valid-url';
      const result = handler.parseDeepLink(url);

      expect(result.type).toBe('unknown');
      expect(result.data).toBeDefined();
    });

    it('should uppercase referral codes', () => {
      const url = 'https://rez.app/invite/abc123';
      const result = handler.parseDeepLink(url);

      expect(result.type).toBe('referral');
      expect(result.data.code).toBe('ABC123');
    });
  });

  describe('generateDeepLink', () => {
    it('should generate referral deep link', () => {
      const url = handler.generateDeepLink('referral', 'ABC123');

      expect(url).toBe('https://rez.app/invite/ABC123');
    });

    it('should generate product deep link', () => {
      const url = handler.generateDeepLink('product', 'PROD123');

      expect(url).toBe('https://rez.app/product/PROD123');
    });

    it('should generate store deep link', () => {
      const url = handler.generateDeepLink('store', 'STORE456');

      expect(url).toBe('https://rez.app/store/STORE456');
    });

    it('should generate offer deep link', () => {
      const url = handler.generateDeepLink('offer', 'OFFER789');

      expect(url).toBe('https://rez.app/offer/OFFER789');
    });

    it('should return base URL for unknown type', () => {
      const url = handler.generateDeepLink('unknown' as any, 'ID123');

      expect(url).toBe('https://rez.app');
    });
  });

  describe('handleReferralLink', () => {
    it('should store referral code', async () => {
      const mockReferralHandler = require('@/utils/referralHandler');

      await handler.handleReferralLink('ABC123', 'direct');

      expect(mockReferralHandler.storeReferralCode).toHaveBeenCalledWith(
        'ABC123',
        'direct'
      );
    });

    it('should use default source value', async () => {
      const mockReferralHandler = require('@/utils/referralHandler');

      await handler.handleReferralLink('ABC123');

      expect(mockReferralHandler.storeReferralCode).toHaveBeenCalledWith(
        'ABC123',
        'direct'
      );
    });
  });

  describe('getPendingReferralCode', () => {
    it('should retrieve pending referral code', async () => {
      const mockReferralHandler = require('@/utils/referralHandler');
      const mockData = {
        code: 'ABC123',
        source: 'email',
        timestamp: new Date().toISOString(),
      };

      mockReferralHandler.getStoredReferralCode.mockResolvedValueOnce(mockData);

      const result = await handler.getPendingReferralCode();

      expect(result?.code).toBe('ABC123');
      expect(result?.source).toBe('email');
      expect(result?.timestamp).toBeDefined();
    });

    it('should return null if no pending code', async () => {
      const mockReferralHandler = require('@/utils/referralHandler');
      mockReferralHandler.getStoredReferralCode.mockResolvedValueOnce(null);

      const result = await handler.getPendingReferralCode();

      expect(result).toBeNull();
    });
  });

  describe('clearPendingReferralCode', () => {
    it('should clear pending referral code', async () => {
      const mockReferralHandler = require('@/utils/referralHandler');

      await handler.clearPendingReferralCode();

      expect(mockReferralHandler.clearReferralCode).toHaveBeenCalled();
    });
  });

  describe('trackAttribution', () => {
    it('should track attribution data', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      await handler.trackAttribution('referral', { code: 'ABC123' });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@rez_attribution',
        expect.any(String)
      );
    });

    it('should include timestamp in attribution', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      await handler.trackAttribution('product', { productId: 'PROD123' });

      const callArgs = AsyncStorage.setItem.mock.calls[0];
      const storedData = JSON.parse(callArgs[1]);

      expect(storedData).toHaveProperty('timestamp');
      expect(storedData.type).toBe('product');
      expect(storedData.data.productId).toBe('PROD123');
    });
  });

  describe('edge cases', () => {
    it('should handle URLs with multiple slashes', () => {
      const url = 'https://rez.app///invite///ABC123';
      const result = handler.parseDeepLink(url);

      // parseDeepLink uses Linking.parse which returns hostname/path, so multiple
      // slashes won't match the hostname 'invite' pattern. Returns 'unknown'.
      expect(result.type).toBe('unknown');
    });

    it('should handle URLs with fragment identifiers', () => {
      const url = 'https://rez.app/invite/ABC123#section';
      const result = handler.parseDeepLink(url);

      // Fragment is stripped by the mock and sanitizeReferralCode, leaving clean path.
      // The referral code 'ABC123' passes validation, so returns 'referral'.
      expect(result.type).toBe('referral');
    });

    it('should handle relative URLs', () => {
      const url = '/invite/ABC123';
      const result = handler.parseDeepLink(url);

      // Relative URLs lack a proper scheme/hostname, so Linking.parse returns
      // empty/malformed data, resulting in 'unknown' type.
      expect(result.type).toBe('unknown');
    });

    it('should handle deep link without scheme', () => {
      const url = 'rez.app/product/PROD123';
      const result = handler.parseDeepLink(url);

      // Without scheme, Linking.parse fails to extract hostname/path correctly,
      // resulting in 'unknown' type.
      expect(result.type).toBe('unknown');
    });
  });
});

// @ts-nocheck
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReferralHandler from './referralHandler';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';

// Module-level de-duplication: Linking.getInitialURL() and the 'url' event
// listener can both fire for the same URL during app cold-start, causing the
// handler to process the same deep link twice. Tracking processed URLs at the
// module scope ensures each URL is handled exactly once across both code paths.
const handledUrls = new Set<string>();

// SECURITY FIX: Define proper types for deep link data structures instead of using `any`
interface ReferralData {
  code: string;
  source: string;
}

interface ProductData {
  productId: string;
}

interface StoreData {
  storeId: string;
}

interface OfferData {
  offerId: string;
}

interface WalletData {
  subpath: string | null;
  url: string;
}

interface TransactionData {
  orderNumber: string | null;
  url: string;
}

interface UnknownData {
  url: string;
}

type DeepLinkPayload = ReferralData | ProductData | StoreData | OfferData | WalletData | TransactionData | UnknownData;

interface DeepLinkData {
  type: 'referral' | 'product' | 'store' | 'offer' | 'wallet' | 'transaction' | 'unknown';
  data: DeepLinkPayload;
}

// Allowlist validators — prevent path traversal and injection via crafted deep links
const MONGO_ID_RE = /^[a-f0-9]{24}$/i;
const REFERRAL_CODE_RE = /^[A-Z0-9]{4,20}$/;

function sanitizeMongoId(value: string | undefined): string | null {
  if (!value) return null;
  const clean = value.split('?')[0].split('#')[0].trim();
  return MONGO_ID_RE.test(clean) ? clean : null;
}

function sanitizeReferralCode(value: string | undefined): string | null {
  if (!value) return null;
  const clean = value.split('?')[0].split('#')[0].trim().toUpperCase();
  return REFERRAL_CODE_RE.test(clean) ? clean : null;
}

export class DeepLinkHandler {
  /**
   * Parse deep link URL
   * Supports both /ref/ and /invite/ patterns for referral links
   */
  parseDeepLink(url: string): DeepLinkData {
    try {
      const parsed = Linking.parse(url);
      const { hostname, path, queryParams } = parsed;

      // Handle referral links: /invite/ABC123 or /ref/ABC123
      if (hostname === 'invite' || hostname === 'ref' ||
          path?.includes('/invite/') || path?.includes('/ref/')) {
        const raw = path?.split(/\/(?:invite|ref)\//)[1] || hostname || undefined;
        const code = sanitizeReferralCode(raw);
        if (!code) return { type: 'unknown', data: { url } };
        return {
          type: 'referral',
          data: { code, source: queryParams?.source || 'direct' }
        };
      }

      // Handle product links: rezapp://product/123
      if (hostname === 'product' || path?.includes('/product/')) {
        const raw = path?.split('/product/')[1] || hostname || undefined;
        const productId = sanitizeMongoId(raw);
        if (!productId) return { type: 'unknown', data: { url } };
        return { type: 'product', data: { productId } };
      }

      // Handle store links: rezapp://store/456
      if (hostname === 'store' || path?.includes('/store/')) {
        const raw = path?.split('/store/')[1] || hostname || undefined;
        const storeId = sanitizeMongoId(raw);
        if (!storeId) return { type: 'unknown', data: { url } };
        return { type: 'store', data: { storeId } };
      }

      // Handle offer links: rezapp://offer/789
      if (hostname === 'offer' || path?.includes('/offer/')) {
        const raw = path?.split('/offer/')[1] || hostname || undefined;
        const offerId = sanitizeMongoId(raw);
        if (!offerId) return { type: 'unknown', data: { url } };
        return { type: 'offer', data: { offerId } };
      }

      // Handle wallet deep links: rezapp://wallet or rezapp://wallet/transactions
      if (hostname === 'wallet' || path?.startsWith('wallet')) {
        const subpath = path?.replace(/^wallet\/?/, '');
        return {
          type: 'wallet',
          data: { subpath: subpath || null, url }
        };
      }

      // Handle transaction deep links: rezapp://transaction/<orderNumber>
      // CA-SEC-FIX: Validate order number format to prevent injection attacks.
      // Order numbers follow pattern: ORD-XXXXXXXX (alphanumeric, 4-32 chars)
      if (hostname === 'transaction' || path?.startsWith('transaction/')) {
        const raw = path?.replace(/^transaction\//, '') || hostname || undefined;
        const cleaned = raw?.split('?')[0].split('#')[0].trim() || null;
        // Order number pattern: alphanumeric, dashes, 4-32 characters
        const ORDER_NUMBER_RE = /^[A-Za-z0-9_-]{4,32}$/;
        const orderNumber = cleaned && ORDER_NUMBER_RE.test(cleaned) ? cleaned : null;
        return { type: 'transaction', data: { orderNumber, url } };
      }

      return {
        type: 'unknown',
        data: { url }
      };
    } catch (error) {
      return {
        type: 'unknown',
        data: { url }
      };
    }
  }

  /**
   * Handle referral deep link — delegates to canonical ReferralHandler
   */
  async handleReferralLink(code: string, source: string = 'direct'): Promise<void> {
    await ReferralHandler.storeReferralCode(code, source);
  }

  /**
   * Get pending referral code — delegates to canonical ReferralHandler
   */
  async getPendingReferralCode(): Promise<{
    code: string;
    source: string;
    timestamp: number;
  } | null> {
    const data = await ReferralHandler.getStoredReferralCode();
    if (data) {
      return {
        code: data.code,
        source: data.source,
        timestamp: new Date(data.timestamp).getTime(),
      };
    }
    return null;
  }

  /**
   * Clear pending referral code — delegates to canonical ReferralHandler
   */
  async clearPendingReferralCode(): Promise<void> {
    await ReferralHandler.clearReferralCode();
  }

  /**
   * Generate deep link URL
   */
  generateDeepLink(type: 'referral' | 'product' | 'store' | 'offer' | 'wallet' | 'transaction', id?: string): string {
    const baseUrl = 'https://rez.app';

    switch (type) {
      case 'referral':
        return `${baseUrl}/invite/${id}`;
      case 'product':
        return `${baseUrl}/product/${id}`;
      case 'store':
        return `${baseUrl}/store/${id}`;
      case 'offer':
        return `${baseUrl}/offer/${id}`;
      case 'wallet':
        return id ? `${baseUrl}/wallet/${id}` : `${baseUrl}/wallet`;
      case 'transaction':
        return `${baseUrl}/transaction/${id}`;
      default:
        return baseUrl;
    }
  }

  /**
   * Track deep link attribution
   * SECURITY FIX: Added proper typing for attribution data
   */
  async trackAttribution(type: string, data: DeepLinkPayload): Promise<void> {
    try {
      // Store attribution data
      const attribution = {
        type,
        data,
        timestamp: Date.now()
      };

      await AsyncStorage.setItem(
        '@rez_attribution',
        JSON.stringify(attribution)
      );

      // M-5 FIX: Send deep-link attribution event to analytics service
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const analytics = require('@/services/analytics/AnalyticsService').default as {
          trackEvent: (name: string, props: object) => void;
        };
        analytics.trackEvent('deep_link_attribution', { type, ...data });
      } catch {
        // Analytics not available — attribution is stored locally
      }

    } catch (_error) {
      // silently handle
    }
  }
}

/**
 * React hook for handling deep links
 */
export function useDeepLinkHandler() {
  const [deepLink, setDeepLink] = useState<DeepLinkData | null>(null);
  const router = useRouter();
  const handler = new DeepLinkHandler();

  useEffect(() => {
    const processUrl = (url: string) => {
      // Skip URLs that have already been dispatched — prevents the getInitialURL
      // vs addEventListener race where both paths process the same cold-start URL.
      if (handledUrls.has(url)) return;
      handledUrls.add(url);
      const parsed = handler.parseDeepLink(url);
      setDeepLink(parsed);
      handleDeepLink(parsed);
    };

    // Handle initial URL (app opened from link)
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) processUrl(initialUrl);
    };

    // Handle URL when app is already open
    const subscription = Linking.addEventListener('url', ({ url }: { url: string }) => {
      processUrl(url);
    });

    handleInitialURL();

    return () => {
      subscription.remove();
      // Reset the de-dup set on unmount so a remount (e.g. after logout/login)
      // can re-process any pending deep links cleanly.
      handledUrls.clear();
    };
  }, []);

  const handleDeepLink = async (linkData: DeepLinkData) => {
    switch (linkData.type) {
      case 'referral': {
        const data = linkData.data as ReferralData;
        await handler.handleReferralLink(data.code, data.source);
        await handler.trackAttribution('referral', data);

        // Route to sign-in for logged-out users so they can sign up with the
        // referral code pre-filled. Logged-in users simply see a confirmation
        // toast — an in-app "apply referral" screen can be added later, but
        // dropping logged-in users onto an unrelated screen is worse than a
        // no-op notification.
        const authState = useAuthStore.getState().state;
        if (!authState.isAuthenticated) {
          router.push({ pathname: '/sign-in', params: { ref: data.code } } as unknown);
        } else {
          try {
            useToastStore.getState().showInfo('Referral code noted');
          } catch {
            // Toast store may not be initialised in some contexts — non-fatal.
          }
        }
        break;
      }

      case 'product': {
        const data = linkData.data as ProductData;
        await handler.trackAttribution('product', data);
        router.push(`/product-page?id=${data.productId}`);
        break;
      }

      case 'store': {
        const data = linkData.data as StoreData;
        await handler.trackAttribution('store', data);
        // REGRESSION FIX (2026-03-23): '/Store' does not exist as an Expo Router file-based route.
        // The actual file is app/MainStorePage.tsx which resolves to route '/MainStorePage'.
        // Using '/Store' caused a silent navigation failure — users tapping store deep links
        // were dropped to the not-found screen instead of the store page.
        router.push(`/MainStorePage?id=${data.storeId}`);
        break;
      }

      case 'offer': {
        const data = linkData.data as OfferData;
        await handler.trackAttribution('offer', data);
        router.push(`/offers?id=${data.offerId}`);
        break;
      }

      case 'wallet': {
        const data = linkData.data as WalletData;
        await handler.trackAttribution('wallet', data);
        // Subpath: /transactions → transaction history, otherwise → wallet overview
        if (data.subpath === 'transactions') {
          router.push('/wallet/transactions' as unknown);
        } else {
          router.push('/wallet' as unknown);
        }
        break;
      }

      case 'transaction': {
        const data = linkData.data as TransactionData;
        await handler.trackAttribution('transaction', data);
        if (data.orderNumber) {
          router.push(`/orders/${data.orderNumber}`);
        } else {
          router.push('/wallet');
        }
        break;
      }

      default: {
        // Unknown deep link type - silently ignore
        break;
      }
    }
  };

  return {
    deepLink,
    handler
  };
}

export default new DeepLinkHandler();

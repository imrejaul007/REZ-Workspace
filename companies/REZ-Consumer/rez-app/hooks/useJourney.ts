/**
 * Journey Service Hook
 * React hook for lifecycle automation and campaign tracking
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuthUser } from '@/stores/selectors';
import {
  journeyService,
  Campaign,
} from '@/services/journeyService';
import {
  attributionService,
  Channel,
} from '@/services/attributionService';

interface UseActiveCampaignsReturn {
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  trackInteraction: (
    campaignId: string,
    interaction: 'opened' | 'clicked' | 'converted'
  ) => void;
}

export function useActiveCampaigns(): UseActiveCampaignsReturn {
  const user = useAuthUser();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    if (!user?.id) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await journeyService.getActiveCampaigns(user.id);
      if (response.success && response.data) {
        setCampaigns(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const trackInteraction = useCallback(
    (
      campaignId: string,
      interaction: 'opened' | 'clicked' | 'converted'
    ) => {
      if (!user?.id) return;

      // Fire and forget
      journeyService.trackCampaignInteraction(campaignId, user.id, interaction);
    },
    [user?.id]
  );

  return {
    campaigns,
    loading,
    error,
    refresh: fetchCampaigns,
    trackInteraction,
  };
}

/**
 * Hook for lifecycle event tracking
 */
export function useJourneyTracking() {
  const user = useAuthUser();

  const trackSignup = useCallback(
    async (email: string, source?: string) => {
      if (!user?.id) return;
      await journeyService.triggerOnSignup(user.id, { email, source });
    },
    [user?.id]
  );

  const trackOrder = useCallback(
    async (orderId: string, total: number, items: string[], storeId: string) => {
      if (!user?.id) return;

      // Track first order
      await journeyService.triggerOnFirstOrder(user.id, { orderId, total, storeId });

      // Track order completed
      await journeyService.triggerOnOrderCompleted(user.id, {
        orderId,
        total,
        items,
        storeId,
      });
    },
    [user?.id]
  );

  const trackCartAbandoned = useCallback(
    async (cartId: string, items: string[], total: number) => {
      if (!user?.id) return;
      await journeyService.triggerOnCartAbandoned(user.id, {
        cartId,
        items,
        total,
      });
    },
    [user?.id]
  );

  const trackRefund = useCallback(
    async (orderId: string, reason: string, amount: number) => {
      if (!user?.id) return;
      await journeyService.triggerOnRefundRequested(user.id, { orderId, reason, amount });
    },
    [user?.id]
  );

  const trackPaymentFailed = useCallback(
    async (orderId: string, reason: string, amount: number) => {
      if (!user?.id) return;
      await journeyService.triggerOnPaymentFailed(user.id, { orderId, reason, amount });
    },
    [user?.id]
  );

  return {
    trackSignup,
    trackOrder,
    trackCartAbandoned,
    trackRefund,
    trackPaymentFailed,
  };
}

/**
 * Hook for attribution tracking
 */
export function useAttributionTracking() {
  const user = useAuthUser();

  const trackEvent = useCallback(
    async (
      type: 'impression' | 'click' | 'conversion',
      channel: Channel,
      data?: {
        campaignId?: string;
        adId?: string;
        medium?: string;
        source?: string;
      }
    ) => {
      const userId = user?.id || '';
      const sessionId = getSessionId(); // Implement session ID generation

      await attributionService.trackEvent({
        userId,
        sessionId,
        type,
        channel,
        campaign: data?.campaignId,
        source: data?.source,
        medium: data?.medium,
        adId: data?.adId,
      });
    },
    [user?.id]
  );

  const trackConversion = useCallback(
    async (
      type: 'purchase' | 'signup' | 'add_to_cart' | 'booking',
      value: number,
      channel: Channel,
      orderId?: string
    ) => {
      if (!user?.id) return;

      await attributionService.trackConversion({
        userId: user.id,
        type,
        value,
        orderId,
        channel,
        conversionTime: new Date().toISOString(),
      });
    },
    [user?.id]
  );

  const trackDeeplink = useCallback(
    async (deeplink: string, sessionId?: string) => {
      await attributionService.trackDeeplink(
        deeplink,
        user?.id,
        sessionId || getSessionId()
      );
    },
    [user?.id]
  );

  const trackQRScan = useCallback(
    async (
      shortcode: string,
      location?: { latitude: number; longitude: number }
    ) => {
      await attributionService.trackQRScan({
        shortcode,
        userId: user?.id,
        sessionId: getSessionId(),
        location,
      });
    },
    [user?.id]
  );

  return {
    trackEvent,
    trackConversion,
    trackDeeplink,
    trackQRScan,
  };
}

// Simple session ID generator
let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  return sessionId;
}

export function resetSessionId(): void {
  sessionId = null;
}

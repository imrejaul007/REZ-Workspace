'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { logger } from '@/lib/utils/logger';
import { track as captureIntent } from '@/lib/services/intentCaptureService';

// ── Event types ───────────────────────────────────────────────────────────────

export type AnalyticsEvent =
  | 'store_viewed'
  | 'menu_item_viewed'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'cart_viewed'
  | 'checkout_started'
  | 'payment_initiated'
  | 'order_placed'
  | 'order_completed'
  | 'coupon_applied'
  | 'login_started'
  | 'login_completed'
  | 'scan_pay_initiated'
  | 'scan_pay_completed'
  | 'reorder_usual'
  | 'reorder_all_usual'
  | 'qr_downloaded'
  | 'qr_link_copied'
  | 'qr_shared'
  | 'social_link_clicked'
  | 'whatsapp_clicked'
  | 'call_clicked'
  | 'directions_clicked'
  | 'share_profile'
  | 'view_menu'
  | 'view_catalog'
  | 'view_services'
  | 'link_clicked'
  | 'profile_action_clicked';

export interface TrackParams {
  event: AnalyticsEvent;
  storeSlug?: string;
  userId?: string;
  properties?: Record<string, unknown>;
}

// ── Core fire-and-forget POST ─────────────────────────────────────────────────

/**
 * Fires an analytics event to the rez-analytics-events service.
 * Never throws — analytics must never break UX.
 * If NEXT_PUBLIC_ANALYTICS_URL is unset, logs to console in development only.
 *
 * Also triggers ReZ Mind intent capture (non-blocking) for commerce memory.
 */
export function track(params: TrackParams): void {
  const analyticsUrl = process.env.NEXT_PUBLIC_ANALYTICS_URL;

  if (!analyticsUrl) {
    // NW-MED-031: Replace console.debug with logger for centralized logging control.
    logger.debug('[analytics]', { event: params.event, params });
    return;
  }

  // NW-MED-037 + NW-MED-045: Strip PII from analytics payload. User phone is derived
  // from auth state in useTrack() but explicitly excluded from the event payload.
  const payload = {
    event: params.event,
    storeSlug: params.storeSlug,
    userId: params.userId,
    timestamp: new Date().toISOString(),
    source: 'rez-now',
    // Do NOT include phone, contact, or other PII in analytics events
    properties: params.properties ?? {},
  };

  // Fire-and-forget — intentionally not awaited
  fetch(`${analyticsUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true, // ensures request completes even if page unloads
  }).catch((error) => {
    // Analytics errors are non-critical, but log for debugging
    logger.warn('[analytics] Failed to send event', { error: error instanceof Error ? error.message : String(error) });
  });

  // ReZ Mind: Capture intent for commerce memory (non-blocking)
  if (params.userId && params.storeSlug) {
    captureIntent({
      userId: params.userId,
      appType: 'restaurant',
      event: params.event,
      intentKey: `restaurant_${params.event}_${params.storeSlug}`,
      metadata: params.properties,
    });
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * React hook that returns a track function with userId auto-filled from authStore.
 * Callers omit userId — it is resolved from the auth state at call time.
 */
export function useTrack(): (params: Omit<TrackParams, 'userId'>) => void {
  const user = useAuthStore((s) => s.user);

  return (params: Omit<TrackParams, 'userId'>) => {
    track({ ...params, userId: user?.id });
  };
}

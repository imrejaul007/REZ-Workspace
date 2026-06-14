// ── Analytics API ──────────────────────────────────────────────────────────────
// Centralized analytics tracking for link clicks, QR scans, and store views.

import { logger } from '@/lib/utils/logger';

// ── Types ──────────────────────────────────────────────────────────────────────

export type AnalyticsEventType =
  | 'link_clicked'
  | 'qr_scanned'
  | 'qr_downloaded'
  | 'qr_link_copied'
  | 'qr_shared'
  | 'social_link_clicked'
  | 'whatsapp_clicked'
  | 'profile_action_clicked'
  | 'store_viewed'
  | 'menu_item_viewed'
  | 'add_to_cart'
  | 'checkout_started'
  | 'order_placed'
  | 'reorder_usual';

export interface LinkClickEvent {
  type: 'link_clicked';
  storeSlug: string;
  linkId: string;
  linkType: string;
  linkLabel: string;
  timestamp: string;
  source?: 'qr' | 'direct' | 'social';
}

export interface QRScanEvent {
  type: 'qr_scanned';
  storeSlug: string;
  timestamp: string;
  userAgent?: string;
  referrer?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface QRDownloadEvent {
  type: 'qr_downloaded';
  storeSlug: string;
  format: 'png' | 'svg' | 'pdf';
  timestamp: string;
}

export interface StoreViewEvent {
  type: 'store_viewed';
  storeSlug: string;
  timestamp: string;
  source?: 'qr' | 'search' | 'direct' | 'social';
}

export type AnalyticsEvent =
  | LinkClickEvent
  | QRScanEvent
  | QRDownloadEvent
  | StoreViewEvent;

// ── Analytics Data ─────────────────────────────────────────────────────────────

export interface LinkClickData {
  linkId: string;
  linkLabel: string;
  linkType: string;
  clickCount: number;
  uniqueUsers: number;
  lastClicked: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface StoreAnalytics {
  storeSlug: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalViews: number;
    totalLinkClicks: number;
    totalQRCScans: number;
    totalDownloads: number;
    uniqueVisitors: number;
  };
  linkClicks: LinkClickData[];
  viewsOverTime: TimeSeriesData[];
  clicksOverTime: TimeSeriesData[];
  topReferrers: Array<{ source: string; count: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  locationBreakdown: Array<{ city?: string; country?: string; count: number }>;
}

// ── Analytics Service ───────────────────────────────────────────────────────────

const ANALYTICS_API_URL = process.env.NEXT_PUBLIC_ANALYTICS_URL || 'https://analytics.rez.money';

/**
 * Track an analytics event.
 * Events are batched and sent to the analytics service.
 * Never throws - analytics must never break UX.
 */
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  try {
    const response = await fetch(`${ANALYTICS_API_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        source: 'rez-now',
        timestamp: new Date().toISOString(),
      }),
      keepalive: true,
    });

    if (!response.ok) {
      logger.warn('[analytics] Event tracking failed', { status: response.status, event });
    }
  } catch (error) {
    // Silently fail - analytics must never break UX
    logger.debug('[analytics] Event tracking error', { error, event });
  }
}

/**
 * Track a link click with full details.
 */
export async function trackLinkClick(params: {
  storeSlug: string;
  linkId: string;
  linkType: string;
  linkLabel: string;
  source?: 'qr' | 'direct' | 'social';
}): Promise<void> {
  await trackEvent({
    type: 'link_clicked',
    ...params,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track a QR code scan.
 */
export async function trackQRScan(params: {
  storeSlug: string;
  userAgent?: string;
  referrer?: string;
  location?: { latitude?: number; longitude?: number };
}): Promise<void> {
  await trackEvent({
    type: 'qr_scanned',
    storeSlug: params.storeSlug,
    timestamp: new Date().toISOString(),
    userAgent: params.userAgent,
    referrer: params.referrer,
    location: params.location,
  });
}

/**
 * Track a QR download.
 */
export async function trackQRDownload(params: {
  storeSlug: string;
  format: 'png' | 'svg' | 'pdf';
}): Promise<void> {
  await trackEvent({
    type: 'qr_downloaded',
    storeSlug: params.storeSlug,
    format: params.format,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track a store view.
 */
export async function trackStoreView(params: {
  storeSlug: string;
  source?: 'qr' | 'search' | 'direct' | 'social';
}): Promise<void> {
  await trackEvent({
    type: 'store_viewed',
    storeSlug: params.storeSlug,
    timestamp: new Date().toISOString(),
    source: params.source,
  });
}

// ── Analytics Fetching ─────────────────────────────────────────────────────────

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '365d';

function getPeriodDates(period: AnalyticsPeriod): { start: string; end: string } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case '365d':
      start.setFullYear(start.getFullYear() - 1);
      break;
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * Fetch analytics for a store.
 */
export async function getStoreAnalytics(
  storeSlug: string,
  period: AnalyticsPeriod = '30d'
): Promise<StoreAnalytics | null> {
  try {
    const { start, end } = getPeriodDates(period);
    const response = await fetch(
      `${ANALYTICS_API_URL}/api/stores/${storeSlug}/analytics?start=${start}&end=${end}`,
      {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Analytics fetch failed: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    logger.error('[analytics] Failed to fetch store analytics', { error, storeSlug });
    return null;
  }
}

/**
 * Fetch link click analytics for a specific link.
 */
export async function getLinkAnalytics(
  storeSlug: string,
  linkId: string,
  period: AnalyticsPeriod = '30d'
): Promise<LinkClickData | null> {
  try {
    const { start, end } = getPeriodDates(period);
    const response = await fetch(
      `${ANALYTICS_API_URL}/api/stores/${storeSlug}/links/${linkId}/analytics?start=${start}&end=${end}`,
      {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Link analytics fetch failed: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    logger.error('[analytics] Failed to fetch link analytics', { error, storeSlug, linkId });
    return null;
  }
}

/**
 * Fetch popular links for a store.
 */
export async function getPopularLinks(
  storeSlug: string,
  limit: number = 10,
  period: AnalyticsPeriod = '30d'
): Promise<LinkClickData[]> {
  try {
    const { start, end } = getPeriodDates(period);
    const response = await fetch(
      `${ANALYTICS_API_URL}/api/stores/${storeSlug}/links/popular?start=${start}&end=${end}&limit=${limit}`,
      {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      throw new Error(`Popular links fetch failed: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    logger.error('[analytics] Failed to fetch popular links', { error, storeSlug });
    return [];
  }
}

/**
 * Fetch time-series data for views and clicks.
 */
export async function getTimeSeriesData(
  storeSlug: string,
  metric: 'views' | 'clicks' | 'scans',
  period: AnalyticsPeriod = '30d'
): Promise<TimeSeriesData[]> {
  try {
    const { start, end } = getPeriodDates(period);
    const response = await fetch(
      `${ANALYTICS_API_URL}/api/stores/${storeSlug}/timeseries?metric=${metric}&start=${start}&end=${end}`,
      {
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      throw new Error(`Time series fetch failed: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    logger.error('[analytics] Failed to fetch time series data', { error, storeSlug, metric });
    return [];
  }
}

// ── Analytics Summary ───────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  totalViews: number;
  totalLinkClicks: number;
  totalQRCScans: number;
  totalDownloads: number;
  viewsChange: number; // Percentage change from previous period
  clicksChange: number;
  scansChange: number;
}

/**
 * Get a quick summary of store analytics.
 */
export async function getAnalyticsSummary(
  storeSlug: string,
  period: AnalyticsPeriod = '30d'
): Promise<AnalyticsSummary> {
  const analytics = await getStoreAnalytics(storeSlug, period);

  if (!analytics) {
    return {
      totalViews: 0,
      totalLinkClicks: 0,
      totalQRCScans: 0,
      totalDownloads: 0,
      viewsChange: 0,
      clicksChange: 0,
      scansChange: 0,
    };
  }

  return {
    totalViews: analytics.summary.totalViews,
    totalLinkClicks: analytics.summary.totalLinkClicks,
    totalQRCScans: analytics.summary.totalQRCScans,
    totalDownloads: analytics.summary.totalDownloads,
    viewsChange: calculateChange(analytics.summary.totalViews, analytics.viewsOverTime),
    clicksChange: calculateChange(analytics.summary.totalLinkClicks, analytics.clicksOverTime),
    scansChange: 0, // Would need previous period data
  };
}

function calculateChange(current: number, timeSeries: TimeSeriesData[]): number {
  if (timeSeries.length < 2) return 0;

  const midpoint = Math.floor(timeSeries.length / 2);
  const firstHalf = timeSeries.slice(0, midpoint).reduce((sum, d) => sum + d.value, 0);
  const secondHalf = timeSeries.slice(midpoint).reduce((sum, d) => sum + d.value, 0);

  if (firstHalf === 0) return 0;
  return ((secondHalf - firstHalf) / firstHalf) * 100;
}

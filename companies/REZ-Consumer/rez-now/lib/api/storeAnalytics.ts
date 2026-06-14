/**
 * Store Analytics API client for tracking events and fetching dashboard data.
 *
 * Endpoints:
 * POST   /store-analytics/:storeId/event      - Record an analytics event
 * GET    /store-analytics/:storeId/dashboard  - Get analytics dashboard data
 * GET    /store-analytics/:storeId/timeline   - Get timeline data
 */

import { authClient } from './client';
import { logger } from '@/lib/utils/logger';

// ── Types ──────────────────────────────────────────────────────────────────────

export type StoreEventType = 'link_click' | 'qr_scan' | 'page_view' | 'download';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface StoreEventRequest {
  eventType: StoreEventType;
  eventData?: Record<string, unknown>;
  timestamp?: string;
  linkId?: string;
}

export interface TopLink {
  linkId: string;
  clicks: number;
}

export interface DeviceBreakdown {
  mobile: number;
  tablet: number;
  desktop: number;
  [key: string]: number;
}

export interface StoreAnalyticsDashboard {
  totalViews: number;
  totalClicks: number;
  totalScans: number;
  topLinks: TopLink[];
  deviceBreakdown: DeviceBreakdown;
}

export interface TimelineEntry {
  date: string;
  views: number;
  clicks: number;
  scans: number;
}

export interface TimelineParams {
  days?: number;
  eventType?: StoreEventType;
}

// ── API Functions ───────────────────────────────────────────────────────────────

/**
 * Record an analytics event.
 */
export async function recordStoreEvent(
  storeId: string,
  event: StoreEventRequest
): Promise<string | null> {
  try {
    const { data } = await authClient.post(`/store-analytics/${storeId}/event`, event);
    if (!data.success) throw new Error(data.message || 'Failed to record event');
    return data.data?.eventId as string;
  } catch (error) {
    logger.error('[storeAnalytics] Failed to record event:', { error });
    return null;
  }
}

/**
 * Get analytics dashboard data.
 */
export async function getStoreAnalyticsDashboard(
  storeId: string
): Promise<StoreAnalyticsDashboard | null> {
  try {
    const { data } = await authClient.get(`/store-analytics/${storeId}/dashboard`);
    if (!data.success) throw new Error(data.message || 'Failed to fetch dashboard');
    return data.data as StoreAnalyticsDashboard;
  } catch (error) {
    logger.error('[storeAnalytics] Failed to fetch dashboard:', { error });
    return null;
  }
}

/**
 * Get timeline data.
 */
export async function getStoreTimeline(
  storeId: string,
  params?: TimelineParams
): Promise<TimelineEntry[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.days) queryParams.set('days', String(params.days));
    if (params?.eventType) queryParams.set('eventType', params.eventType);

    const { data } = await authClient.get(
      `/store-analytics/${storeId}/timeline?${queryParams}`
    );
    if (!data.success) throw new Error(data.message || 'Failed to fetch timeline');
    return data.data as TimelineEntry[];
  } catch (error) {
    logger.error('[storeAnalytics] Failed to fetch timeline:', { error });
    return [];
  }
}

// ── Convenience Functions ─────────────────────────────────────────────────────

/**
 * Track a page view.
 */
export async function trackPageView(
  storeId: string,
  eventData?: Record<string, unknown>
): Promise<void> {
  await recordStoreEvent(storeId, {
    eventType: 'page_view',
    eventData,
  });
}

/**
 * Track a link click.
 */
export async function trackStoreLinkClick(
  storeId: string,
  linkId: string,
  eventData?: Record<string, unknown>
): Promise<void> {
  await recordStoreEvent(storeId, {
    eventType: 'link_click',
    linkId,
    eventData,
  });
}

/**
 * Track a QR scan.
 */
export async function trackQRCodeScan(
  storeId: string,
  eventData?: Record<string, unknown>
): Promise<void> {
  await recordStoreEvent(storeId, {
    eventType: 'qr_scan',
    eventData,
  });
}

/**
 * Track a download.
 */
export async function trackDownload(
  storeId: string,
  eventData?: Record<string, unknown>
): Promise<void> {
  await recordStoreEvent(storeId, {
    eventType: 'download',
    eventData,
  });
}

// ── Utility Functions ─────────────────────────────────────────────────────────

/**
 * Detect device type from user agent.
 */
export function detectDeviceType(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod/i.test(ua)) return 'mobile';
  return 'desktop';
}

/**
 * Calculate percentage change between two values.
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Format large numbers for display.
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return String(num);
}

/**
 * Get device icon name.
 */
export function getDeviceIcon(device: DeviceType): string {
  const icons: Record<DeviceType, string> = {
    mobile: 'smartphone',
    tablet: 'tablet',
    desktop: 'monitor',
  };
  return icons[device];
}

/**
 * Get event type label.
 */
export function getEventTypeLabel(eventType: StoreEventType): string {
  const labels: Record<StoreEventType, string> = {
    link_click: 'Link Click',
    qr_scan: 'QR Scan',
    page_view: 'Page View',
    download: 'Download',
  };
  return labels[eventType];
}

/**
 * Aggregate timeline data by period.
 */
export function aggregateTimelineByPeriod(
  timeline: TimelineEntry[],
  period: 'day' | 'week' | 'month'
): TimelineEntry[] {
  if (period === 'day') return timeline;

  const grouped: Record<string, TimelineEntry> = {};

  for (const entry of timeline) {
    const date = new Date(entry.date);
    let key: string;

    if (period === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!grouped[key]) {
      grouped[key] = { date: key, views: 0, clicks: 0, scans: 0 };
    }
    grouped[key].views += entry.views;
    grouped[key].clicks += entry.clicks;
    grouped[key].scans += entry.scans;
  }

  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
}

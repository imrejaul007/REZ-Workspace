/**
 * Offline Ads Service
 *
 * API functions for managing offline advertisements:
 * - Rickshaw, bus, hoarding, billboard ads
 * - QR code generation
 * - Scan tracking and analytics
 * - Location management
 */

import { apiClient } from './api/client';
import type { ApiResponse } from '@/types/api';

// ============================================
// Type Definitions
// ============================================

export type AdType = 'rickshaw' | 'bus' | 'hoarding' | 'billboard';
export type AdStatus = 'active' | 'paused' | 'completed' | 'draft';

export interface OfflineAd {
  id: string;
  _id?: string;
  merchantId: string;
  title: string;
  description?: string;
  type: AdType;
  status: AdStatus;
  locations: string[];
  startDate: string;
  endDate: string;
  budget?: number;
  attachedOffer?: string;
  terms?: string;
  scanCount: number;
  viewCount: number;
  qrCodes?: Record<string, string>;
  scanHistory?: ScanEvent[];
  analytics?: AdAnalytics;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScanEvent {
  id: string;
  adId: string;
  location: string;
  timestamp: string;
  deviceInfo?: {
    os?: string;
    browser?: string;
    deviceType?: string;
  };
  userId?: string;
  userAgent?: string;
}

export interface AdAnalytics {
  totalScans: number;
  totalViews: number;
  scanRate: number;
  topLocations: Array<{
    location: string;
    scanCount: number;
  }>;
  dailyScans: Array<{
    date: string;
    count: number;
  }>;
  deviceBreakdown: Record<string, number>;
}

export interface OfflineAdPayload {
  title: string;
  description?: string;
  type: AdType;
  locations: string[];
  startDate: string;
  endDate: string;
  budget?: number;
  attachedOffer?: string;
  terms?: string;
}

export interface OfflineAdFilters {
  type?: AdType;
  status?: AdStatus;
  startDate?: string;
  endDate?: string;
}

export interface OfflineAdStats {
  totalAds: number;
  activeAds: number;
  totalScans: number;
  totalViews: number;
  avgScanRate: number;
  topPerformingAds: OfflineAd[];
}

// ============================================
// API Functions
// ============================================

/**
 * Get all offline ads for a merchant
 */
export async function getOfflineAds(
  merchantId: string,
  filters?: OfflineAdFilters
): Promise<ApiResponse<OfflineAd[]>> {
  try {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const url = queryString ? `/offline-ads/${merchantId}?${queryString}` : `/offline-ads/${merchantId}`;

    const response = await apiClient.get<OfflineAd[]>(url);
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    // Return mock data for development if API is not available
    if (__DEV__) {
      return {
        success: true,
        data: getMockOfflineAds(merchantId),
        statusCode: 200,
      };
    }
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch offline ads',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Get a single offline ad by ID
 */
export async function getOfflineAd(
  merchantId: string,
  adId: string
): Promise<ApiResponse<OfflineAd>> {
  try {
    const response = await apiClient.get<OfflineAd>(`/offline-ads/${merchantId}/${adId}`);
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    // Return mock data for development
    if (__DEV__) {
      const mockAds = getMockOfflineAds(merchantId);
      const ad = mockAds.find((a) => a.id === adId || a._id === adId);
      if (ad) {
        return {
          success: true,
          data: ad,
          statusCode: 200,
        };
      }
    }
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch offline ad',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Create a new offline ad
 */
export async function createOfflineAd(
  merchantId: string,
  payload: OfflineAdPayload
): Promise<ApiResponse<OfflineAd>> {
  try {
    const response = await apiClient.post<OfflineAd>(`/offline-ads`, {
      ...payload,
      merchantId,
    });
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    // Return mock data for development
    if (__DEV__) {
      const newAd: OfflineAd = {
        id: `ad_${Date.now()}`,
        merchantId,
        title: payload.title,
        description: payload.description,
        type: payload.type,
        status: 'draft',
        locations: payload.locations,
        startDate: payload.startDate,
        endDate: payload.endDate,
        budget: payload.budget,
        attachedOffer: payload.attachedOffer,
        terms: payload.terms,
        scanCount: 0,
        viewCount: 0,
        scanHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        success: true,
        data: newAd,
        statusCode: 201,
      };
    }
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to create offline ad',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Update an existing offline ad
 */
export async function updateOfflineAd(
  merchantId: string,
  adId: string,
  payload: Partial<OfflineAdPayload & { status: AdStatus }>
): Promise<ApiResponse<OfflineAd>> {
  try {
    const response = await apiClient.patch<OfflineAd>(
      `/offline-ads/${merchantId}/${adId}`,
      payload
    );
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    // Return mock data for development
    if (__DEV__) {
      const mockAds = getMockOfflineAds(merchantId);
      const ad = mockAds.find((a) => a.id === adId || a._id === adId);
      if (ad) {
        return {
          success: true,
          data: { ...ad, ...payload, updatedAt: new Date().toISOString() },
          statusCode: 200,
        };
      }
    }
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to update offline ad',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Delete an offline ad
 */
export async function deleteOfflineAd(
  merchantId: string,
  adId: string
): Promise<ApiResponse<void>> {
  try {
    await apiClient.delete(`/offline-ads/${merchantId}/${adId}`);
    return {
      success: true,
      statusCode: 200,
    };
  } catch (error) {
    // Return success for development
    if (__DEV__) {
      return {
        success: true,
        statusCode: 200,
      };
    }
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to delete offline ad',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Get offline ad analytics
 */
export async function getOfflineAdAnalytics(
  merchantId: string,
  adId: string,
  dateRange?: { start: string; end: string }
): Promise<ApiResponse<AdAnalytics>> {
  try {
    const params = new URLSearchParams();
    if (dateRange?.start) params.append('startDate', dateRange.start);
    if (dateRange?.end) params.append('endDate', dateRange.end);

    const queryString = params.toString();
    const url = queryString
      ? `/offline-ads/${merchantId}/${adId}/analytics?${queryString}`
      : `/offline-ads/${merchantId}/${adId}/analytics`;

    const response = await apiClient.get<AdAnalytics>(url);
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.message || error.message || 'Failed to fetch offline ad analytics',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Get QR code data for a specific location
 */
export async function getQRCodeData(
  merchantId: string,
  adId: string,
  location: string
): Promise<ApiResponse<{ qrData: string; qrUrl: string }>> {
  try {
    const response = await apiClient.get<{ qrData: string; qrUrl: string }>(
      `/offline-ads/${merchantId}/${adId}/qr/${encodeURIComponent(location)}`
    );
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    // Generate mock QR data for development
    if (__DEV__) {
      return {
        success: true,
        data: {
          qrData: JSON.stringify({
            adId,
            location,
            merchantId,
            action: 'offline_ad_scan',
          }),
          qrUrl: `https://rez.money/scan?ad=${adId}&loc=${encodeURIComponent(location)}`,
        },
        statusCode: 200,
      };
    }
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get QR code data',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Get offline ads statistics
 */
export async function getOfflineAdStats(
  merchantId: string
): Promise<ApiResponse<OfflineAdStats>> {
  try {
    const response = await apiClient.get<OfflineAdStats>(`/offline-ads/${merchantId}/stats`);
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    // Calculate mock stats for development
    if (__DEV__) {
      const mockAds = getMockOfflineAds(merchantId);
      const stats: OfflineAdStats = {
        totalAds: mockAds.length,
        activeAds: mockAds.filter((a) => a.status === 'active').length,
        totalScans: mockAds.reduce((sum, a) => sum + a.scanCount, 0),
        totalViews: mockAds.reduce((sum, a) => sum + a.viewCount, 0),
        avgScanRate:
          mockAds.length > 0
            ? mockAds.reduce((sum, a) => sum + (a.viewCount > 0 ? a.scanCount / a.viewCount : 0), 0) /
              mockAds.length *
              100
            : 0,
        topPerformingAds: mockAds
          .sort((a, b) => b.scanCount - a.scanCount)
          .slice(0, 5),
      };
      return {
        success: true,
        data: stats,
        statusCode: 200,
      };
    }
    return {
      success: false,
      error:
        error.response?.data?.message || error.message || 'Failed to fetch offline ad stats',
      statusCode: error.response?.status,
    };
  }
}

/**
 * Track a scan event
 */
export async function trackScan(
  adId: string,
  location: string,
  deviceInfo?: ScanEvent['deviceInfo']
): Promise<ApiResponse<ScanEvent>> {
  try {
    const response = await apiClient.post<ScanEvent>(`/offline-ads/scan`, {
      adId,
      location,
      deviceInfo,
    });
    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to track scan',
      statusCode: error.response?.status,
    };
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Format ad type for display
 */
export function formatAdType(type: AdType): string {
  const labels: Record<AdType, string> = {
    rickshaw: 'Rickshaw',
    bus: 'Bus',
    hoarding: 'Hoarding',
    billboard: 'Billboard',
  };
  return labels[type] || type;
}

/**
 * Format status for display
 */
export function formatStatus(status: AdStatus): string {
  const labels: Record<AdStatus, string> = {
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    draft: 'Draft',
  };
  return labels[status] || status;
}

/**
 * Get status color
 */
export function getStatusColor(status: AdStatus): { bg: string; text: string } {
  const colors: Record<AdStatus, { bg: string; text: string }> = {
    active: { bg: '#d1fae5', text: '#059669' },
    paused: { bg: '#fef3c7', text: '#d97706' },
    completed: { bg: '#dbeafe', text: '#1d4ed8' },
    draft: { bg: '#f3f4f6', text: '#6b7280' },
  };
  return colors[status] || colors.draft;
}

/**
 * Calculate scan rate
 */
export function calculateScanRate(scans: number, views: number): number {
  if (views === 0) return 0;
  return (scans / views) * 100;
}

// ============================================
// Mock Data for Development
// ============================================

function getMockOfflineAds(merchantId: string): OfflineAd[] {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  return [
    {
      id: 'ad_001',
      merchantId,
      title: 'Summer Sale 2026 - 50% Off',
      description: 'Biggest summer sale across all outlets. Get flat 50% off on all items.',
      type: 'rickshaw',
      status: 'active',
      locations: ['Connaught Place, Delhi', 'Bandra West, Mumbai', 'MG Road, Bangalore'],
      startDate: thirtyDaysAgo.toISOString(),
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      budget: 15000,
      attachedOffer: '50% off on orders above ₹500',
      scanCount: 1247,
      viewCount: 15230,
      scanHistory: [
        {
          id: 'scan_001',
          adId: 'ad_001',
          location: 'Connaught Place, Delhi',
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          deviceInfo: { os: 'Android', deviceType: 'mobile' },
        },
        {
          id: 'scan_002',
          adId: 'ad_001',
          location: 'Bandra West, Mumbai',
          timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
          deviceInfo: { os: 'iOS', deviceType: 'mobile' },
        },
      ],
      createdAt: thirtyDaysAgo.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'ad_002',
      merchantId,
      title: 'New Branch Opening - Kolkata',
      description: 'Grand opening of our new outlet in Kolkata. Freebies for first 100 customers!',
      type: 'bus',
      status: 'active',
      locations: ['Kolkata Park Street', 'Howrah Station'],
      startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000).toISOString(),
      budget: 25000,
      attachedOffer: 'Free dessert on first order',
      scanCount: 456,
      viewCount: 8940,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'ad_003',
      merchantId,
      title: 'Monsoon Special Menu',
      type: 'hoarding',
      status: 'paused',
      locations: ['SG Highway, Ahmedabad', 'MI Road, Jaipur'],
      startDate: sixtyDaysAgo.toISOString(),
      endDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      budget: 40000,
      attachedOffer: '20% off on hot soups',
      scanCount: 2134,
      viewCount: 45000,
      createdAt: sixtyDaysAgo.toISOString(),
      updatedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'ad_004',
      merchantId,
      title: 'Festival Season Sale',
      type: 'billboard',
      status: 'draft',
      locations: ['Sector 17, Chandigarh'],
      startDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      budget: 80000,
      attachedOffer: 'Festival bundle at 40% off',
      scanCount: 0,
      viewCount: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];
}

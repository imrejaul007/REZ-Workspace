/**
 * QR Hub API Service
 *
 * Unified API client for all QR code services:
 * - Menu QR (Restaurant digital menu)
 * - Room QR (Hotel room services)
 * - Ads QR (Campaign QR codes)
 * - Link QR (Rez Now linktree)
 */

import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from './client';

// ============================================================================
// Types
// ============================================================================

export interface MenuQRStats {
  todayScans: number;
  weekScans: number;
  monthScans: number;
  todayOrders: number;
  weekOrders: number;
  monthOrders: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  topItems: TopMenuItem[];
  popularTimes: PopularTime[];
  dietaryFilters: DietaryFilterUsage[];
}

export interface TopMenuItem {
  id: string;
  name: string;
  orders: number;
  revenue: number;
  image?: string;
}

export interface PopularTime {
  hour: string;
  scans: number;
  orders: number;
}

export interface DietaryFilterUsage {
  filter: string;
  usageCount: number;
  percentage: number;
}

export interface MenuQRCode {
  id: string;
  storeId: string;
  name: string;
  url: string;
  shortCode: string;
  type: 'table' | 'counter' | 'delivery';
  tableId?: string;
  isActive: boolean;
  createdAt: string;
  scansCount: number;
}

export interface RoomQRStats {
  activeRooms: number;
  totalRooms: number;
  todayRequests: number;
  pendingRequests: number;
  completedRequests: number;
  avgResponseTime: string;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  recentRequests: RoomServiceRequest[];
  topServices: ServiceUsage[];
}

export interface RoomServiceRequest {
  id: string;
  roomId: string;
  roomNumber: string;
  type:
    | 'room_service'
    | 'housekeeping'
    | 'laundry'
    | 'spa'
    | 'transport'
    | 'restaurant'
    | 'checkout';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  completedAt?: string;
  guestName?: string;
  amount?: number;
}

export interface ServiceUsage {
  name: string;
  count: number;
  revenue: number;
}

export interface RoomQRCode {
  id: string;
  hotelId: string;
  roomNumber: string;
  floor: number;
  url: string;
  shortCode: string;
  isActive: boolean;
  createdAt: string;
  scansCount: number;
  lastScanAt?: string;
}

export interface AdsQRStats {
  totalScans: number;
  totalConversions: number;
  totalRevenue: number;
  avgROI: number;
  campaigns: AdCampaign[];
}

export interface AdCampaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  startDate: string;
  endDate?: string;
  budget: number;
  spent: number;
  scans: number;
  conversions: number;
  revenue: number;
  roi: number;
  ctr: number;
  cpc: number;
  rewardType?: 'coin' | 'discount' | 'cashback';
  rewardValue?: number;
}

export interface AdsQRCode {
  id: string;
  campaignId: string;
  merchantId: string;
  name: string;
  url: string;
  shortCode: string;
  type: 'poster' | 'flyer' | 'social' | 'print' | 'digital';
  isActive: boolean;
  createdAt: string;
  scansCount: number;
  conversions: number;
}

export interface LinkQRStats {
  totalViews: number;
  totalClicks: number;
  clicksByDay: DailyStats[];
  topLinks: LinkClickStats[];
  devices: DeviceBreakdown;
  locations: LocationStats[];
}

export interface DailyStats {
  date: string;
  views: number;
  clicks: number;
}

export interface LinkClickStats {
  id: string;
  title: string;
  url: string;
  clicks: number;
  ctr: number;
}

export interface DeviceBreakdown {
  mobile: number;
  desktop: number;
  tablet: number;
}

export interface LocationStats {
  city: string;
  country: string;
  clicks: number;
  percentage: number;
}

export interface LinkQRCode {
  id: string;
  merchantId: string;
  name: string;
  url: string;
  shortCode: string;
  isActive: boolean;
  createdAt: string;
  viewsCount: number;
  clicksCount: number;
}

export interface QRHubOverview {
  menuQr: {
    scans: number;
    orders: number;
    revenue: number;
    activeCodes: number;
  };
  roomQr: {
    activeRooms: number;
    requests: number;
    revenue: number;
    pendingRequests: number;
  };
  adsQr: {
    campaigns: number;
    scans: number;
    conversions: number;
    revenue: number;
  };
  linkQr: {
    views: number;
    clicks: number;
    activeLinks: number;
  };
  totalRevenue: number;
  totalScans: number;
  recentActivity: QRHubActivity[];
}

export interface QRHubActivity {
  id: string;
  type: 'menu_scan' | 'room_request' | 'ad_scan' | 'link_click' | 'order_placed';
  timestamp: string;
  details: string;
  amount?: number;
  qrType: 'menu' | 'room' | 'ads' | 'link';
}

export interface QRCode {
  id: string;
  type: 'menu' | 'room' | 'ads' | 'link';
  name: string;
  url: string;
  shortCode: string;
  isActive: boolean;
  scansCount: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface QRCodeFilters {
  type?: 'menu' | 'room' | 'ads' | 'link';
  isActive?: boolean;
  search?: string;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  storeId?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface CrossQRAnalytics {
  totalScans: { value: number; change: number };
  revenueByQRType: { type: string; revenue: number; percentage: number }[];
  scansByQRType: { type: string; scans: number; percentage: number }[];
  customerJourney: JourneyStep[];
  attributionData: AttributionData[];
  trends: TrendData[];
}

export interface JourneyStep {
  step: number;
  action: string;
  count: number;
  dropoffRate: number;
}

export interface AttributionData {
  source: string;
  conversions: number;
  revenue: number;
  roi: number;
}

export interface TrendData {
  date: string;
  scans: number;
  revenue: number;
  orders: number;
}

// ============================================================================
// API Functions
// ============================================================================

const BASE_URL = '/api/qr-hub';

/**
 * Get unified QR Hub overview stats
 */
export async function getQRHubOverview(merchantId: string): Promise<ApiResponse<QRHubOverview>> {
  return apiClient.get<QRHubOverview>(`${BASE_URL}/overview`, { merchantId });
}

/**
 * Get Menu QR stats
 */
export async function getMenuQRStats(
  storeId: string,
  period: 'today' | 'week' | 'month' = 'week'
): Promise<ApiResponse<MenuQRStats>> {
  return apiClient.get<MenuQRStats>(`${BASE_URL}/menu/stats`, { storeId, period });
}

/**
 * Get all Menu QR codes for a store
 */
export async function getMenuQRCodes(
  storeId: string,
  filters?: QRCodeFilters
): Promise<PaginatedResponse<MenuQRCode>> {
  return apiClient.get<MenuQRCode[]>(`${BASE_URL}/menu/codes`, { storeId, ...filters });
}

/**
 * Create a new Menu QR code
 */
export async function createMenuQRCode(
  data: Partial<MenuQRCode>
): Promise<ApiResponse<MenuQRCode>> {
  return apiClient.post<MenuQRCode>(`${BASE_URL}/menu/codes`, data);
}

/**
 * Update Menu QR code
 */
export async function updateMenuQRCode(
  id: string,
  data: Partial<MenuQRCode>
): Promise<ApiResponse<MenuQRCode>> {
  return apiClient.patch<MenuQRCode>(`${BASE_URL}/menu/codes/${id}`, data);
}

/**
 * Delete Menu QR code
 */
export async function deleteMenuQRCode(id: string): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`${BASE_URL}/menu/codes/${id}`);
}

/**
 * Get Room QR stats
 */
export async function getRoomQRStats(
  hotelId: string,
  period?: 'today' | 'week' | 'month'
): Promise<ApiResponse<RoomQRStats>> {
  return apiClient.get<RoomQRStats>(`${BASE_URL}/room/stats`, { hotelId, period });
}

/**
 * Get all Room QR codes for a hotel
 */
export async function getRoomQRCodes(
  hotelId: string,
  filters?: QRCodeFilters
): Promise<PaginatedResponse<RoomQRCode>> {
  return apiClient.get<RoomQRCode[]>(`${BASE_URL}/room/codes`, { hotelId, ...filters });
}

/**
 * Create a new Room QR code
 */
export async function createRoomQRCode(
  data: Partial<RoomQRCode>
): Promise<ApiResponse<RoomQRCode>> {
  return apiClient.post<RoomQRCode>(`${BASE_URL}/room/codes`, data);
}

/**
 * Bulk create Room QR codes for a floor
 */
export async function bulkCreateRoomQRCodes(
  hotelId: string,
  floor: number,
  roomCount: number,
  startRoom: number
): Promise<ApiResponse<RoomQRCode[]>> {
  return apiClient.post<RoomQRCode[]>(`${BASE_URL}/room/codes/bulk`, {
    hotelId,
    floor,
    roomCount,
    startRoom,
  });
}

/**
 * Update Room QR code
 */
export async function updateRoomQRCode(
  id: string,
  data: Partial<RoomQRCode>
): Promise<ApiResponse<RoomQRCode>> {
  return apiClient.patch<RoomQRCode>(`${BASE_URL}/room/codes/${id}`, data);
}

/**
 * Delete Room QR code
 */
export async function deleteRoomQRCode(id: string): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`${BASE_URL}/room/codes/${id}`);
}

/**
 * Get Room service requests
 */
export async function getRoomServiceRequests(
  hotelId: string,
  status?: RoomServiceRequest['status']
): Promise<PaginatedResponse<RoomServiceRequest>> {
  return apiClient.get<RoomServiceRequest[]>(`${BASE_URL}/room/requests`, { hotelId, status });
}

/**
 * Update Room service request status
 */
export async function updateRoomServiceRequest(
  id: string,
  data: { status: RoomServiceRequest['status']; notes?: string }
): Promise<ApiResponse<RoomServiceRequest>> {
  return apiClient.patch<RoomServiceRequest>(`${BASE_URL}/room/requests/${id}`, data);
}

/**
 * Get Ads QR stats
 */
export async function getAdsQRStats(
  merchantId: string,
  period?: 'today' | 'week' | 'month'
): Promise<ApiResponse<AdsQRStats>> {
  return apiClient.get<AdsQRStats>(`${BASE_URL}/ads/stats`, { merchantId, period });
}

/**
 * Get all Ads QR campaigns
 */
export async function getAdsQRCampaigns(
  merchantId: string,
  status?: AdCampaign['status']
): Promise<PaginatedResponse<AdCampaign>> {
  return apiClient.get<AdCampaign[]>(`${BASE_URL}/ads/campaigns`, { merchantId, status });
}

/**
 * Get all Ads QR codes
 */
export async function getAdsQRCodes(
  merchantId: string,
  campaignId?: string
): Promise<PaginatedResponse<AdsQRCode>> {
  return apiClient.get<AdsQRCode[]>(`${BASE_URL}/ads/codes`, { merchantId, campaignId });
}

/**
 * Create a new Ads QR code
 */
export async function createAdsQRCode(data: Partial<AdsQRCode>): Promise<ApiResponse<AdsQRCode>> {
  return apiClient.post<AdsQRCode>(`${BASE_URL}/ads/codes`, data);
}

/**
 * Update Ads QR code
 */
export async function updateAdsQRCode(
  id: string,
  data: Partial<AdsQRCode>
): Promise<ApiResponse<AdsQRCode>> {
  return apiClient.patch<AdsQRCode>(`${BASE_URL}/ads/codes/${id}`, data);
}

/**
 * Delete Ads QR code
 */
export async function deleteAdsQRCode(id: string): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`${BASE_URL}/ads/codes/${id}`);
}

/**
 * Get Link QR stats
 */
export async function getLinkQRStats(
  merchantId: string,
  period?: 'today' | 'week' | 'month'
): Promise<ApiResponse<LinkQRStats>> {
  return apiClient.get<LinkQRStats>(`${BASE_URL}/link/stats`, { merchantId, period });
}

/**
 * Get all Link QR codes
 */
export async function getLinkQRCodes(merchantId: string): Promise<PaginatedResponse<LinkQRCode>> {
  return apiClient.get<LinkQRCode[]>(`${BASE_URL}/link/codes`, { merchantId });
}

/**
 * Create a new Link QR code
 */
export async function createLinkQRCode(
  data: Partial<LinkQRCode>
): Promise<ApiResponse<LinkQRCode>> {
  return apiClient.post<LinkQRCode>(`${BASE_URL}/link/codes`, data);
}

/**
 * Update Link QR code
 */
export async function updateLinkQRCode(
  id: string,
  data: Partial<LinkQRCode>
): Promise<ApiResponse<LinkQRCode>> {
  return apiClient.patch<LinkQRCode>(`${BASE_URL}/link/codes/${id}`, data);
}

/**
 * Delete Link QR code
 */
export async function deleteLinkQRCode(id: string): Promise<ApiResponse<void>> {
  return apiClient.delete<void>(`${BASE_URL}/link/codes/${id}`);
}

/**
 * Get all QR codes (unified)
 */
export async function getAllQRCodes(
  merchantId: string,
  filters?: QRCodeFilters
): Promise<PaginatedResponse<QRCode>> {
  return apiClient.get<QRCode[]>(`${BASE_URL}/codes`, { merchantId, ...filters });
}

/**
 * Get cross-QR analytics
 */
export async function getCrossQRAnalytics(
  merchantId: string,
  filters?: AnalyticsFilters
): Promise<ApiResponse<CrossQRAnalytics>> {
  return apiClient.get<CrossQRAnalytics>(`${BASE_URL}/analytics`, { merchantId, ...filters });
}

/**
 * Download QR code (returns URL to image)
 */
export async function downloadQRCode(
  id: string,
  format: 'png' | 'svg' | 'pdf' = 'png',
  size: number = 512
): Promise<ApiResponse<{ url: string; expiresAt: string }>> {
  return apiClient.get(`${BASE_URL}/codes/${id}/download`, { format, size });
}

/**
 * Regenerate QR code short URL
 */
export async function regenerateQRCode(id: string): Promise<ApiResponse<QRCode>> {
  return apiClient.post<QRCode>(`${BASE_URL}/codes/${id}/regenerate`, {});
}

/**
 * Toggle QR code active status
 */
export async function toggleQRCodeActive(
  id: string,
  isActive: boolean
): Promise<ApiResponse<QRCode>> {
  return apiClient.patch<QRCode>(`${BASE_URL}/codes/${id}`, { isActive });
}

/**
 * Get QR code activity/usage history
 */
export async function getQRCodeActivity(
  id: string,
  limit: number = 50
): Promise<PaginatedResponse<QRHubActivity>> {
  return apiClient.get<QRHubActivity[]>(`${BASE_URL}/codes/${id}/activity`, { limit });
}

/**
 * Print QR code labels
 */
export async function printQRLabels(
  ids: string[],
  template: 'small' | 'medium' | 'large' = 'medium'
): Promise<ApiResponse<{ printJobId: string }>> {
  return apiClient.post(`${BASE_URL}/codes/print`, { ids, template });
}

// ============================================================================
// Service Export
// ============================================================================

export const qrHubService = {
  // Overview
  getOverview: getQRHubOverview,

  // Menu QR
  getMenuStats: getMenuQRStats,
  getMenuCodes: getMenuQRCodes,
  createMenuCode: createMenuQRCode,
  updateMenuCode: updateMenuQRCode,
  deleteMenuCode: deleteMenuQRCode,

  // Room QR
  getRoomStats: getRoomQRStats,
  getRoomCodes: getRoomQRCodes,
  createRoomCode: createRoomQRCode,
  bulkCreateRoomCodes: bulkCreateRoomQRCodes,
  updateRoomCode: updateRoomQRCode,
  deleteRoomCode: deleteRoomQRCode,
  getRoomRequests: getRoomServiceRequests,
  updateRoomRequest: updateRoomServiceRequest,

  // Ads QR
  getAdsStats: getAdsQRStats,
  getAdsCampaigns: getAdsQRCampaigns,
  getAdsCodes: getAdsQRCodes,
  createAdsCode: createAdsQRCode,
  updateAdsCode: updateAdsQRCode,
  deleteAdsCode: deleteAdsQRCode,

  // Link QR
  getLinkStats: getLinkQRStats,
  getLinkCodes: getLinkQRCodes,
  createLinkCode: createLinkQRCode,
  updateLinkCode: updateLinkQRCode,
  deleteLinkCode: deleteLinkQRCode,

  // Unified
  getAllCodes: getAllQRCodes,
  getAnalytics: getCrossQRAnalytics,
  downloadQR: downloadQRCode,
  regenerateQR: regenerateQRCode,
  toggleActive: toggleQRCodeActive,
  getActivity: getQRCodeActivity,
  printLabels: printQRLabels,
};

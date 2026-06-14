// API Service for Verify QR Admin
// Connects to verify-qr-service backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const VERIFY_QR_BASE = process.env.VERIFY_QR_SERVICE_URL || `${API_BASE_URL}/api/v1`;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface Serial {
  id: string;
  serialNumber: string;
  qrCode: string;
  status: 'active' | 'used' | 'expired' | 'revoked';
  productId?: string;
  productName?: string;
  createdAt: string;
  expiresAt?: string;
  usedAt?: string;
  usedBy?: string;
}

interface FraudAlert {
  id: string;
  serialNumber: string;
  alertType: 'duplicate_scan' | 'unauthorized_domain' | 'geo_mismatch' | 'suspicious_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reportedAt: string;
  details: {
    ipAddress?: string;
    location?: string;
    userAgent?: string;
    scanAttempts?: number;
    metadata?: Record<string, unknown>;
  };
}

interface Claim {
  id: string;
  serialNumber: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  claimType: 'warranty' | 'support' | 'replacement';
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description: string;
  submittedAt: string;
  resolvedAt?: string;
  serviceCenterId?: string;
  serviceCenterName?: string;
}

interface ServiceCenter {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive' | 'maintenance';
  coordinates?: {
    lat: number;
    lng: number;
  };
  operatingHours?: {
    day: string;
    open: string;
    close: string;
  }[];
  assignedClaims: number;
}

interface DashboardStats {
  totalSerials: number;
  activeSerials: number;
  usedSerials: number;
  fraudAttempts: number;
  pendingClaims: number;
  resolvedClaims: number;
  serviceCenters: number;
  monthlyScans: number;
  scanGrowth: number;
  topProduct: string;
  recentActivity: {
    type: 'scan' | 'claim' | 'fraud' | 'serial_created';
    message: string;
    timestamp: string;
  }[];
}

interface AnalyticsData {
  scansByDay: { date: string; count: number }[];
  scansByRegion: { region: string; count: number }[];
  fraudByType: { type: string; count: number }[];
  claimResolutionTime: { avgDays: number; minDays: number; maxDays: number };
  serialUsageRate: number;
  topProducts: { productId: string; productName: string; scans: number }[];
}

// Generic fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = process.env.AUTH_TOKEN;

    const response = await fetch(`${VERIFY_QR_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `HTTP error ${response.status}`,
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Dashboard API
export async function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  return apiFetch<DashboardStats>('/admin/dashboard/stats');
}

// Serial Management API
export async function getSerials(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<ApiResponse<{ serials: Serial[]; total: number; page: number; pages: number }>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);

  const query = searchParams.toString();
  return apiFetch<{ serials: Serial[]; total: number; page: number; pages: number }>(
    `/admin/serials${query ? `?${query}` : ''}`
  );
}

export async function generateSerials(data: {
  productId: string;
  productName: string;
  quantity: number;
  prefix?: string;
  expiresInDays?: number;
}): Promise<ApiResponse<{ serials: Serial[]; batchId: string }>> {
  return apiFetch<{ serials: Serial[]; batchId: string }>('/admin/serials/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function revokeSerial(serialId: string, reason: string): Promise<ApiResponse<Serial>> {
  return apiFetch<Serial>(`/admin/serials/${serialId}/revoke`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function exportSerials(params?: {
  format?: 'csv' | 'xlsx';
  status?: string;
}): Promise<ApiResponse<{ downloadUrl: string }>> {
  const searchParams = new URLSearchParams();
  if (params?.format) searchParams.set('format', params.format);
  if (params?.status) searchParams.set('status', params.status);

  const query = searchParams.toString();
  return apiFetch<{ downloadUrl: string }>(`/admin/serials/export${query ? `?${query}` : ''}`);
}

// Fraud Queue API
export async function getFraudAlerts(params?: {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
}): Promise<ApiResponse<{ alerts: FraudAlert[]; total: number; page: number; pages: number }>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.status) searchParams.set('status', params.status);
  if (params?.severity) searchParams.set('severity', params.severity);

  const query = searchParams.toString();
  return apiFetch<{ alerts: FraudAlert[]; total: number; page: number; pages: number }>(
    `/admin/fraud${query ? `?${query}` : ''}`
  );
}

export async function reviewFraudAlert(
  alertId: string,
  action: 'resolve' | 'dismiss' | 'escalate',
  notes?: string
): Promise<ApiResponse<FraudAlert>> {
  return apiFetch<FraudAlert>(`/admin/fraud/${alertId}/review`, {
    method: 'POST',
    body: JSON.stringify({ action, notes }),
  });
}

export async function getFraudStats(): Promise<ApiResponse<{
  totalAlerts: number;
  criticalAlerts: number;
  recentTrend: number;
  topAlertTypes: { type: string; count: number }[];
}>> {
  return apiFetch('/admin/fraud/stats');
}

// Claims API
export async function getClaims(params?: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}): Promise<ApiResponse<{ claims: Claim[]; total: number; page: number; pages: number }>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.status) searchParams.set('status', params.status);
  if (params?.type) searchParams.set('type', params.type);

  const query = searchParams.toString();
  return apiFetch<{ claims: Claim[]; total: number; page: number; pages: number }>(
    `/admin/claims${query ? `?${query}` : ''}`
  );
}

export async function updateClaimStatus(
  claimId: string,
  status: 'approved' | 'rejected' | 'escalated',
  notes?: string,
  serviceCenterId?: string
): Promise<ApiResponse<Claim>> {
  return apiFetch<Claim>(`/admin/claims/${claimId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes, serviceCenterId }),
  });
}

export async function assignServiceCenter(
  claimId: string,
  serviceCenterId: string
): Promise<ApiResponse<Claim>> {
  return apiFetch<Claim>(`/admin/claims/${claimId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ serviceCenterId }),
  });
}

// Service Centers API
export async function getServiceCenters(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<ApiResponse<{ centers: ServiceCenter[]; total: number; page: number; pages: number }>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);

  const query = searchParams.toString();
  return apiFetch<{ centers: ServiceCenter[]; total: number; page: number; pages: number }>(
    `/admin/centers${query ? `?${query}` : ''}`
  );
}

export async function createServiceCenter(data: Omit<ServiceCenter, 'id'>): Promise<ApiResponse<ServiceCenter>> {
  return apiFetch<ServiceCenter>('/admin/centers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateServiceCenter(
  centerId: string,
  data: Partial<Omit<ServiceCenter, 'id'>>
): Promise<ApiResponse<ServiceCenter>> {
  return apiFetch<ServiceCenter>(`/admin/centers/${centerId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function toggleServiceCenterStatus(
  centerId: string,
  status: 'active' | 'inactive' | 'maintenance'
): Promise<ApiResponse<ServiceCenter>> {
  return apiFetch<ServiceCenter>(`/admin/centers/${centerId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
}

// Analytics API
export async function getAnalytics(params?: {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}): Promise<ApiResponse<AnalyticsData>> {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);
  if (params?.groupBy) searchParams.set('groupBy', params.groupBy);

  const query = searchParams.toString();
  return apiFetch<AnalyticsData>(`/admin/analytics${query ? `?${query}` : ''}`);
}

export async function getFraudAnalytics(): Promise<ApiResponse<{
  totalFraud: number;
  byType: { type: string; count: number; trend: number }[];
  bySeverity: { severity: string; count: number }[];
  byDay: { date: string; count: number }[];
}>> {
  return apiFetch('/admin/analytics/fraud');
}

export async function getClaimAnalytics(): Promise<ApiResponse<{
  totalClaims: number;
  byStatus: { status: string; count: number }[];
  byType: { type: string; count: number }[];
  avgResolutionTime: number;
  resolutionTrend: number[];
}>> {
  return apiFetch('/admin/analytics/claims');
}

// Export types for use in components
export type { Serial, FraudAlert, Claim, ServiceCenter, DashboardStats, AnalyticsData };

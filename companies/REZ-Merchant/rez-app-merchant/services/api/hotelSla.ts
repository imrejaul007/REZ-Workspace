/**
 * Hotel SLA API Service
 *
 * Thin wrapper for SLA monitoring API calls to the Hotel OTA microservice.
 * Uses the hotel-staff JWT stored in SecureStore.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SLAOverallMetrics {
  totalRequests: number;
  completedRequests: number;
  activeRequests: number;
  responseSLAMetCount: number;
  completionSLAMetCount: number;
  responseComplianceRate: number;
  completionComplianceRate: number;
  averageResponseTimeMinutes: number;
  averageCompletionTimeMinutes: number;
  breachingRequests: number;
  breachingRate: number;
}

export interface ServiceTypeMetrics {
  serviceType: string;
  totalRequests: number;
  completedRequests: number;
  breachingRequests: number;
  complianceRate: number;
  avgResponseTimeMinutes: number;
  avgCompletionTimeMinutes: number;
}

export interface TrendData {
  date: string;
  totalRequests: number;
  completedRequests: number;
  complianceRate: number;
}

export interface SLAMetricsResponse {
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  overall: SLAOverallMetrics;
  byServiceType: ServiceTypeMetrics[];
  trends: TrendData[];
}

export interface BreachingRequest {
  id: string;
  bookingId: string;
  roomNumber: string;
  guestName: string;
  serviceType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  createdAt: string;
  assignedAt: string | null;
  responseTimeMinutes: number | null;
  elapsedMinutes: number;
  threshold: {
    responseMinutes?: number;
    completionMinutes: number;
  };
  slaBreachType: string;
  breachSeverity: 'warning' | 'critical';
}

export interface SLAAlertsResponse {
  count: number;
  breachingRequests: BreachingRequest[];
  summary: {
    critical: number;
    warning: number;
    byServiceType: Record<string, number>;
  };
}

export interface StaffPerformance {
  staffId: string;
  staffName: string;
  totalAssigned: number;
  completedCount: number;
  pendingCount: number;
  completionRate: number;
  slaComplianceRate: number;
  averageResponseTimeMinutes: number;
  averageCompletionTimeMinutes: number;
  onTimeRate: number;
}

export interface StaffPerformanceResponse {
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  overall: {
    totalStaff: number;
    totalAssigned: number;
    totalCompleted: number;
    averageSLACompliance: number;
  };
  staff: StaffPerformance[];
}

// ─── Configuration ────────────────────────────────────────────────────────────

const OTA_BASE =
  process.env.EXPO_PUBLIC_HOTEL_OTA_URL ??
  (__DEV__ ? 'http://localhost:3008' : 'https://hotel-ota-placeholder.rez.in');

const OTA_TIMEOUT_MS = 10000;
const KEYCHAIN_SERVICE = 'rez.merchant.hotel';

function buildOtaClient(jwt: string): AxiosInstance {
  return axios.create({
    baseURL: OTA_BASE,
    timeout: OTA_TIMEOUT_MS,
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
  });
}

async function getOtaToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('@hotel_ota:staff_token', {
      keychainService: KEYCHAIN_SERVICE,
    });
  } catch {
    return null;
  }
}

// ─── Service Class ────────────────────────────────────────────────────────────

class HotelSlaService {
  /**
   * Get overall SLA metrics for the hotel
   */
  async getMetrics(periodDays = 7): Promise<SLAMetricsResponse> {
    const token = await getOtaToken();
    if (!token) throw new Error('Not connected to Hotel OTA');

    const client = buildOtaClient(token);

    try {
      const res = await client.get<{ success: boolean; data: SLAMetricsResponse }>(
        `/v1/hotel/sla?period=${periodDays}`
      );
      if (!res.data.success) {
        throw new Error('Failed to fetch SLA metrics');
      }
      return res.data.data;
    } catch (err) {
      return this._handleError(err, () => this.getMetrics(periodDays));
    }
  }

  /**
   * Get currently breaching SLA requests
   */
  async getAlerts(): Promise<SLAAlertsResponse> {
    const token = await getOtaToken();
    if (!token) throw new Error('Not connected to Hotel OTA');

    const client = buildOtaClient(token);

    try {
      const res = await client.get<{ success: boolean; data: SLAAlertsResponse }>(
        '/v1/hotel/sla/alerts'
      );
      if (!res.data.success) {
        throw new Error('Failed to fetch SLA alerts');
      }
      return res.data.data;
    } catch (err) {
      return this._handleError(err, () => this.getAlerts());
    }
  }

  /**
   * Get staff performance metrics
   */
  async getStaffPerformance(periodDays = 7): Promise<StaffPerformanceResponse> {
    const token = await getOtaToken();
    if (!token) throw new Error('Not connected to Hotel OTA');

    const client = buildOtaClient(token);

    try {
      const res = await client.get<{ success: boolean; data: StaffPerformanceResponse }>(
        `/v1/staff/sla?period=${periodDays}`
      );
      if (!res.data.success) {
        throw new Error('Failed to fetch staff performance');
      }
      return res.data.data;
    } catch (err) {
      return this._handleError(err, () => this.getStaffPerformance(periodDays));
    }
  }

  /**
   * Get SLA thresholds configuration
   */
  async getThresholds(): Promise<{
    default: {
      responseTimeMinutes: number;
      completionTimeMinutes: number;
      urgentResponseTimeMinutes: number;
    };
    byServiceType: Record<string, {
      responseTimeMinutes?: number;
      completionTimeMinutes?: number;
    }>;
  }> {
    const token = await getOtaToken();
    if (!token) throw new Error('Not connected to Hotel OTA');

    const client = buildOtaClient(token);

    try {
      const res = await client.get('/v1/hotel/sla/thresholds');
      if (!res.data.success) {
        throw new Error('Failed to fetch SLA thresholds');
      }
      return res.data.data;
    } catch (err) {
      return this._handleError(err, () => this.getThresholds());
    }
  }

  /**
   * Assign staff to a service request
   */
  async assignRequest(requestId: string, staffId: string, staffName: string): Promise<boolean> {
    const token = await getOtaToken();
    if (!token) throw new Error('Not connected to Hotel OTA');

    const client = buildOtaClient(token);

    try {
      const res = await client.post(`/v1/hotel/sla/request/${requestId}/assign`, {
        staffId,
        staffName,
      });
      return res.data.success;
    } catch (err) {
      return this._handleError(err, () => this.assignRequest(requestId, staffId, staffName));
    }
  }

  /**
   * Mark a service request as complete
   */
  async completeRequest(requestId: string, notes?: string): Promise<{
    success: boolean;
    completionMinutes?: number;
    slaMet?: boolean;
  }> {
    const token = await getOtaToken();
    if (!token) throw new Error('Not connected to Hotel OTA');

    const client = buildOtaClient(token);

    try {
      const res = await client.post(`/v1/hotel/sla/request/${requestId}/complete`, { notes });
      return res.data.data;
    } catch (err) {
      return this._handleError(err, () => this.completeRequest(requestId, notes));
    }
  }

  // ─── Error Handling ────────────────────────────────────────────────────────

  private async _handleError<T>(err: unknown, retry: () => Promise<T>): Promise<T> {
    const axiosErr = err as AxiosError;
    if (axiosErr.response?.status !== 401) {
      const responseData = axiosErr.response?.data as { message?: string } | null;
      const message =
        responseData?.message ??
        (axiosErr.response?.status ? `Error ${axiosErr.response.status}` : axiosErr.message);
      throw new Error(message);
    }

    const currentToken = await getOtaToken();
    if (!currentToken) throw new Error('Session expired. Please reconnect your hotel property.');

    // Attempt token refresh
    try {
      const res = await axios.post(
        `${OTA_BASE}/v1/auth/refresh`,
        { token: currentToken },
        { timeout: OTA_TIMEOUT_MS, headers: { 'Content-Type': 'application/json' } }
      );
      const newToken: string | undefined = res.data?.data?.token ?? res.data?.token;
      if (newToken) {
        await SecureStore.setItemAsync('@hotel_ota:staff_token', newToken, {
          keychainService: KEYCHAIN_SERVICE,
        });
        return retry();
      }
    } catch {
      // Refresh failed
    }

    await SecureStore.deleteItemAsync('@hotel_ota:staff_token', {
      keychainService: KEYCHAIN_SERVICE,
    });
    throw new Error('Session expired. Please reconnect your hotel property.');
  }
}

export const hotelSlaService = new HotelSlaService();
export default hotelSlaService;

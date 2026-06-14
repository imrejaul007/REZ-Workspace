import { apiClient, ApiResponse } from './client';

// ─── Types ──────────────────────────────────────────────

export interface TrialImage {
  url: string;
  order: number;
}

export interface TrialOffer {
  _id: string;
  merchantId: string;
  title: string;
  category: 'Service' | 'Sample Pickup' | 'Experience' | 'D2C Kit';
  originalPrice: number;
  trialCoinPrice: number;
  commitmentFee: number;
  dailySlots: number;
  qrWindowType: 'Fixed' | '30min' | '2hours' | 'Auto';
  qrWindowMinutes: number;
  images: TrialImage[];
  terms: string;
  rewardCoins: number;
  brandedCoins: number;
  brandedCoinLabel: string;
  upsellLinks: Array<{ title: string; url: string }>;
  status: 'pending_approval' | 'active' | 'paused' | 'rejected';
  rejectionReason?: string;
  bookingsToday: number;
  completionRate: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrialPayload {
  title: string;
  category: 'Service' | 'Sample Pickup' | 'Experience' | 'D2C Kit';
  originalPrice: number;
  trialCoinPrice: number;
  commitmentFee: number;
  dailySlots: number;
  qrWindowType: 'Fixed' | '30min' | '2hours' | 'Auto';
  qrWindowMinutes: number;
  images: TrialImage[];
  terms: string;
  rewardCoins: number;
  brandedCoins: number;
  brandedCoinLabel: string;
  upsellLinks: Array<{ title: string; url: string }>;
}

export interface ScanQRPayload {
  qrToken: string;
  scanGeo: {
    latitude: number;
    longitude: number;
  };
}

export interface ScanQRResponse {
  success: boolean;
  customerId: string;
  customerName: string;
  rewardCoins: number;
  brandedCoins: number;
}

export interface TrialAnalytics {
  totalBookings: number;
  totalCompletions: number;
  completionRate: number;
  averageRewardValue: number;
  todayBookings: number;
  thisWeekBookings: number;
}

// ─── Service ────────────────────────────────────────────

class TrialsService {
  /**
   * Get merchant's trials
   */
  async getTrials(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<{ trials: TrialOffer[]; pagination: unknown }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.status) queryParams.append('status', params.status);

    return apiClient.get(
      `/merchant/trials${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    );
  }

  /**
   * Create a new trial
   */
  async createTrial(data: CreateTrialPayload): Promise<ApiResponse<TrialOffer>> {
    return apiClient.post('/merchant/trials', data);
  }

  /**
   * Pause or resume a trial
   */
  async updateTrialStatus(
    trialId: string,
    status: 'active' | 'paused'
  ): Promise<ApiResponse<TrialOffer>> {
    return apiClient.patch(`/merchant/trials/${trialId}`, { status });
  }

  /**
   * Scan QR code to complete a trial
   */
  async scanQR(data: ScanQRPayload): Promise<ApiResponse<ScanQRResponse>> {
    return apiClient.post('/merchant/trials/scan', data);
  }

  /**
   * Get trial analytics
   */
  async getAnalytics(trialId?: string): Promise<ApiResponse<TrialAnalytics>> {
    const url = trialId ? `/merchant/trials/${trialId}/analytics` : '/merchant/trials/analytics';
    return apiClient.get(url);
  }
}

export const trialsService = new TrialsService();
export default trialsService;

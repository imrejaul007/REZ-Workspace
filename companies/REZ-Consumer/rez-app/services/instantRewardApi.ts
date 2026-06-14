import apiClient from './apiClient';

// ============================================================================
// INSTANT REWARD API SERVICE
// Phase 1.2 — Instant Reward Gratification
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export interface InstantRewardResult {
  coinsAwarded: number;
  coinType: 'rez' | 'branded';
  merchantId: string;
  merchantName: string;
  reason: 'checkin' | 'qr_scan';
  streakDays: number;
  streakUpdated: boolean;
  newBalance: number;
  nextMilestone?: string;
  tierProgress?: {
    currentTier: string;
    nextTier: string;
    currentVisits: number;
    requiredVisits: number;
  };
}

export interface CheckinPayload {
  storeId: string;
  latitude?: number;
  longitude?: number;
}

export interface QRScanPayload {
  storeId: string;
  qrData?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Award instant coins when a user checks in to a store.
 * POST /api/rewards/instant/checkin
 */
export async function onCheckin(storeId: string, location?: { latitude: number; longitude: number }): Promise<InstantRewardResult> {
  const payload: CheckinPayload = {
    storeId,
    ...(location ?? {}),
  };
  const response = await apiClient.post<InstantRewardResult>(
    '/rewards/instant/checkin',
    payload as unknown as Record<string, unknown>,
  );
  return response.data as InstantRewardResult;
}

/**
 * Award instant coins when a user scans a store QR code.
 * POST /api/rewards/instant/scan
 */
export async function onQRScan(storeId: string, qrData?: string): Promise<InstantRewardResult> {
  const payload: QRScanPayload = { storeId, qrData };
  const response = await apiClient.post<InstantRewardResult>(
    '/rewards/instant/scan',
    payload as unknown as Record<string, unknown>,
  );
  return response.data as InstantRewardResult;
}

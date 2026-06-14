import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

export interface CheckInResult {
  rewarded: boolean;
  coins: number;
  streak: number;
  bonusCoins?: number;
  baseCoins?: number;
}

export interface CheckInStatus {
  checkedInToday: boolean;
  streak: number;
  nextReward: number;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * POST /api/gamification/daily-checkin
 *
 * Performs the daily check-in for the authenticated user.
 * Awards 10 RC (plus streak bonus) on first call of the day.
 * Subsequent calls return { rewarded: false, coins: 0, streak } — safe to call
 * on every app open.
 */
export const checkIn = (): Promise<ApiResponse<CheckInResult>> =>
  apiClient.post<unknown>('/gamification/daily-checkin', {});

/**
 * GET /api/gamification/daily-checkin/status
 *
 * Returns the user's current check-in state without performing a check-in.
 * Use this to decide whether to show the "Check In" CTA or a "Checked In" badge.
 */
export const getCheckinStatus = (): Promise<ApiResponse<CheckInStatus>> =>
  apiClient.get<unknown>('/gamification/daily-checkin/status');

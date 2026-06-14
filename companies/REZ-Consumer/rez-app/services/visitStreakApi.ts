import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

export interface RecentVisit {
  visitNumber: string;
  storeId: string;
  storeName: string | null;
  storeCity: string | null;
  visitDate: string;
  visitType: string;
  status: string;
  createdAt: string;
}

export interface NextMilestone {
  visitsNeeded: number;   // how many more visits until the milestone
  totalRequired: number;  // absolute visit count to hit the milestone
  reward: number;         // RC coins awarded at the milestone
  name: string;
}

export interface VisitStreakData {
  totalVisits: number;
  currentStreak: number;
  longestStreak: number;
  nextMilestone: NextMilestone | null;
  recentVisits: RecentVisit[];
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * GET /api/users/visit-streak
 *
 * Returns the authenticated user's store-visit totals, current and longest
 * streak, next reward milestone, and the last 5 completed visits.
 */
export const getVisitStreak = (): Promise<ApiResponse<VisitStreakData>> =>
  apiClient.get<unknown>('/users/visit-streak');

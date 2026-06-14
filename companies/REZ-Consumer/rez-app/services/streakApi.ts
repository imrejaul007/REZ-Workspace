// @ts-nocheck
// Streak API Service
// Handles all streak-related API calls
// Backend routes: /api/gamification/streak/* and /api/gamification/streaks

import apiClient, { ApiResponse } from './apiClient';

export interface StreakMilestone {
  day: number;
  coins: number;
  name: string;
  badge?: string;
  reached: boolean;
  claimed: boolean;
  claimedAt?: string;
}

export interface StreakData {
  current: number;
  longest: number;
  totalDays: number;
  frozen: boolean;
  freezeExpiresAt?: string;
  lastActivity: string;
  hasCheckedInToday?: boolean;
  nextMilestone?: {
    day: number;
    coins: number;
    name: string;
  };
  claimableMilestones: StreakMilestone[];
  allMilestones: StreakMilestone[];
}

export interface AllStreaks {
  login: StreakData;
  order: StreakData;
  review: StreakData;
  savings: StreakData;
  savingsTier?: {
    tier: string;
    level: number;
  };
}

export interface StreakStats {
  totalStreaks: number;
  longestStreak: number;
  totalDaysActive: number;
  currentlyActive: number;
  byType: {
    [key: string]: {
      current: number;
      longest: number;
      total: number;
    };
  };
}

class StreakApi {
  private baseUrl = '/gamification';

  /**
   * Get streak status for current user
   * Backend endpoint: GET /gamification/streaks
   */
  async getStreakStatus(type: 'login' | 'order' | 'review' = 'login'): Promise<ApiResponse<StreakData>> {
    try {
      const response = await apiClient.get<AllStreaks>(`${this.baseUrl}/streaks`, { type });

      if (response.success && response.data) {
        // Backend returns { streak (number), currentStreak (number), longestStreak, ... }
        // response.data.streak is a NUMBER, not an object — use response.data directly
        const streakData = (typeof response.data === 'object' && response.data && 'streak' in response.data && typeof (response.data as unknown).streak === 'object')
          ? (response.data as unknown).streak
          : response.data;

        return {
          success: true,
          data: {
            current: streakData.currentStreak || streakData.current || 0,
            longest: streakData.longestStreak || streakData.longest || 0,
            totalDays: streakData.totalDays || 0,
            frozen: streakData.frozen || false,
            freezeExpiresAt: streakData.freezeExpiresAt,
            lastActivity: streakData.lastActivityDate || streakData.lastActivity || new Date().toISOString(),
            hasCheckedInToday: streakData.hasCheckedInToday || false,
            nextMilestone: streakData.nextMilestone,
            claimableMilestones: streakData.claimableMilestones || [],
            allMilestones: streakData.allMilestones || streakData.milestones || [],
          },
        };
      }

      return { success: true, data: this.getDefaultStreak() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all streaks (login, order, review)
   * Backend endpoint: GET /gamification/streaks
   */
  async getAllStreaks(): Promise<ApiResponse<AllStreaks>> {
    try {
      const response = await apiClient.get<AllStreaks>(`${this.baseUrl}/streaks`);

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            login: this.mapStreakData(response.data.login || response.data),
            order: this.mapStreakData(response.data.order),
            review: this.mapStreakData(response.data.review),
            savings: this.mapStreakData(response.data.savings),
            savingsTier: response.data.savingsTier,
          },
        };
      }

      return { success: true, data: { login: this.getDefaultStreak(), order: this.getDefaultStreak(), review: this.getDefaultStreak(), savings: this.getDefaultStreak(), savingsTier: undefined } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Claim daily streak (check-in)
   * Backend endpoint: POST /gamification/streak/checkin
   */
  async claimDailyStreak(type: 'login' | 'order' | 'review' = 'login'): Promise<ApiResponse<{
    streak: StreakData;
    milestoneReached?: {
      day: number;
      coins: number;
      name: string;
      canClaim: boolean;
    };
  }>> {
    try {
      const response = await apiClient.post<{
    streak: StreakData;
    milestoneReached?: {
      day: number;
      coins: number;
      name: string;
      canClaim: boolean;
    };
  }>(`${this.baseUrl}/streak/checkin`, { type });

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            streak: this.mapStreakData(response.data.streak || response.data),
            milestoneReached: response.data.milestoneReached,
          },
        };
      }

      return response;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Claim milestone reward
   * Backend endpoint: POST /gamification/streak/claim-milestone (if exists)
   */
  async claimMilestone(type: 'login' | 'order' | 'review', day: number): Promise<ApiResponse<{
    streak: StreakData;
    rewards: {
      coins: number;
      badge?: string;
      name: string;
    };
  }>> {
    try {
      const response = await apiClient.post<{
    streak: StreakData;
    rewards: {
      coins: number;
      badge?: string;
      name: string;
    };
  }>(`${this.baseUrl}/streak/claim-milestone`, { type, day });

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            streak: this.mapStreakData(response.data.streak || response.data),
            rewards: response.data.rewards || { coins: 0, name: '' },
          },
        };
      }

      return response;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get streak bonuses
   * Backend endpoint: GET /gamification/streak/bonuses
   */
  async getStreakBonuses(): Promise<ApiResponse<StreakMilestone[]>> {
    try {
      const response = await apiClient.get<StreakMilestone[]>(`${this.baseUrl}/streak/bonuses`);

      if (response.success && response.data) {
        const raw = response.data as unknown as { bonuses?: StreakMilestone[]; milestones?: StreakMilestone[] };
        return {
          success: true,
          data: raw.bonuses || raw.milestones || response.data,
        };
      }

      return { success: true, data: [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get milestones (wrapper around getStreakBonuses for compatibility)
   */
  async getMilestones(type: 'login' | 'order' | 'review' = 'login'): Promise<ApiResponse<{
    currentStreak: number;
    milestones: StreakMilestone[];
    nextMilestone?: StreakMilestone;
    claimableMilestones: StreakMilestone[];
  }>> {
    try {
      const [streakResponse, bonusesResponse] = await Promise.all([
        this.getStreakStatus(type),
        this.getStreakBonuses(),
      ]);

      const streak = streakResponse.data || this.getDefaultStreak();
      const milestones = bonusesResponse.data || [];

      return {
        success: true,
        data: {
          currentStreak: streak.current,
          milestones,
          nextMilestone: streak.nextMilestone as StreakMilestone | undefined,
          claimableMilestones: streak.claimableMilestones,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Freeze streak (premium feature) - if backend supports it
   */
  async freezeStreak(type: 'login' | 'order' | 'review', days: number = 1): Promise<ApiResponse<StreakData>> {
    try {
      const response = await apiClient.post<StreakData>(`${this.baseUrl}/streak/freeze`, { type, days });

      if (response.success && response.data) {
        return {
          success: true,
          data: this.mapStreakData((response.data as unknown as { streak?: StreakData }).streak || response.data),
        };
      }

      return response;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get streak statistics from gamification stats
   * Backend endpoint: GET /gamification/stats
   */
  async getStreakStats(): Promise<ApiResponse<StreakStats>> {
    try {
      const response = await apiClient.get<StreakStats>(`${this.baseUrl}/stats`);

      if (response.success && response.data) {
        const raw = response.data as unknown as { streakStats?: StreakStats; streaks?: StreakStats };
        const stats: StreakStats = raw.streakStats || raw.streaks || {
          totalStreaks: 0,
          longestStreak: 0,
          totalDaysActive: 0,
          currentlyActive: 0,
          byType: {},
        };

        return {
          success: true,
          data: {
            totalStreaks: stats.totalStreaks || 0,
            longestStreak: stats.longestStreak || 0,
            totalDaysActive: stats.totalDaysActive || 0,
            currentlyActive: stats.currentlyActive || 0,
            byType: stats.byType || {},
          },
        };
      }

      return { success: true, data: { totalStreaks: 0, longestStreak: 0, totalDaysActive: 0, currentlyActive: 0, byType: {} } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Helper to map streak data from various backend formats
  private mapStreakData(data): StreakData {
    if (!data) return this.getDefaultStreak();

    return {
      current: data.currentStreak || data.current || 0,
      longest: data.longestStreak || data.longest || 0,
      totalDays: data.totalDays || 0,
      frozen: data.frozen || false,
      freezeExpiresAt: data.freezeExpiresAt,
      lastActivity: data.lastActivityDate || data.lastActivity || new Date().toISOString(),
      nextMilestone: data.nextMilestone,
      claimableMilestones: data.claimableMilestones || [],
      allMilestones: data.allMilestones || data.milestones || [],
    };
  }

  // Get default streak object
  private getDefaultStreak(): StreakData {
    return {
      current: 0,
      longest: 0,
      totalDays: 0,
      frozen: false,
      lastActivity: new Date().toISOString(),
      claimableMilestones: [],
      allMilestones: [],
    };
  }
}

export default new StreakApi();

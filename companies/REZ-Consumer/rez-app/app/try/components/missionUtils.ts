/**
 * Mission Visibility & Utility Functions
 * Part of ReZ Try Simplified UX Architecture
 */

import type { Mission } from '@/services/tryApi';

export interface MissionVisibility {
  shouldShow: boolean;
  priority: 'high' | 'medium' | 'low';
  urgency: 'high' | 'medium' | 'none';
}

export type UserEngagementLevel = 'new' | 'active' | 'veteran';

/**
 * Determine if missions should be visible based on mission state and user engagement
 */
export function getMissionVisibility(
  missions: Mission[],
  userEngagementLevel: UserEngagementLevel
): MissionVisibility {
  if (!missions || missions.length === 0) {
    return { shouldShow: false, priority: 'low', urgency: 'none' };
  }

  const incompleteMissions = missions.filter(m => !m.isCompleted && !m.isExpired);
  const urgentMissions = incompleteMissions.filter(m => {
    const hoursLeft = (new Date(m.endsAt).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursLeft < 24;
  });

  if (incompleteMissions.length === 0) {
    return { shouldShow: false, priority: 'low', urgency: 'none' };
  }

  // Adjust priority based on user engagement level
  let priority: 'high' | 'medium' | 'low' = 'medium';
  if (urgentMissions.length > 0) {
    priority = 'high';
  } else if (userEngagementLevel === 'new') {
    // New users always see missions at medium priority minimum
    priority = 'medium';
  } else if (userEngagementLevel === 'veteran') {
    // Veterans only see high priority missions
    const hasValuableMissions = incompleteMissions.some(m => m.reward.rezCoins >= 500);
    priority = hasValuableMissions ? 'high' : 'low';
  }

  return {
    shouldShow: true,
    priority,
    urgency: urgentMissions.length > 0 ? 'high' : urgentMissions.length > 0 ? 'medium' : 'none'
  };
}

/**
 * Get the primary mission for display (most urgent incomplete mission)
 */
export function getPrimaryMission(missions: Mission[]): Mission | null {
  if (!missions || missions.length === 0) return null;

  const incomplete = missions.filter(m => !m.isCompleted && !m.isExpired);
  if (incomplete.length === 0) return null;

  // Sort by urgency (closest end date first)
  return incomplete.sort((a, b) =>
    new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime()
  )[0];
}

/**
 * Get all incomplete (active) missions sorted by urgency
 */
export function getActiveMissions(missions: Mission[]): Mission[] {
  if (!missions || missions.length === 0) return [];

  return missions
    .filter(m => !m.isCompleted && !m.isExpired)
    .sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime());
}

/**
 * Calculate time remaining until mission ends
 */
export function getTimeRemaining(endDate: string): string {
  const now = Date.now();
  const end = new Date(endDate).getTime();
  const diff = end - now;

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  if (minutes > 0) return `${minutes}m left`;
  return 'Ending soon';
}

/**
 * Check if a mission is urgent (less than 24 hours remaining)
 */
export function isMissionUrgent(mission: Mission): boolean {
  const hoursLeft = (new Date(mission.endsAt).getTime() - Date.now()) / (1000 * 60 * 60);
  return hoursLeft < 24 && hoursLeft > 0;
}

/**
 * Get mission progress as a percentage (0-100)
 */
export function getMissionProgress(mission: Mission): number {
  if (mission.target === 0) return 0;
  return Math.min((mission.completed / mission.target) * 100, 100);
}

/**
 * Check if mission is completable (has made some progress)
 */
export function isMissionCompletable(mission: Mission): boolean {
  return mission.completed > 0 && mission.completed < mission.target;
}

/**
 * Format reward display string
 */
export function formatMissionReward(mission: Mission): string {
  const parts: string[] = [];
  if (mission.reward.rezCoins > 0) {
    parts.push(`+${mission.reward.rezCoins} ReZ`);
  }
  if (mission.reward.trialCoins > 0) {
    parts.push(`+${mission.reward.trialCoins} Trial`);
  }
  return parts.join(' ');
}

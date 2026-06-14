/**
 * NBKC Types — Namma Bengaluru Karma Corps
 * Civic participation module types mirroring the karma service API.
 */

export type NBKCMembershipTier = 'citizen' | 'active' | 'civic_leader' | 'ambassador';

export type GreenActionType =
  | 'tree_adoption'
  | 'lake_cleanup'
  | 'composting'
  | 'waste_segregation'
  | 'plastic_cleanup'
  | 'sapling_planting'
  | 'water_conservation'
  | 'energy_saving';

export interface NBKCMembership {
  memberNumber: string;
  tier: NBKCMembershipTier;
  ward: string;
  joinedAt: string;
  totalCivicHours: number;
  missionsCompleted: number;
  stickerIssued: boolean;
  perks: string[];
  isEligibleForSticker: boolean;
}

export interface NBKCStatus {
  isMember: boolean;
  membership?: NBKCMembership;
  greenScore: number;
  greenBengaluruScore: number;
}

export interface NBKCMission {
  id: string;
  name: string;
  description: string;
  category: 'environment' | 'water' | 'waste' | 'civic' | 'community';
  difficulty: 'easy' | 'medium' | 'hard';
  karmaReward: number;
  greenScoreReward: number;
  ward?: string;
  scheduledAt: string;
  maxVolunteers: number;
  currentVolunteers: number;
  status: 'active' | 'completed' | 'cancelled';
  location?: string;
  meetingPoint?: string;
  requirements?: string[];
  impact?: string;
}

export interface MissionEnrollment {
  missionId: string;
  checkedInAt?: string;
  completedAt?: string;
  hoursVolunteered: number;
  karmaEarned: number;
  greenScoreEarned: number;
  verified: boolean;
}

export interface GreenAction {
  actionType: GreenActionType;
  performedAt: string;
  karmaEarned: number;
  ward: string;
  verified: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  memberNumber: string;
  tier: NBKCMembershipTier;
  totalCivicHours: number;
  missionsCompleted: number;
  greenBengaluruScore?: number;
}

export interface JoinMissionsResult {
  success: boolean;
  data?: MissionEnrollment;
}

export interface CompleteMissionResult {
  karmaEarned: number;
  greenEarned: number;
  hoursVolunteered: number;
}

/**
 * Shared Types for Karma Foundation
 * Type definitions for the karma service
 */

// Karma Types
export type KarmaLevel = 'L1' | 'L2' | 'L3' | 'L4';
export type KarmaConversionRate = number;
export type EarnRecordStatus = 'PENDING' | 'APPROVED_PENDING_CONVERSION' | 'CONVERTED' | 'REJECTED' | 'CONVERSION_FAILED' | 'ROLLED_BACK';
export type KarmaEventStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
export type EventCategory = 'environment' | 'food' | 'health' | 'education' | 'community';
export type EventDifficulty = 'easy' | 'medium' | 'hard';

// Karma Score Types (Phase 3: 300-900 model)
export type KarmaScoreBand = 'starter' | 'active' | 'contributor' | 'leader' | 'elite';
export type TrustGrade = 'S' | 'A' | 'B' | 'C' | 'D';
export type MomentumLabel = 'rising' | 'stable' | 'declining';

export interface KarmaScoreComponents {
  engagement: number;
  trust: number;
  impact: number;
  consistency: number;
}

export interface BandMetadata {
  band: KarmaScoreBand;
  label: string;
  color: string;
  minScore: number;
  maxScore: number;
}

// Verification Types
export interface IVerificationSignals {
  qr_in?: boolean;
  qr_out?: boolean;
  gps_match?: number;
  ngo_approved?: boolean;
  photo_proof?: boolean;
}

export type KarmaVerificationStatus = 'pending' | 'verified' | 'partial' | 'rejected';

// Karma Event
export interface IKarmaEvent {
  _id?: string;
  merchantEventId?: string;
  ngoId?: string;
  title?: string;
  category: EventCategory;
  impactUnit?: string;
  impactMultiplier: number;
  difficulty: EventDifficulty;
  expectedDurationHours?: number;
  baseKarmaPerHour: number;
  maxKarmaPerEvent: number;
}

// Karma Profile
export interface IKarmaProfile {
  userId: string;
  lifetimeKarma: number;
  activeKarma: number;
  level: KarmaLevel;
  eventsCompleted: number;
  eventsJoined: number;
  totalHours: number;
  trustScore: number;
  badges: IBadge[];
  lastActivityAt: Date | null;
  levelHistory: ILevelHistoryEntry[];
  conversionHistory: IConversionHistoryEntry[];
  thisWeekKarmaEarned: number;
  weekOfLastKarmaEarned?: Date;
  avgEventDifficulty: number;
  avgConfidenceScore: number;
  checkIns: number;
  approvedCheckIns: number;
  activityHistory: Date[];
  lastDecayAppliedAt?: Date | null;
  currentStreak?: number;
  longestStreak?: number;
}

// Badge
export interface IBadge {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  earnedAt: Date;
}

// Level History Entry
export interface ILevelHistoryEntry {
  level: KarmaLevel;
  earnedAt: Date;
  droppedAt?: Date;
  reason?: string;
}

// Conversion History Entry
export interface IConversionHistoryEntry {
  karmaConverted: number;
  coinsEarned: number;
  rate: number;
  batchId: string;
  convertedAt: Date;
}

// Karma Profile Delta
export interface KarmaProfileDelta {
  activeKarmaChange: number;
  levelChange: boolean;
  oldLevel?: KarmaLevel;
  newLevel?: KarmaLevel;
  lastDecayAppliedAt?: Date;
}

// Level Info
export interface ILevelInfo {
  level: KarmaLevel;
  minKarma: number;
  conversionRate: KarmaConversionRate;
  nextLevelAt: number | null;
  activeKarma: number;
  benefits: string[];
}

// Batch Types
export type BatchStatus = 'DRAFT' | 'READY' | 'PROCESSING' | 'EXECUTED' | 'PARTIAL' | 'PAUSED' | 'FAILED';

export interface BatchRecord {
  _id: string;
  userId: string;
  karmaEarned: number;
  conversionRateSnapshot: number;
  status: EarnRecordStatus;
  estimatedCoins?: number;
  cappedCoins?: number;
}

// QR Code Types
export interface IQRCodeSet {
  eventId: string;
  checkInCode: string;
  checkOutCode: string;
  validFrom: Date;
  validUntil: Date;
  maxUses: number;
  currentUses: number;
}

// Conversion Batch
export interface IConversionBatch {
  _id: string;
  status: BatchStatus;
  totalRecords: number;
  totalKarma: number;
  totalCoins: number;
  executedAt?: Date;
}

// Karma Stats
export interface IKarmaStats {
  lifetimeKarma: number;
  activeKarma: number;
  level: KarmaLevel;
  eventsCompleted: number;
  eventsJoined: number;
  totalHours: number;
  trustScore: number;
  currentStreak: number;
  longestStreak: number;
}

// CSR Pool Types
export type CSRPoolStatus = 'active' | 'inactive' | 'suspended';

export interface CSRPool {
  _id: string;
  name: string;
  coinPoolRemaining: number;
  status: CSRPoolStatus;
}

// Earn Record
export interface IEarnRecord {
  _id: string;
  userId: string;
  eventId: string;
  karmaEarned: number;
  status: EarnRecordStatus;
  verificationSignals: IVerificationSignals;
  confidenceScore: number;
  batchId?: string;
  convertedAt?: Date;
  rezCoinsEarned?: number;
  approvedAt?: Date;
}

// Leaderboard Types
export type LeaderboardScope = 'global' | 'city' | 'cause';
export type LeaderboardPeriod = 'all-time' | 'monthly' | 'weekly';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatar?: string;
  karmaScore: number;
  level: KarmaLevel;
  activeKarma: number;
  eventsCompleted: number;
  percentile: number;
}

// Community Types
export interface CauseCommunity {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: EventCategory;
  coverImage?: string;
  icon?: string;
  followerCount: number;
  isFollowing?: boolean;
}

// Micro Action Types
export interface MicroAction {
  actionKey: string;
  name: string;
  description: string;
  karmaBonus: number;
  icon: string;
  category: 'daily' | 'social' | 'profile' | 'streak' | 'special';
}

export interface UserActionStatus {
  action: MicroAction;
  completed: boolean;
  completedAt?: Date;
  earnedKarma?: number;
}

// Streak Types
export interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  status: 'active' | 'broken';
  lastActivityDate: Date | null;
  activityHistory: Date[];
  nextMilestone: number;
  daysToNextMilestone: number;
}

// Stability Score Types
export interface StabilitySnapshot {
  timestamp: Date;
  score: number;
  components: KarmaScoreComponents;
}

export interface ScoreHistoryEntry {
  timestamp: Date;
  score: number;
  delta: number;
  reason: string;
}

// Perk Types
export type PerkType = 'discount' | 'cashback' | 'freebie' | 'access' | 'badge';
export type PerkClaimStatus = 'available' | 'claimed' | 'expired' | 'used';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

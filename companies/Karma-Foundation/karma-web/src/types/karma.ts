// Karma Types — mirrors the React Native karmaService.ts types
// for the web Next.js application.

export type KarmaLevel = 'L1' | 'L2' | 'L3' | 'L4';

export interface KarmaBadge {
  id: string;
  name: string;
  icon?: string;
  earnedAt: string;
}

export interface KarmaMission {
  id: string;
  type: string;
  name: string;
  description: string;
  requirement: number;
  progress: number;
  isComplete: boolean;
  reward?: { karmaBonus: number; badgeId?: string };
}

export interface LevelInfo {
  level: KarmaLevel;
  activeKarma: number;
  threshold: number;
  nextLevelAt: number;
  conversionRate: number;
  progressPercent: number;
}

export type EventCategory = 'environment' | 'food' | 'health' | 'education' | 'community';
export type KarmaEventStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
export type EventDifficulty = 'easy' | 'medium' | 'hard';

export interface KarmaEvent {
  _id: string;
  name: string;
  description: string;
  category: EventCategory;
  status: KarmaEventStatus;
  image?: string;
  date: string;
  time?: { start: string; end: string };
  location: {
    address: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  };
  organizer: {
    name: string;
    logo?: string;
    ngoId?: string;
  };
  baseKarmaPerHour: number;
  maxKarmaPerEvent: number;
  expectedDurationHours: number;
  impactUnit?: string;
  impactMultiplier?: number;
  difficulty: EventDifficulty;
  capacity?: { goal: number; enrolled: number };
  maxVolunteers: number;
  confirmedVolunteers: number;
  verificationMode: 'qr' | 'gps' | 'manual';
  gpsRadius?: number;
  isJoined?: boolean;
  qrCodes?: { checkIn: string; checkOut: string };
  totalHours?: number;
}

export interface EventFilters {
  category?: string;
  city?: string;
  status?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled';

export interface Booking {
  _id: string;
  eventId: string;
  bookingReference: string;
  status: BookingStatus;
  qrCheckedIn: boolean;
  qrCheckedInAt?: string;
  qrCheckedOut: boolean;
  qrCheckedOutAt?: string;
  gpsCheckIn?: GPSCoords;
  gpsCheckOut?: GPSCoords;
  ngoApproved: boolean;
  confidenceScore: number;
  verificationStatus: 'pending' | 'partial' | 'verified' | 'rejected';
  karmaEarned: number;
  earnedAt?: string;
  createdAt: string;
}

export interface GPSCoords {
  lat: number;
  lng: number;
}

export interface CheckInResult {
  success: boolean;
  booking: Booking;
  confidenceScore: number;
  message: string;
  karmaEarned?: number;
}

export interface CheckOutResult {
  success: boolean;
  booking: Booking;
  confidenceScore: number;
  message: string;
  karmaEarned?: number;
  pendingApproval?: boolean;
}

export type EarnRecordStatus = 'APPROVED_PENDING_CONVERSION' | 'CONVERTED' | 'REJECTED' | 'ROLLED_BACK';

export interface EarnRecord {
  _id: string;
  eventId: string;
  eventName?: string;
  karmaEarned: number;
  activeLevelAtApproval: KarmaLevel;
  conversionRateSnapshot: number;
  status: EarnRecordStatus;
  verificationSignals: {
    qr_in: boolean;
    qr_out: boolean;
    gps_match: boolean;
    ngo_approved: boolean;
    photo_proof: boolean;
  };
  confidenceScore: number;
  createdAt: string;
  approvedAt?: string;
  convertedAt?: string;
  rezCoinsEarned?: number;
}

export interface HistoryResult {
  records: EarnRecord[];
  total: number;
  page: number;
  pages: number;
}

export interface KarmaProfile {
  userId: string;
  lifetimeKarma: number;
  activeKarma: number;
  level: KarmaLevel;
  conversionRate: number;
  eventsCompleted: number;
  totalHours: number;
  trustScore: number;
  badges: KarmaBadge[];
  nextLevelAt: number;
  decayWarning: string | null;
}

export interface WalletBalance {
  karmaPoints: number;
  rezCoins: number;
  brandedCoins?: Record<string, number>;
}

export interface Transaction {
  _id: string;
  type: 'earned' | 'converted' | 'spent' | 'bonus';
  coinType: 'karma_points' | 'rez_coins' | 'branded_coin';
  amount: number;
  description: string;
  eventId?: string;
  batchId?: string;
  createdAt: string;
}

export interface TransactionResult {
  transactions: Transaction[];
  total: number;
  page: number;
  pages: number;
}

export interface Community {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: EventCategory;
  coverImage: string;
  icon: string;
  followerCount: number;
  isFollowing: boolean;
  stats: { eventsHosted: number; totalVolunteers: number; totalHours: number };
  recentPosts: CommunityPost[];
}

export interface CommunityPost {
  _id: string;
  communityId: string;
  authorId: string;
  authorType: 'ngo' | 'volunteer';
  content: string;
  mediaUrls: string[];
  karmaEarned: number;
  likeCount: number;
  commentCount: number;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookingWithEvent extends Booking {
  event: {
    _id: string;
    name: string;
    description: string;
    image?: string;
    date: string;
    time?: { start: string; end: string };
    location?: { address: string; city?: string; coordinates?: { lat: number; lng: number } };
    organizer?: { name: string; logo?: string; ngoId?: string };
    category?: string;
    difficulty?: string;
    expectedDurationHours?: number;
    baseKarmaPerHour?: number;
    maxKarmaPerEvent?: number;
    impactUnit?: string;
    impactMultiplier?: number;
    maxVolunteers?: number;
    confirmedVolunteers?: number;
    status?: string;
  };
}

export interface EventListResponse {
  success: boolean;
  events: KarmaEvent[];
  total: number;
}

export interface MicroAction {
  id: string;
  key: string;
  name: string;
  description: string;
  karmaBonus: number;
  icon: string;
  category: 'daily' | 'social' | 'profile' | 'streak' | 'special';
  isAvailable: boolean;
  isLocked: boolean;
  lockReason?: string;
}

export interface CompletedAction {
  id: string;
  actionKey: string;
  completedAt: string;
  karmaEarned: number;
}

export interface MicroActionsResult {
  available: MicroAction[];
  completed: CompletedAction[];
  earnedToday: number;
  totalAvailable: number;
  totalCompleted: number;
}

export interface ClaimActionResult {
  success: boolean;
  karmaEarned: number;
  totalEarnedToday: number;
  newBadge?: KarmaBadge;
}

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

export interface LeaderboardResult {
  scope: 'global' | 'city' | 'cause';
  period: 'all-time' | 'monthly' | 'weekly';
  entries: LeaderboardEntry[];
  userRank: number | null;
  totalParticipants: number;
  updatedAt: string;
}

export interface UserRankResult {
  rank: number;
  totalParticipants: number;
  percentile: number;
}

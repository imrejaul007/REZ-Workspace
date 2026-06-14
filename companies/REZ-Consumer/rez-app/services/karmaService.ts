/**
 * Karma Service API
 * Handles all Karma feature API calls.
 * Routes through the Rez API Gateway: /karma/* endpoints.
 */

import apiClient, { ApiResponse } from './apiClient';

// =============================================================================
// TYPES
// =============================================================================

export interface KarmaProfile {
  userId: string;
  lifetimeKarma: number;
  activeKarma: number;
  level: 'L1' | 'L2' | 'L3' | 'L4';
  conversionRate: number;
  eventsCompleted: number;
  totalHours: number;
  trustScore: number;
  badges: KarmaBadge[];
  nextLevelAt: number;
  decayWarning: string | null;
}

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
  level: 'L1' | 'L2' | 'L3' | 'L4';
  activeKarma: number;
  threshold: number;
  nextLevelAt: number;
  conversionRate: number;
  progressPercent: number;
}

export interface KarmaEvent {
  _id: string;
  name: string;
  description: string;
  category: 'environment' | 'food' | 'health' | 'education' | 'community';
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
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
  difficulty: 'easy' | 'medium' | 'hard';
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

export interface Booking {
  _id: string;
  eventId: string;
  bookingReference: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled';
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

export interface EarnRecord {
  _id: string;
  eventId: string;
  eventName?: string;
  karmaEarned: number;
  activeLevelAtApproval: 'L1' | 'L2' | 'L3' | 'L4';
  conversionRateSnapshot: number;
  status: 'APPROVED_PENDING_CONVERSION' | 'CONVERTED' | 'REJECTED' | 'ROLLED_BACK';
  verificationSignals: {
    qr_in: boolean;
    qr_out: boolean;
    // FIX: Backend stores gps_match as Number (0-1) for precision. Updated from boolean to number.
    gps_match: number;
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

// =============================================================================
// COMMUNITIES TYPES
// =============================================================================

export interface Community {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: 'environment' | 'food' | 'health' | 'education' | 'community';
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

// =============================================================================
// API SERVICE
// =============================================================================

class KarmaService {
  /**
   * Get user's karma profile
   */
  async getKarmaProfile(userId: string): Promise<ApiResponse<KarmaProfile>> {
    return apiClient.get<KarmaProfile>(`/karma/user/${userId}`);
  }

  /**
   * Get karma level info
   * FIX: Backend route is /api/karma/user/:userId/level, not /karma/level/:userId
   */
  async getKarmaLevel(userId: string): Promise<ApiResponse<LevelInfo>> {
    return apiClient.get<LevelInfo>(`/karma/user/${userId}/level`);
  }

  /**
   * Get single event detail
   */
  async getEventDetail(eventId: string): Promise<ApiResponse<KarmaEvent>> {
    return apiClient.get<KarmaEvent>(`/karma/event/${eventId}`);
  }

  /**
   * Join an event
   */
  async joinEvent(eventId: string): Promise<ApiResponse<Booking>> {
    return apiClient.post<Booking>('/karma/event/join', { eventId });
  }

  /**
   * Cancel event booking
   */
  async leaveEvent(eventId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/karma/event/${eventId}/leave`);
  }

  /**
   * Check in to an event (QR or GPS)
   * FIX: KV-CV-02 — backend requires userId in body; consumer was not sending it.
   */
  async checkIn(
    userId: string,
    eventId: string,
    mode: 'qr' | 'gps',
    qrCode?: string,
    gpsCoords?: GPSCoords,
  ): Promise<ApiResponse<CheckInResult>> {
    const payload: Record<string, unknown> = { userId, eventId, mode };
    if (mode === 'qr' && qrCode) payload.qrCode = qrCode;
    if (mode === 'gps' && gpsCoords) payload.gpsCoords = gpsCoords;
    return apiClient.post<CheckInResult>('/karma/verify/checkin', payload);
  }

  /**
   * Check out from an event (QR or GPS)
   * FIX: KV-CV-02 — backend requires userId in body; consumer was not sending it.
   */
  async checkOut(
    userId: string,
    eventId: string,
    mode: 'qr' | 'gps',
    qrCode?: string,
    gpsCoords?: GPSCoords,
  ): Promise<ApiResponse<CheckOutResult>> {
    const payload: Record<string, unknown> = { userId, eventId, mode };
    if (mode === 'qr' && qrCode) payload.qrCode = qrCode;
    if (mode === 'gps' && gpsCoords) payload.gpsCoords = gpsCoords;
    return apiClient.post<CheckOutResult>('/karma/verify/checkout', payload);
  }

  /**
   * Get karma earn history
   * FIX: Backend route is /api/karma/user/:userId/history, not /karma/history/:userId
   */
  async getKarmaHistory(userId: string, page = 1): Promise<ApiResponse<HistoryResult>> {
    return apiClient.get<HistoryResult>(`/karma/user/${userId}/history`, { page });
  }

  /**
   * Get wallet balance for karma points / rez coins
   */
  async getWalletBalance(coinType: 'karma_points' | 'rez_coins' | 'all' = 'all'): Promise<ApiResponse<WalletBalance>> {
    return apiClient.get<WalletBalance>('/karma/wallet/balance', { coinType });
  }

  /**
   * Get transaction history for karma/coins
   */
  async getTransactions(
    coinType: 'karma_points' | 'rez_coins' | 'branded_coin' | 'all' = 'all',
    page = 1,
  ): Promise<ApiResponse<TransactionResult>> {
    return apiClient.get<TransactionResult>('/karma/wallet/transactions', { coinType, page });
  }

  /**
   * Get user's joined events (bookings) with optional status filter
   */
  async getMyEvents(status?: 'upcoming' | 'ongoing' | 'past'): Promise<ApiResponse<BookingWithEvent[]>> {
    return apiClient.get<BookingWithEvent[]>('/karma/my-bookings', status ? { status } : undefined);
  }

  /**
   * Get active booking for an event
   */
  async getMyBooking(eventId: string): Promise<ApiResponse<Booking | null>> {
    return apiClient.get<Booking | null>(`/karma/booking/${eventId}`);
  }

  /**
   * Get nearby events with filters
   */
  async getNearbyEvents(filters?: EventFilters): Promise<ApiResponse<EventListResponse>> {
    return apiClient.get<EventListResponse>('/karma/events', filters as Record<string, string>);
  }

  /**
   * Get active missions with progress for the authenticated user
   */
  async getMissions(): Promise<ApiResponse<{ success: boolean; missions: KarmaMission[] }>> {
    return apiClient.get<{ success: boolean; missions: KarmaMission[] }>('/karma/missions');
  }

  /**
   * Get all earned badges for the authenticated user
   */
  async getBadges(): Promise<ApiResponse<{ success: boolean; badges: KarmaBadge[] }>> {
    return apiClient.get<{ success: boolean; badges: KarmaBadge[] }>('/karma/badges');
  }

  /**
   * Download the user's Impact Report as a PDF.
   * Returns the raw PDF binary.
   */
  async downloadImpactReport(userName: string): Promise<{ blob: Blob; filename: string }> {
    const token = await this._getToken();
    const params = new URLSearchParams({ name: userName });
    const url = `${process.env.EXPO_PUBLIC_API_URL}/karma/report?${params}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to download report: ${response.status}`);
    }
    const blob = await response.blob();
    const contentDisposition = response.headers.get('content-disposition') ?? '';
    const match = contentDisposition.match(/filename="(.+)"/);
    const filename = match ? match[1] : `ImpactReport_${userName.replace(/\s+/g, '_')}.pdf`;
    return { blob, filename };
  }

  /**
   * Get available micro-actions for the authenticated user
   */
  async getMicroActions(): Promise<ApiResponse<MicroActionsResult>> {
    return apiClient.get<MicroActionsResult>('/karma/micro-actions');
  }

  /**
   * Claim/complete a micro-action and earn karma
   */
  async claimMicroAction(actionKey: string): Promise<ApiResponse<ClaimActionResult>> {
    return apiClient.post<ClaimActionResult>('/karma/micro-actions/claim', { actionKey });
  }

  /**
   * Get leaderboard with specified scope and period
   */
  async getLeaderboard(
    scope: 'global' | 'city' | 'cause',
    period: 'all-time' | 'monthly' | 'weekly',
    limit = 50,
    offset = 0,
  ): Promise<ApiResponse<LeaderboardResult>> {
    return apiClient.get<LeaderboardResult>('/karma/leaderboard', { scope, period, limit, offset });
  }

  /**
   * Get the authenticated user's rank in the specified leaderboard
   */
  async getMyRank(scope: 'global' | 'city' | 'cause', period: 'all-time' | 'monthly' | 'weekly'): Promise<ApiResponse<UserRankResult>> {
    return apiClient.get<UserRankResult>('/karma/leaderboard/my-rank', { scope, period });
  }

  private async _getToken(): Promise<string> {
    const { useAuthStore } = await import('@/stores/authStore');
    const token = useAuthStore.getState().state.token;
    if (!token) throw new Error('Not authenticated');
    return token;
  }

  // =============================================================================
  // COMMUNITIES
  // =============================================================================

  /**
   * Get all communities with optional category filter
   */
  async getCommunities(): Promise<ApiResponse<Community[]>> {
    return apiClient.get<Community[]>('/karma/communities');
  }

  /**
   * Get a single community by slug
   */
  async getCommunity(slug: string): Promise<ApiResponse<Community>> {
    return apiClient.get<Community>(`/karma/communities/${slug}`);
  }

  /**
   * Get community feed/posts with pagination
   */
  async getCommunityFeed(
    slug: string,
    page = 1,
    limit = 20,
  ): Promise<ApiResponse<{ posts: CommunityPost[]; page: number; limit: number }>> {
    return apiClient.get<{ posts: CommunityPost[]; page: number; limit: number }>(
      `/karma/communities/${slug}/feed`,
      { page, limit },
    );
  }

  /**
   * Follow a community
   */
  async followCommunity(slug: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post<{ success: boolean }>(`/karma/communities/${slug}/follow`, {});
  }

  /**
   * Unfollow a community
   */
  async unfollowCommunity(slug: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>(`/karma/communities/${slug}/follow`);
  }

  /**
   * Create a new post in a community
   */
  async createCommunityPost(
    slug: string,
    content: string,
    mediaUrls?: string[],
  ): Promise<ApiResponse<CommunityPost>> {
    return apiClient.post<CommunityPost>(`/karma/communities/${slug}/posts`, { content, mediaUrls });
  }

  /**
   * Get recommended communities for the user
   */
  async getRecommendedCommunities(): Promise<ApiResponse<Community[]>> {
    return apiClient.get<Community[]>('/karma/communities/recommended');
  }

  /**
   * Get communities the user is following
   */
  async getMyCommunities(): Promise<ApiResponse<Community[]>> {
    return apiClient.get<Community[]>('/karma/communities/my');
  }

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

// =============================================================================
// MICRO-ACTIONS TYPES
// =============================================================================

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

// =============================================================================
// LEADERBOARD TYPES
// =============================================================================

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatar?: string;
  karmaScore: number;
  level: 'L1' | 'L2' | 'L3' | 'L4';
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

const karmaService = new KarmaService();
export default karmaService;

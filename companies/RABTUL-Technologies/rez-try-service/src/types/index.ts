/**
 * Type Definitions for REZ Try Service
 */

// Trial Types
export interface Trial {
  _id: string;
  merchantId: string;
  merchantName: string;
  title: string;
  description: string;
  category: string;
  image: string;
  originalPrice: number;
  coinPrice: number;
  commitmentFee: number;
  slotsRemaining: number;
  totalSlots: number;
  expiresAt: Date;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  rating?: number;
  ratingCount?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Booking Types
export interface Booking {
  _id: string;
  userId: string;
  trialId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  bookedAt: Date;
  completedAt?: Date;
  qrCode: string;
  coinEarned: number;
  reviewSubmitted: boolean;
}

export interface BookingCreate {
  trialId: string;
  userId: string;
}

// Explorer Score Types
export interface ExplorerProfile {
  _id: string;
  userId: string;
  score: number;
  tier: 'Curious' | 'Explorer' | 'Adventurer' | 'Conqueror';
  stats: {
    trialsCompleted: number;
    reviewsWritten: number;
    campaignsJoined: number;
    referrals: number;
    currentStreak: number;
    longestStreak: number;
    lastActivityAt?: Date;
  };
  badges: ExplorerBadge[];
  leaderboardRank?: number;
  leaderboardPercentile?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExplorerBadge {
  id: string;
  name: string;
  icon: string;
  earnedAt: Date;
}

export interface ExplorerStats {
  score: number;
  tier: string;
  stats: ExplorerProfile['stats'];
  leaderboardPercentile?: number;
}

// Campaign Types
export interface Campaign {
  _id: string;
  merchantId: string;
  merchantName: string;
  title: string;
  description: string;
  image: string;
  goal: string;
  reward: string;
  startsAt: Date;
  endsAt: Date;
  progress?: {
    completed: number;
    target: number;
  };
  isActive: boolean;
  createdAt: Date;
}

// Bundle Types
export interface Bundle {
  _id: string;
  title: string;
  description: string;
  image: string;
  trials: string[]; // Trial IDs
  price: number;
  originalPrice: number;
  coinsBonus: number;
  validityDays: number;
  isActive: boolean;
}

// Coin Types
export interface CoinTransaction {
  _id: string;
  userId: string;
  amount: number;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus';
  source: 'trial_completion' | 'review' | 'campaign' | 'referral' | 'bundle_purchase' | 'manual';
  referenceId?: string;
  description: string;
  createdAt: Date;
}

export interface CoinBalance {
  userId: string;
  totalBalance: number;
  pendingBalance: number;
  lifetimeEarned: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// CorpID Types for Mobile App

export interface CorpIdUser {
  corpId: string;
  entityType: 'INDIVIDUAL' | 'EMPLOYER' | 'INSTITUTION' | 'GOVERNMENT';
  status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'SUSPENDED';
  verificationLevel: number; // 1-5
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface CIScore {
  corpId: string;
  score: number; // 0-1000
  tier: 'UNVERIFIED' | 'BASIC' | 'VERIFIED' | 'PREMIUM' | 'ELITE';
  breakdown: {
    identity: number; // 0-200
    employment: number; // 0-200
    skills: number; // 0-200
    reputation: number; // 0-200
    compliance: number; // 0-200
    references: number; // 0-200
  };
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
}

export interface VerificationRequest {
  id: string;
  type: 'identity' | 'employment' | 'skills' | 'education' | 'reference';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  verifiedAt?: string;
  documents: string[];
  verifiedBy?: string;
}

export interface PassportEntry {
  id: string;
  type: 'education' | 'employment' | 'certification' | 'award' | 'project';
  title: string;
  organization: string;
  startDate: string;
  endDate?: string;
  description: string;
  verified: boolean;
  verifiedAt?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  category: 'trust' | 'achievement' | 'verification' | 'engagement';
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface TrustConnection {
  corpId: string;
  name: string;
  relationship: 'employer' | 'employee' | 'colleague' | 'institution' | 'partner';
  trustLevel: number; // 0-100
  connectedAt: string;
}

export interface Notification {
  id: string;
  type: 'verification' | 'score_update' | 'badge_earned' | 'connection' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
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

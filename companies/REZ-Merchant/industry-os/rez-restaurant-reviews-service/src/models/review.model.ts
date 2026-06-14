/**
 * Restaurant Reviews Service - Data Models
 */

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type ReviewSentiment = 'positive' | 'neutral' | 'negative';

export interface Review {
  id: string;
  restaurantId: string;
  customerId: string;
  customerName: string;
  rating: number;
  title?: string;
  comment: string;
  foodRating?: number;
  serviceRating?: number;
  ambienceRating?: number;
  valueRating?: number;
  photos?: string[];
  pros?: string[];
  cons?: string[];
  visitDate: Date;
  orderDetails?: {
    items: string[];
    totalAmount: number;
  };
  isVerifiedVisit: boolean;
  isHelpful: number;
  sentiment?: ReviewSentiment;
  sentimentScore?: number;
  response?: {
    text: string;
    respondedAt: Date;
    respondedBy: string;
  };
  status: ReviewStatus;
  moderationNotes?: string;
  flaggedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewFilters {
  restaurantId?: string;
  minRating?: number;
  maxRating?: number;
  status?: ReviewStatus;
  startDate?: Date;
  endDate?: Date;
  isVerifiedVisit?: boolean;
  sentiment?: ReviewSentiment;
}

export interface ReviewStats {
  totalReviews: number;
  approvedReviews: number;
  averageRating: number;
  averageFoodRating?: number;
  averageServiceRating?: number;
  averageAmbienceRating?: number;
  averageValueRating?: number;
  ratingDistribution: Record<number, number>;
  verifiedVisits: number;
  responseRate: number;
  sentimentBreakdown: Record<ReviewSentiment, number>;
  recentTrend: number; // Rating trend over last 7 days
}

export interface ReviewAnalytics {
  restaurantId: string;
  period: string;
  stats: ReviewStats;
  topKeywords: Array<{ keyword: string; count: number }>;
  responseTimeAvg?: number; // Average hours to respond
  conversionRate?: number; // Reviews per 100 orders
}

export interface ReviewReport {
  restaurantId: string;
  period: string;
  totalReviews: number;
  newReviews: number;
  avgRating: number;
  ratingChange: number; // vs previous period
  topPositiveKeywords: string[];
  topNegativeKeywords: string[];
  responseRate: number;
  highlights: {
    mostHelpful: Review;
    highestRated: Review;
    lowestRated: Review;
  };
}

export interface ReviewResponse {
  id: string;
  reviewId: string;
  managerId: string;
  managerName: string;
  text: string;
  createdAt: Date;
}

export interface ReviewReportIssue {
  id: string;
  reviewId: string;
  restaurantId: string;
  type: 'food_quality' | 'service' | 'cleanliness' | 'pricing' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'investigating' | 'resolved';
  createdAt: Date;
  resolvedAt?: Date;
}

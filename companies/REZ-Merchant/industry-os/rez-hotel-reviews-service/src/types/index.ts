/**
 * REZ Hotel Reviews Service Types
 */

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
}

export enum Sentiment {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}

export enum TravelType {
  BUSINESS = 'business',
  LEISURE = 'leisure',
  COUPLE = 'couple',
  FAMILY = 'family',
  SOLO = 'solo',
}

export interface ReviewCategory {
  name: string;
  rating: number;
  maxRating: number;
}

export interface Review {
  id: string;
  bookingId: string;
  hotelId: string;
  guestId: string;
  guestName: string;
  overallRating: number;
  categories: {
    cleanliness?: number;
    service?: number;
    location?: number;
    value?: number;
    amenities?: number;
    comfort?: number;
    staff?: number;
    food?: number;
    [key: string]: number | undefined;
  };
  title?: string;
  content: string;
  images?: string[];
  stayDate?: string;
  wouldRecommend: boolean;
  travelType?: TravelType;
  status: ReviewStatus;
  sentiment?: Sentiment;
  sentimentScore?: number;
  helpful: number;
  reportCount: number;
  managerResponse?: {
    content: string;
    managerName?: string;
    respondedAt: string;
  };
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewInput {
  bookingId: string;
  hotelId: string;
  guestId: string;
  guestName: string;
  overallRating: number;
  categories?: Partial<Review['categories']>;
  title?: string;
  content: string;
  images?: string[];
  stayDate?: string;
  wouldRecommend?: boolean;
  travelType?: TravelType;
}

export interface UpdateReviewInput {
  overallRating?: number;
  categories?: Partial<Review['categories']>;
  title?: string;
  content?: string;
  images?: string[];
  wouldRecommend?: boolean;
  travelType?: TravelType;
  status?: ReviewStatus;
  isPublic?: boolean;
}

export interface RespondToReviewInput {
  response: string;
  managerName?: string;
}

export interface ModerateReviewInput {
  status: ReviewStatus;
  isPublic?: boolean;
}

export interface ReviewAnalytics {
  hotelId: string;
  overallRating: number;
  totalReviews: number;
  averageRatings: {
    cleanliness?: number;
    service?: number;
    location?: number;
    value?: number;
    amenities?: number;
    comfort?: number;
    staff?: number;
    food?: number;
  };
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  recommendationRate: number;
  travelTypeBreakdown: {
    business: number;
    leisure: number;
    couple: number;
    family: number;
    solo: number;
  };
  recentTrend: {
    period: string;
    avgRating: number;
    reviewCount: number;
    change: number;
  };
}

export interface HotelRating {
  hotelId: string;
  overallRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  categoryAverages?: {
    cleanliness?: number;
    service?: number;
    location?: number;
    value?: number;
    amenities?: number;
  };
}

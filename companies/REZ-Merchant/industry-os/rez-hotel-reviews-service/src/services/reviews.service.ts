/**
 * REZ Hotel Reviews Service
 * In-memory data store for guest reviews and ratings
 */

import { v4 as uuidv4 } from 'uuid';

// Types
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
  COUPLE = 'couple',
  FAMILY = 'family',
  SOLO = 'solo',
  FRIENDS = 'friends',
}

export interface ReviewCategories {
  cleanliness?: number;
  service?: number;
  location?: number;
  value?: number;
  amenities?: number;
  food?: number;
  staff?: number;
}

export interface HotelResponse {
  response: string;
  managerName?: string;
  respondedAt: Date;
}

export interface Review {
  reviewId: string;
  bookingId: string;
  hotelId: string;
  guestId: string;
  guestName: string;
  overallRating: number;
  categories: ReviewCategories;
  title?: string;
  content: string;
  images: string[];
  stayDate: Date | null;
  wouldRecommend?: boolean;
  travelType?: TravelType;
  status: ReviewStatus;
  sentiment: Sentiment;
  sentimentScore: number;
  hotelResponse?: HotelResponse;
  helpful: number;
  reportCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HotelRating {
  hotelId: string;
  overallRating: number;
  totalReviews: number;
  categoryAverages: Record<keyof ReviewCategories, number>;
  ratingDistribution: Record<number, number>;
  lastUpdated: Date;
}

// In-memory data stores
const reviews = new Map<string, Review>();
const hotelRatings = new Map<string, HotelRating>();

// Helper functions
function generateReviewId(): string {
  return `REV-${uuidv4().slice(0, 8).toUpperCase()}`;
}

// Sentiment analysis (simple keyword-based)
function analyzeSentiment(text: string): { sentiment: Sentiment; score: number } {
  const positiveWords = [
    'excellent', 'amazing', 'great', 'wonderful', 'fantastic', 'perfect', 'best',
    'loved', 'beautiful', 'recommend', 'clean', 'friendly', 'comfortable', 'superb',
    'outstanding', 'exceptional', 'delightful', 'impressive', 'brilliant', 'lovely'
  ];
  const negativeWords = [
    'terrible', 'awful', 'horrible', 'bad', 'worst', 'disappointing', 'poor',
    'dirty', 'rude', 'never', 'disgusting', 'unacceptable', 'nightmare', 'avoid',
    'broken', 'noisy', 'smelly', 'uncomfortable', 'overpriced', 'mediocre'
  ];

  const lowerText = text.toLowerCase();
  let score = 0;

  for (const word of positiveWords) {
    if (lowerText.includes(word)) score += 1;
  }
  for (const word of negativeWords) {
    if (lowerText.includes(word)) score -= 1;
  }

  const normalizedScore = Math.max(-1, Math.min(1, score / Math.max(lowerText.split(/\s+/).length, 1) * 10));

  let sentiment: Sentiment;
  if (normalizedScore > 0.2) {
    sentiment = Sentiment.POSITIVE;
  } else if (normalizedScore < -0.2) {
    sentiment = Sentiment.NEGATIVE;
  } else {
    sentiment = Sentiment.NEUTRAL;
  }

  return { sentiment, score: normalizedScore };
}

// Review Functions
export function createReview(
  bookingId: string,
  hotelId: string,
  guestId: string,
  guestName: string,
  overallRating: number,
  content: string,
  categories?: ReviewCategories,
  title?: string,
  images?: string[],
  stayDate?: string,
  wouldRecommend?: boolean,
  travelType?: TravelType
): Review {
  const reviewId = generateReviewId();
  const now = new Date();
  const { sentiment, score } = analyzeSentiment(content);

  const review: Review = {
    reviewId,
    bookingId,
    hotelId,
    guestId,
    guestName,
    overallRating,
    categories: categories || {},
    title,
    content,
    images: images || [],
    stayDate: stayDate ? new Date(stayDate) : null,
    wouldRecommend,
    travelType,
    status: ReviewStatus.PENDING,
    sentiment,
    sentimentScore: score,
    helpful: 0,
    reportCount: 0,
    isPublic: false,
    createdAt: now,
    updatedAt: now,
  };

  reviews.set(reviewId, review);
  return review;
}

export function getReview(reviewId: string): Review | undefined {
  return reviews.get(reviewId);
}

export function getReviewByBooking(bookingId: string): Review | undefined {
  for (const review of reviews.values()) {
    if (review.bookingId === bookingId) {
      return review;
    }
  }
  return undefined;
}

export function getReviewsByHotel(hotelId: string, includePrivate = false): Review[] {
  const result: Review[] = [];
  for (const review of reviews.values()) {
    if (review.hotelId === hotelId && (includePrivate || review.isPublic)) {
      result.push(review);
    }
  }
  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getApprovedReviewsByHotel(hotelId: string): Review[] {
  return getReviewsByHotel(hotelId).filter(r => r.status === ReviewStatus.APPROVED);
}

export function moderateReview(
  reviewId: string,
  status: ReviewStatus,
  isPublic?: boolean
): Review | undefined {
  const review = reviews.get(reviewId);
  if (!review) return undefined;

  review.status = status;
  if (isPublic !== undefined) {
    review.isPublic = isPublic;
  } else if (status === ReviewStatus.APPROVED) {
    review.isPublic = true;
  }
  review.updatedAt = new Date();

  reviews.set(reviewId, review);

  // Update hotel rating if approved
  if (status === ReviewStatus.APPROVED) {
    updateHotelRating(review.hotelId);
  }

  return review;
}

export function respondToReview(
  reviewId: string,
  response: string,
  managerName?: string
): Review | undefined {
  const review = reviews.get(reviewId);
  if (!review) return undefined;

  review.hotelResponse = {
    response,
    managerName,
    respondedAt: new Date(),
  };
  review.updatedAt = new Date();

  reviews.set(reviewId, review);
  return review;
}

export function markHelpful(reviewId: string): Review | undefined {
  const review = reviews.get(reviewId);
  if (!review) return undefined;

  review.helpful++;
  reviews.set(reviewId, review);
  return review;
}

export function reportReview(reviewId: string): Review | undefined {
  const review = reviews.get(reviewId);
  if (!review) return undefined;

  review.reportCount++;
  if (review.reportCount >= 3) {
    review.status = ReviewStatus.FLAGGED;
  }
  reviews.set(reviewId, review);
  return review;
}

// Hotel Rating Functions
function updateHotelRating(hotelId: string): void {
  const approvedReviews = getApprovedReviewsByHotel(hotelId);

  if (approvedReviews.length === 0) {
    hotelRatings.delete(hotelId);
    return;
  }

  const totalRating = approvedReviews.reduce((sum, r) => sum + r.overallRating, 0);
  const avgRating = Math.round((totalRating / approvedReviews.length) * 10) / 10;

  const categoryAverages: Record<string, number> = {
    cleanliness: 0,
    service: 0,
    location: 0,
    value: 0,
    amenities: 0,
    food: 0,
    staff: 0,
  };

  const categories = ['cleanliness', 'service', 'location', 'value', 'amenities', 'food', 'staff'] as const;

  for (const cat of categories) {
    const values = approvedReviews
      .filter(r => r.categories[cat] !== undefined)
      .map(r => r.categories[cat] as number);

    if (values.length > 0) {
      categoryAverages[cat] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
    }
  }

  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const review of approvedReviews) {
    const roundedRating = Math.round(review.overallRating) as keyof typeof ratingDistribution;
    ratingDistribution[roundedRating]++;
  }

  hotelRatings.set(hotelId, {
    hotelId,
    overallRating: avgRating,
    totalReviews: approvedReviews.length,
    categoryAverages: categoryAverages as Record<keyof ReviewCategories, number>,
    ratingDistribution,
    lastUpdated: new Date(),
  });
}

export function getHotelRating(hotelId: string): HotelRating | undefined {
  // Ensure rating is up to date
  updateHotelRating(hotelId);
  return hotelRatings.get(hotelId);
}

// Analytics
export function getReviewAnalytics(hotelId: string): {
  rating: number;
  totalReviews: number;
  categoryAverages: Record<string, number>;
  ratingDistribution: Record<number, number>;
  sentimentBreakdown: Record<Sentiment, number>;
  recommendRate: number;
  recentTrend: Array<{ month: string; avgRating: number; count: number }>;
} {
  const approvedReviews = getApprovedReviewsByHotel(hotelId);
  const hotelRating = getHotelRating(hotelId);

  const sentimentBreakdown: Record<Sentiment, number> = {
    [Sentiment.POSITIVE]: 0,
    [Sentiment.NEUTRAL]: 0,
    [Sentiment.NEGATIVE]: 0,
  };

  for (const review of approvedReviews) {
    sentimentBreakdown[review.sentiment]++;
  }

  const recommendCount = approvedReviews.filter(r => r.wouldRecommend === true).length;
  const recommendRate = approvedReviews.length > 0
    ? Math.round((recommendCount / approvedReviews.length) * 100)
    : 0;

  // Calculate recent trend (last 3 months)
  const recentTrend: Array<{ month: string; avgRating: number; count: number }> = [];
  const now = new Date();

  for (let i = 2; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = monthDate.toISOString().slice(0, 7);

    const monthReviews = approvedReviews.filter(r => {
      const reviewMonth = r.createdAt.toISOString().slice(0, 7);
      return reviewMonth === monthStr;
    });

    const avgRating = monthReviews.length > 0
      ? monthReviews.reduce((sum, r) => sum + r.overallRating, 0) / monthReviews.length
      : 0;

    recentTrend.push({
      month: monthStr,
      avgRating: Math.round(avgRating * 10) / 10,
      count: monthReviews.length,
    });
  }

  return {
    rating: hotelRating?.overallRating || 0,
    totalReviews: approvedReviews.length,
    categoryAverages: hotelRating?.categoryAverages || {},
    ratingDistribution: hotelRating?.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    sentimentBreakdown,
    recommendRate,
    recentTrend,
  };
}

// Reset function for testing
export function resetStore(): void {
  reviews.clear();
  hotelRatings.clear();
}

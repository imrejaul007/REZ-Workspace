/**
 * Restaurant Reviews Service - Business Logic
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Review,
  ReviewStatus,
  ReviewSentiment,
  ReviewFilters,
  ReviewStats,
  ReviewAnalytics,
  ReviewReport,
} from '../models/review.model.js';
import { REVIEW_SETTINGS, SENTIMENT_KEYWORDS } from '../config/index.js';

// Re-export for use in routes
export { REVIEW_SETTINGS } from '../config/index.js';

// In-memory stores
const reviews = new Map<string, Review>();

/**
 * Generate unique IDs
 */
function generateId(prefix: string): string {
  return `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`;
}

/**
 * Analyze sentiment of comment text
 */
function analyzeSentiment(comment: string): { sentiment: ReviewSentiment; score: number } {
  const lowerComment = comment.toLowerCase();

  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  // Count keyword matches
  if (SENTIMENT_KEYWORDS.positive.some(kw => lowerComment.includes(kw))) {
    positiveCount++;
  }
  if (SENTIMENT_KEYWORDS.negative.some(kw => lowerComment.includes(kw))) {
    negativeCount++;
  }
  if (SENTIMENT_KEYWORDS.neutral.some(kw => lowerComment.includes(kw))) {
    neutralCount++;
  }

  // Calculate score based on keyword presence
  const wordCount = lowerComment.split(/\s+/).length;
  const score = (positiveCount - negativeCount) / Math.max(wordCount, 1) * 10;
  const normalizedScore = Math.max(-1, Math.min(1, score));

  let sentiment: ReviewSentiment;
  if (normalizedScore > 0.2) {
    sentiment = 'positive';
  } else if (normalizedScore < -0.2) {
    sentiment = 'negative';
  } else {
    sentiment = 'neutral';
  }

  return { sentiment, score: normalizedScore };
}

/**
 * Determine initial status based on rating
 */
function determineInitialStatus(rating: number): ReviewStatus {
  if (rating >= REVIEW_SETTINGS.autoApproveThreshold) {
    return 'approved';
  }
  if (rating <= REVIEW_SETTINGS.moderationQueueThreshold) {
    return 'pending'; // Will be flagged for moderation
  }
  return 'pending';
}

// ============ Review Management ============

export function createReview(data: {
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
  orderDetails?: { items: string[]; totalAmount: number };
  isVerifiedVisit: boolean;
}): Review {
  const { sentiment, score } = analyzeSentiment(data.comment);

  const review: Review = {
    id: generateId('REV'),
    ...data,
    rating: Math.max(REVIEW_SETTINGS.minRating, Math.min(REVIEW_SETTINGS.maxRating, data.rating)),
    foodRating: data.foodRating ? Math.max(1, Math.min(5, data.foodRating)) : undefined,
    serviceRating: data.serviceRating ? Math.max(1, Math.min(5, data.serviceRating)) : undefined,
    ambienceRating: data.ambienceRating ? Math.max(1, Math.min(5, data.ambienceRating)) : undefined,
    valueRating: data.valueRating ? Math.max(1, Math.min(5, data.valueRating)) : undefined,
    isHelpful: 0,
    sentiment,
    sentimentScore: score,
    status: determineInitialStatus(data.rating),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  reviews.set(review.id, review);
  return review;
}

export function getReview(reviewId: string): Review | undefined {
  return reviews.get(reviewId);
}

export function getReviews(filters?: ReviewFilters): Review[] {
  let result = Array.from(reviews.values());

  if (filters?.restaurantId) {
    result = result.filter(r => r.restaurantId === filters.restaurantId);
  }
  if (filters?.status) {
    result = result.filter(r => r.status === filters.status);
  }
  if (filters?.minRating !== undefined) {
    result = result.filter(r => r.rating >= filters.minRating!);
  }
  if (filters?.maxRating !== undefined) {
    result = result.filter(r => r.rating <= filters.maxRating!);
  }
  if (filters?.isVerifiedVisit !== undefined) {
    result = result.filter(r => r.isVerifiedVisit === filters.isVerifiedVisit);
  }
  if (filters?.sentiment) {
    result = result.filter(r => r.sentiment === filters.sentiment);
  }
  if (filters?.startDate) {
    result = result.filter(r => r.createdAt >= filters.startDate!);
  }
  if (filters?.endDate) {
    result = result.filter(r => r.createdAt <= filters.endDate!);
  }

  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getReviewsByRestaurant(restaurantId: string, filters?: Omit<ReviewFilters, 'restaurantId'>): Review[] {
  return getReviews({ restaurantId, ...filters });
}

// ============ Review Actions ============

export function approveReview(reviewId: string): Review | undefined {
  const review = reviews.get(reviewId);
  if (!review) return undefined;
  if (review.status === 'rejected') return undefined;

  review.status = 'approved';
  review.updatedAt = new Date();
  reviews.set(reviewId, review);
  return review;
}

export function rejectReview(reviewId: string, reason?: string): Review | undefined {
  const review = reviews.get(reviewId);
  if (!review) return undefined;

  review.status = 'rejected';
  review.moderationNotes = reason;
  review.updatedAt = new Date();
  reviews.set(reviewId, review);
  return review;
}

export function flagReview(reviewId: string, reason: string): Review | undefined {
  const review = reviews.get(reviewId);
  if (!review) return undefined;

  review.status = 'flagged';
  review.flaggedReason = reason;
  review.updatedAt = new Date();
  reviews.set(reviewId, review);
  return review;
}

export function addResponse(reviewId: string, text: string, respondedBy: string, _managerName: string): Review | undefined {
  const review = reviews.get(reviewId);
  if (!review) return undefined;

  review.response = {
    text,
    respondedAt: new Date(),
    respondedBy,
  };
  review.updatedAt = new Date();
  reviews.set(reviewId, review);
  return review;
}

export function markHelpful(reviewId: string): Review | undefined {
  const review = reviews.get(reviewId);
  if (!review) return undefined;

  review.isHelpful += REVIEW_SETTINGS.helpfulVoteBonus;
  review.updatedAt = new Date();
  reviews.set(reviewId, review);
  return review;
}

export function updateReview(reviewId: string, updates: Partial<Pick<Review, 'title' | 'comment' | 'photos' | 'pros' | 'cons'>>): Review | undefined {
  const review = reviews.get(reviewId);
  if (!review) return undefined;

  if (updates.title !== undefined) review.title = updates.title;
  if (updates.comment !== undefined) {
    review.comment = updates.comment;
    const { sentiment, score } = analyzeSentiment(updates.comment);
    review.sentiment = sentiment;
    review.sentimentScore = score;
  }
  if (updates.photos !== undefined) review.photos = updates.photos;
  if (updates.pros !== undefined) review.pros = updates.pros;
  if (updates.cons !== undefined) review.cons = updates.cons;

  review.updatedAt = new Date();
  reviews.set(reviewId, review);
  return review;
}

export function deleteReview(reviewId: string): boolean {
  return reviews.delete(reviewId);
}

// ============ Query Functions ============

export function getTopReviews(restaurantId: string, limit: number = 5): Review[] {
  return getReviewsByRestaurant(restaurantId, { status: 'approved' })
    .sort((a, b) => b.isHelpful - a.isHelpful)
    .slice(0, limit);
}

export function getRecentReviews(restaurantId: string, limit: number = 10): Review[] {
  return getReviewsByRestaurant(restaurantId, { status: 'approved' }).slice(0, limit);
}

export function getCriticalReviews(restaurantId: string): Review[] {
  return getReviewsByRestaurant(restaurantId, { maxRating: 2, status: 'approved' });
}

export function getPendingModeration(restaurantId: string): Review[] {
  return getReviewsByRestaurant(restaurantId, { status: 'pending' });
}

// ============ Statistics ============

export function getReviewStats(restaurantId: string): ReviewStats {
  const approved = getReviewsByRestaurant(restaurantId, { status: 'approved' });

  if (approved.length === 0) {
    return {
      totalReviews: reviews.size,
      approvedReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      verifiedVisits: 0,
      responseRate: 0,
      sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
      recentTrend: 0,
    };
  }

  // Calculate averages
  const totalRating = approved.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = totalRating / approved.length;

  // Rating distribution
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  approved.forEach(r => ratingDistribution[r.rating]++);

  // Sub-rating averages
  const withFood = approved.filter(r => r.foodRating !== undefined);
  const withService = approved.filter(r => r.serviceRating !== undefined);
  const withAmbience = approved.filter(r => r.ambienceRating !== undefined);
  const withValue = approved.filter(r => r.valueRating !== undefined);

  // Verified visits
  const verifiedVisits = approved.filter(r => r.isVerifiedVisit).length;

  // Response rate
  const respondedReviews = approved.filter(r => r.response).length;
  const responseRate = (respondedReviews / approved.length) * 100;

  // Sentiment breakdown
  const sentimentBreakdown: Record<ReviewSentiment, number> = { positive: 0, neutral: 0, negative: 0 };
  approved.forEach(r => {
    if (r.sentiment) sentimentBreakdown[r.sentiment]++;
  });

  // Recent trend (compare last 7 days to previous 7 days)
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recentReviews = approved.filter(r => r.createdAt >= oneWeekAgo);
  const previousReviews = approved.filter(r => r.createdAt >= twoWeeksAgo && r.createdAt < oneWeekAgo);

  const recentAvg = recentReviews.length > 0
    ? recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length
    : 0;
  const previousAvg = previousReviews.length > 0
    ? previousReviews.reduce((sum, r) => sum + r.rating, 0) / previousReviews.length
    : 0;

  const recentTrend = Math.round((recentAvg - previousAvg) * 10) / 10;

  return {
    totalReviews: reviews.size,
    approvedReviews: approved.length,
    averageRating: Math.round(avgRating * 10) / 10,
    averageFoodRating: withFood.length > 0
      ? Math.round(withFood.reduce((sum, r) => sum + (r.foodRating || 0), 0) / withFood.length * 10) / 10
      : undefined,
    averageServiceRating: withService.length > 0
      ? Math.round(withService.reduce((sum, r) => sum + (r.serviceRating || 0), 0) / withService.length * 10) / 10
      : undefined,
    averageAmbienceRating: withAmbience.length > 0
      ? Math.round(withAmbience.reduce((sum, r) => sum + (r.ambienceRating || 0), 0) / withAmbience.length * 10) / 10
      : undefined,
    averageValueRating: withValue.length > 0
      ? Math.round(withValue.reduce((sum, r) => sum + (r.valueRating || 0), 0) / withValue.length * 10) / 10
      : undefined,
    ratingDistribution,
    verifiedVisits,
    responseRate: Math.round(responseRate),
    sentimentBreakdown,
    recentTrend,
  };
}

export function getReviewAnalytics(restaurantId: string, periodDays: number = 30): ReviewAnalytics {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - periodDays);

  const periodReviews = getReviewsByRestaurant(restaurantId, {
    status: 'approved',
    startDate: cutoffDate,
  });

  // Extract top keywords
  const keywordCounts: Record<string, number> = {};
  const allKeywords = [...SENTIMENT_KEYWORDS.positive, ...SENTIMENT_KEYWORDS.negative, ...SENTIMENT_KEYWORDS.neutral];

  for (const review of periodReviews) {
    const lowerComment = review.comment.toLowerCase();
    for (const keyword of allKeywords) {
      if (lowerComment.includes(keyword)) {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      }
    }
  }

  const topKeywords = Object.entries(keywordCounts)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Response time
  const respondedReviews = periodReviews.filter(r => r.response);
  const responseTimes = respondedReviews.map(r => {
    return (r.response!.respondedAt.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60); // hours
  });
  const responseTimeAvg = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : undefined;

  return {
    restaurantId,
    period: `${periodDays} days`,
    stats: getReviewStats(restaurantId),
    topKeywords,
    responseTimeAvg,
  };
}

export function getReviewReport(restaurantId: string, periodDays: number = 30): ReviewReport {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - periodDays);

  const previousCutoff = new Date(cutoffDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

  const periodReviews = getReviewsByRestaurant(restaurantId, {
    status: 'approved',
    startDate: cutoffDate,
  });

  const previousReviews = getReviewsByRestaurant(restaurantId, {
    status: 'approved',
    startDate: previousCutoff,
    endDate: cutoffDate,
  });

  // Calculate rating changes
  const periodAvg = periodReviews.length > 0
    ? periodReviews.reduce((sum, r) => sum + r.rating, 0) / periodReviews.length
    : 0;
  const previousAvg = previousReviews.length > 0
    ? previousReviews.reduce((sum, r) => sum + r.rating, 0) / previousReviews.length
    : 0;
  const ratingChange = Math.round((periodAvg - previousAvg) * 10) / 10;

  // Top keywords
  const allKeywords = [...SENTIMENT_KEYWORDS.positive, ...SENTIMENT_KEYWORDS.negative];
  const keywordCounts: Record<string, number> = {};

  for (const review of periodReviews) {
    const lowerComment = review.comment.toLowerCase();
    for (const keyword of allKeywords) {
      if (lowerComment.includes(keyword)) {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      }
    }
  }

  const sortedKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1]);

  const topPositiveKeywords = sortedKeywords
    .filter(([kw]) => SENTIMENT_KEYWORDS.positive.includes(kw))
    .slice(0, 5)
    .map(([kw]) => kw);

  const topNegativeKeywords = sortedKeywords
    .filter(([kw]) => SENTIMENT_KEYWORDS.negative.includes(kw))
    .slice(0, 5)
    .map(([kw]) => kw);

  // Response rate
  const responseRate = periodReviews.length > 0
    ? (periodReviews.filter(r => r.response).length / periodReviews.length) * 100
    : 0;

  // Highlights
  const mostHelpful = periodReviews.sort((a, b) => b.isHelpful - a.isHelpful)[0];
  const highestRated = periodReviews.sort((a, b) => b.rating - a.rating)[0];
  const lowestRated = periodReviews.sort((a, b) => a.rating - b.rating)[0];

  return {
    restaurantId,
    period: `${periodDays} days`,
    totalReviews: periodReviews.length,
    newReviews: periodReviews.length,
    avgRating: Math.round(periodAvg * 10) / 10,
    ratingChange,
    topPositiveKeywords,
    topNegativeKeywords,
    responseRate: Math.round(responseRate),
    highlights: {
      mostHelpful: mostHelpful || {} as Review,
      highestRated: highestRated || {} as Review,
      lowestRated: lowestRated || {} as Review,
    },
  };
}

// ============ Reset Function ============

export function resetStore(): void {
  reviews.clear();
}

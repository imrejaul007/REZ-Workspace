/**
 * Review Service
 */

import { v4 as uuidv4 } from 'uuid';
import { ReviewModel } from '../models/Review';
import {
  Review,
  CreateReviewInput,
  ReviewStatus,
  ReviewAnalytics,
  HotelRating,
} from '../types';

export class ReviewService {
  /**
   * Create a new review
   */
  async createReview(input: CreateReviewInput): Promise<Review> {
    // Check for existing review
    const existing = await ReviewModel.findOne({ bookingId: input.bookingId });
    if (existing) {
      throw new Error('Review already exists for this booking');
    }

    // Analyze sentiment
    const sentimentScore = this.analyzeSentiment(input.content);
    const sentiment = this.getSentiment(sentimentScore);

    const review = new ReviewModel({
      id: uuidv4(),
      ...input,
      sentiment: sentiment,
      sentimentScore: sentimentScore,
      status: ReviewStatus.PENDING,
      helpful: 0,
      reportCount: 0,
      isPublic: false,
    });

    await review.save();
    return review.toObject();
  }

  /**
   * Get review by ID
   */
  async getReviewById(reviewId: string): Promise<Review | null> {
    const review = await ReviewModel.findOne({ id: reviewId });
    return review ? review.toObject() : null;
  }

  /**
   * Get review by booking ID
   */
  async getReviewByBookingId(bookingId: string): Promise<Review | null> {
    const review = await ReviewModel.findOne({ bookingId });
    return review ? review.toObject() : null;
  }

  /**
   * Get reviews for a hotel
   */
  async getReviewsByHotel(
    hotelId: string,
    filters: {
      status?: ReviewStatus;
      minRating?: number;
      maxRating?: number;
    } = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{
    reviews: Review[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const query: any = { hotelId };

    // Default to approved reviews for public access
    if (!filters.status) {
      query.status = ReviewStatus.APPROVED;
      query.isPublic = true;
    } else {
      query.status = filters.status;
    }

    if (filters.minRating !== undefined) {
      query.overallRating = { ...query.overallRating, $gte: filters.minRating };
    }
    if (filters.maxRating !== undefined) {
      query.overallRating = { ...query.overallRating, $lte: filters.maxRating };
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [reviews, total] = await Promise.all([
      ReviewModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .lean(),
      ReviewModel.countDocuments(query),
    ]);

    return {
      reviews: reviews as Review[],
      total,
      page: pagination.page,
      limit: pagination.limit,
      pages: Math.ceil(total / pagination.limit),
    };
  }

  /**
   * Respond to a review
   */
  async respondToReview(
    reviewId: string,
    response: string,
    managerName?: string
  ): Promise<Review | null> {
    const review = await ReviewModel.findOneAndUpdate(
      { id: reviewId },
      {
        $set: {
          'managerResponse.content': response,
          'managerResponse.managerName': managerName,
          'managerResponse.respondedAt': new Date().toISOString(),
        },
      },
      { new: true }
    );

    return review ? review.toObject() : null;
  }

  /**
   * Moderate a review
   */
  async moderateReview(
    reviewId: string,
    status: ReviewStatus,
    isPublic?: boolean
  ): Promise<Review | null> {
    const update: any = { status };
    if (isPublic !== undefined) {
      update.isPublic = isPublic;
    }

    // Auto-approve on moderate
    if (status === ReviewStatus.APPROVED) {
      update.isPublic = true;
    }

    const review = await ReviewModel.findOneAndUpdate(
      { id: reviewId },
      { $set: update },
      { new: true }
    );

    return review ? review.toObject() : null;
  }

  /**
   * Mark review as helpful
   */
  async markHelpful(reviewId: string): Promise<Review | null> {
    const review = await ReviewModel.findOneAndUpdate(
      { id: reviewId },
      { $inc: { helpful: 1 } },
      { new: true }
    );

    return review ? review.toObject() : null;
  }

  /**
   * Report a review
   */
  async reportReview(reviewId: string): Promise<Review | null> {
    const review = await ReviewModel.findOneAndUpdate(
      { id: reviewId },
      {
        $inc: { reportCount: 1 },
        $set: { status: ReviewStatus.FLAGGED },
      },
      { new: true }
    );

    return review ? review.toObject() : null;
  }

  /**
   * Get hotel rating summary
   */
  async getHotelRating(hotelId: string): Promise<HotelRating> {
    const reviews = await ReviewModel.find({
      hotelId,
      status: ReviewStatus.APPROVED,
    }).lean();

    if (reviews.length === 0) {
      return {
        hotelId,
        overallRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.overallRating, 0);
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    reviews.forEach((r) => {
      const rating = Math.round(r.overallRating) as 1 | 2 | 3 | 4 | 5;
      distribution[rating]++;
    });

    // Calculate category averages
    const categoryAverages: Record<string, number[]> = {};
    reviews.forEach((r) => {
      if (r.categories) {
        Object.entries(r.categories).forEach(([key, value]) => {
          if (value !== undefined) {
            if (!categoryAverages[key]) categoryAverages[key] = [];
            categoryAverages[key].push(value);
          }
        });
      }
    });

    const categoryAvgResult: Record<string, number> = {};
    Object.entries(categoryAverages).forEach(([key, values]) => {
      categoryAvgResult[key] = values.reduce((a, b) => a + b, 0) / values.length;
    });

    return {
      hotelId,
      overallRating: Math.round((totalRating / reviews.length) * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution: distribution,
      categoryAverages: categoryAvgResult,
    };
  }

  /**
   * Get review analytics
   */
  async getReviewAnalytics(hotelId: string): Promise<ReviewAnalytics> {
    const reviews = await ReviewModel.find({
      hotelId,
      status: ReviewStatus.APPROVED,
    }).lean();

    if (reviews.length === 0) {
      return {
        hotelId,
        overallRating: 0,
        totalReviews: 0,
        averageRatings: {},
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        recommendationRate: 0,
        travelTypeBreakdown: { business: 0, leisure: 0, couple: 0, family: 0, solo: 0 },
        recentTrend: { period: '30d', avgRating: 0, reviewCount: 0, change: 0 },
      };
    }

    // Overall rating
    const totalRating = reviews.reduce((sum, r) => sum + r.overallRating, 0);

    // Rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      const rating = Math.round(r.overallRating) as 1 | 2 | 3 | 4 | 5;
      ratingDistribution[rating]++;
    });

    // Category averages
    const categorySums: Record<string, number[]> = {};
    reviews.forEach((r) => {
      if (r.categories) {
        Object.entries(r.categories).forEach(([key, value]) => {
          if (value !== undefined) {
            if (!categorySums[key]) categorySums[key] = [];
            categorySums[key].push(value);
          }
        });
      }
    });

    const averageRatings: Record<string, number> = {};
    Object.entries(categorySums).forEach(([key, values]) => {
      averageRatings[key] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
    });

    // Sentiment breakdown
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    reviews.forEach((r) => {
      if (r.sentiment) {
        sentimentCounts[r.sentiment]++;
      }
    });

    // Travel type breakdown
    const travelTypeCounts = { business: 0, leisure: 0, couple: 0, family: 0, solo: 0 };
    reviews.forEach((r) => {
      if (r.travelType) {
        travelTypeCounts[r.travelType]++;
      }
    });

    // Recommendation rate
    const recommendCount = reviews.filter((r) => r.wouldRecommend).length;
    const recommendationRate = Math.round((recommendCount / reviews.length) * 100);

    // Recent trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReviews = reviews.filter(
      (r) => new Date(r.createdAt) >= thirtyDaysAgo
    );
    const recentAvg =
      recentReviews.length > 0
        ? recentReviews.reduce((sum, r) => sum + r.overallRating, 0) / recentReviews.length
        : 0;

    return {
      hotelId,
      overallRating: Math.round((totalRating / reviews.length) * 10) / 10,
      totalReviews: reviews.length,
      averageRatings,
      ratingDistribution,
      sentimentBreakdown: sentimentCounts,
      recommendationRate,
      travelTypeBreakdown: travelTypeCounts,
      recentTrend: {
        period: '30d',
        avgRating: Math.round(recentAvg * 10) / 10,
        reviewCount: recentReviews.length,
        change: 0,
      },
    };
  }

  /**
   * Simple sentiment analysis
   */
  private analyzeSentiment(text: string): number {
    const positiveWords = [
      'excellent', 'amazing', 'wonderful', 'fantastic', 'great', 'good',
      'love', 'loved', 'perfect', 'best', 'beautiful', 'outstanding',
      'superb', 'brilliant', 'awesome', 'impressive', 'recommend',
      'clean', 'friendly', 'helpful', 'comfortable', 'spacious'
    ];
    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'poor', 'worst',
      'disappointing', 'dirty', 'noisy', 'rude', 'uncomfortable',
      'expensive', 'overpriced', 'small', 'old', 'broken', 'cold',
      'smelly', 'stink', 'never', 'avoid', 'hate', 'hated'
    ];

    const words = text.toLowerCase().split(/\s+/);
    let score = 0;

    words.forEach((word) => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });

    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, (score + 10) / 20));
  }

  /**
   * Get sentiment from score
   */
  private getSentiment(score: number): 'positive' | 'neutral' | 'negative' {
    if (score >= 0.6) return 'positive';
    if (score <= 0.4) return 'negative';
    return 'neutral';
  }
}

export const reviewService = new ReviewService();

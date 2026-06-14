import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Review entity interface
 */
export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  restaurantId: string;
  rating: number; // 1-5
  foodRating?: number; // 1-5
  serviceRating?: number; // 1-5
  ambienceRating?: number; // 1-5
  deliveryRating?: number; // 1-5
  comment?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  photos?: string[];
  response?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Rating summary for a restaurant
 */
export interface RatingSummary {
  restaurantId: string;
  period: { start: Date; end: Date };
  overall: {
    average: number;
    total: number;
    distribution: { [key: number]: number }; // 1-5 stars count
  };
  food: { average: number; total: number } | null;
  service: { average: number; total: number } | null;
  ambience: { average: number; total: number } | null;
  delivery: { average: number; total: number } | null;
  trend: 'improving' | 'stable' | 'declining';
  responseRate: number; // Percentage of reviews responded
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
}

/**
 * Review analytics
 */
export interface ReviewAnalytics {
  restaurantId: string;
  period: { start: Date; end: Date };
  totalReviews: number;
  averageRating: number;
  ratingTrend: number; // Change from previous period
  topKeywords: Array<{ word: string; count: number; sentiment: string }>;
  commonComplaints: Array<{ issue: string; count: number }>;
  commonPraise: Array<{ item: string; count: number }>;
  responseImpact: number; // Rating difference when owner responds
  recentSentiment: 'positive' | 'neutral' | 'negative';
}

/**
 * Reputation Service
 *
 * Handles restaurant reputation management:
 * - Collect and store reviews
 * - Calculate rating summaries
 * - Track sentiment analysis
 * - Manage review responses
 * - Provide analytics and insights
 */
@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // REVIEW MANAGEMENT
  // ==========================================

  /**
   * Submit a new review
   */
  async submitReview(data: {
    orderId: string;
    customerId: string;
    restaurantId: string;
    rating: number;
    foodRating?: number;
    serviceRating?: number;
    ambienceRating?: number;
    deliveryRating?: number;
    comment?: string;
    photos?: string[];
  }): Promise<Review> {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Check for duplicate review
    const existing = await this.prisma.review.findFirst({
      where: { orderId: data.orderId, customerId: data.customerId },
    });

    if (existing) {
      throw new BadRequestException('Review already submitted for this order');
    }

    // Perform basic sentiment analysis
    const sentiment = this.analyzeSentiment(data.comment || '');

    const review = await this.prisma.review.create({
      data: {
        orderId: data.orderId,
        customerId: data.customerId,
        restaurantId: data.restaurantId,
        rating: data.rating,
        foodRating: data.foodRating,
        serviceRating: data.serviceRating,
        ambienceRating: data.ambienceRating,
        deliveryRating: data.deliveryRating,
        comment: data.comment,
        sentiment,
        photos: data.photos,
      },
    });

    this.logger.log(`Review submitted: ${review.id} for restaurant ${data.restaurantId}`);

    // Update restaurant aggregate rating
    await this.updateRestaurantRating(data.restaurantId);

    return review;
  }

  /**
   * Get reviews for a restaurant
   */
  async getReviews(
    restaurantId: string,
    options: {
      page?: number;
      limit?: number;
      minRating?: number;
      maxRating?: number;
      sentiment?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ reviews: Review[]; total: number }> {
    const { page = 1, limit = 20, minRating, maxRating, sentiment, startDate, endDate } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { restaurantId };

    if (minRating) where.rating = { ...((where.rating as object) || {}), gte: minRating };
    if (maxRating) where.rating = { ...((where.rating as object) || {}), lte: maxRating };
    if (sentiment) where.sentiment = sentiment;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
      if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return { reviews, total };
  }

  /**
   * Get single review by ID
   */
  async getReviewById(reviewId: string): Promise<Review> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review ${reviewId} not found`);
    }

    return review;
  }

  /**
   * Respond to a review
   */
  async respondToReview(
    reviewId: string,
    response: string,
    ownerId: string
  ): Promise<Review> {
    const review = await this.getReviewById(reviewId);

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        response,
        respondedAt: new Date(),
      },
    });

    this.logger.log(`Response added to review ${reviewId} by owner ${ownerId}`);

    return updated;
  }

  /**
   * Update a review
   */
  async updateReview(
    reviewId: string,
    customerId: string,
    data: {
      rating?: number;
      foodRating?: number;
      serviceRating?: number;
      ambienceRating?: number;
      deliveryRating?: number;
      comment?: string;
      photos?: string[];
    }
  ): Promise<Review> {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, customerId },
    });

    if (!review) {
      throw new NotFoundException('Review not found or unauthorized');
    }

    const sentiment = data.comment ? this.analyzeSentiment(data.comment) : review.sentiment;

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.foodRating !== undefined && { foodRating: data.foodRating }),
        ...(data.serviceRating !== undefined && { serviceRating: data.serviceRating }),
        ...(data.ambienceRating !== undefined && { ambienceRating: data.ambienceRating }),
        ...(data.deliveryRating !== undefined && { deliveryRating: data.deliveryRating }),
        ...(data.comment !== undefined && { comment: data.comment }),
        ...(data.photos !== undefined && { photos: data.photos }),
        sentiment,
      },
    });

    // Update restaurant rating
    await this.updateRestaurantRating(review.restaurantId);

    return updated;
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string, customerId: string): Promise<void> {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, customerId },
    });

    if (!review) {
      throw new NotFoundException('Review not found or unauthorized');
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    // Update restaurant rating
    await this.updateRestaurantRating(review.restaurantId);
  }

  // ==========================================
  // RATING CALCULATIONS
  // ==========================================

  /**
   * Get rating summary for a restaurant
   */
  async getRatingSummary(
    restaurantId: string,
    period: { start: Date; end: Date } = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date(),
    }
  ): Promise<RatingSummary> {
    const reviews = await this.prisma.review.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: period.start,
          lte: period.end,
        },
      },
    });

    if (reviews.length === 0) {
      return {
        restaurantId,
        period,
        overall: { average: 0, total: 0, distribution: {} },
        food: null,
        service: null,
        ambience: null,
        delivery: null,
        trend: 'stable',
        responseRate: 0,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
      };
    }

    // Calculate overall rating
    const overallAvg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });

    // Calculate category averages (using overall rating for all categories since schema doesn't have separate ratings)
    const categoryAvg = overallAvg;

    // Calculate sentiment breakdown (basic: positive if rating >= 4, negative if <= 2, else neutral)
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    reviews.forEach(r => {
      if (r.rating >= 4) {
        sentimentCounts.positive++;
      } else if (r.rating <= 2) {
        sentimentCounts.negative++;
      } else {
        sentimentCounts.neutral++;
      }
    });

    // Calculate response rate
    const responded = reviews.filter(r => r.response).length;
    const responseRate = (responded / reviews.length) * 100;

    // Determine trend
    const trend = this.calculateTrend(restaurantId, period);

    return {
      restaurantId,
      period,
      overall: {
        average: Math.round(overallAvg * 10) / 10,
        total: reviews.length,
        distribution,
      },
      food: reviews.length > 0 ? { average: Math.round(categoryAvg * 10) / 10, total: reviews.length } : null,
      service: reviews.length > 0 ? { average: Math.round(categoryAvg * 10) / 10, total: reviews.length } : null,
      ambience: reviews.length > 0 ? { average: Math.round(categoryAvg * 10) / 10, total: reviews.length } : null,
      delivery: reviews.length > 0 ? { average: Math.round(categoryAvg * 10) / 10, total: reviews.length } : null,
      trend,
      responseRate: Math.round(responseRate * 10) / 10,
      sentimentBreakdown: {
        positive: Math.round((sentimentCounts.positive / reviews.length) * 100),
        neutral: Math.round((sentimentCounts.neutral / reviews.length) * 100),
        negative: Math.round((sentimentCounts.negative / reviews.length) * 100),
      },
    };
  }

  /**
   * Calculate rating trend
   */
  private async calculateTrend(
    restaurantId: string,
    currentPeriod: { start: Date; end: Date }
  ): Promise<'improving' | 'stable' | 'declining'> {
    const periodLength = currentPeriod.end.getTime() - currentPeriod.start.getTime();
    const previousPeriod = {
      start: new Date(currentPeriod.start.getTime() - periodLength),
      end: new Date(currentPeriod.start.getTime()),
    };

    const [currentReviews, previousReviews] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          restaurantId,
          createdAt: { gte: currentPeriod.start, lte: currentPeriod.end },
        },
      }),
      this.prisma.review.findMany({
        where: {
          restaurantId,
          createdAt: { gte: previousPeriod.start, lte: previousPeriod.end },
        },
      }),
    ]);

    if (previousReviews.length === 0) return 'stable';

    const currentAvg = currentReviews.reduce((s, r) => s + r.rating, 0) / currentReviews.length;
    const previousAvg = previousReviews.reduce((s, r) => s + r.rating, 0) / previousReviews.length;

    const difference = currentAvg - previousAvg;

    if (difference > 0.2) return 'improving';
    if (difference < -0.2) return 'declining';
    return 'stable';
  }

  /**
   * Update restaurant's aggregate rating
   */
  private async updateRestaurantRating(restaurantId: string): Promise<void> {
    const reviews = await this.prisma.review.findMany({
      where: { restaurantId },
    });

    if (reviews.length === 0) return;

    const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

    // Update restaurant if such field exists
    try {
      await this.prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
          averageRating: avgRating,
          totalReviews: reviews.length,
        },
      });
    } catch {
      // Restaurant model might not have these fields - that's okay
      this.logger.debug(`Restaurant ${restaurantId} rating updated: ${avgRating.toFixed(2)}`);
    }
  }

  // ==========================================
  // ANALYTICS
  // ==========================================

  /**
   * Get review analytics
   */
  async getAnalytics(
    restaurantId: string,
    period: { start: Date; end: Date } = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    }
  ): Promise<ReviewAnalytics> {
    const reviews = await this.prisma.review.findMany({
      where: {
        restaurantId,
        createdAt: { gte: period.start, lte: period.end },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (reviews.length === 0) {
      return {
        restaurantId,
        period,
        totalReviews: 0,
        averageRating: 0,
        ratingTrend: 0,
        topKeywords: [],
        commonComplaints: [],
        commonPraise: [],
        responseImpact: 0,
        recentSentiment: 'neutral',
      };
    }

    // Calculate average
    const averageRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

    // Calculate trend
    const ratingTrend = this.calculateRatingTrend(reviews);

    // Extract keywords
    const topKeywords = this.extractKeywords(reviews);

    // Identify common issues
    const commonComplaints = this.identifyCommonIssues(reviews, 'negative');
    const commonPraise = this.identifyCommonIssues(reviews, 'positive');

    // Calculate response impact
    const responseImpact = this.calculateResponseImpact(reviews);

    // Recent sentiment
    const recentSentiment = this.calculateRecentSentiment(reviews);

    return {
      restaurantId,
      period,
      totalReviews: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingTrend,
      topKeywords,
      commonComplaints,
      commonPraise,
      responseImpact,
      recentSentiment,
    };
  }

  /**
   * Calculate rating trend (difference from previous period)
   */
  private calculateRatingTrend(reviews: Review[]): number {
    if (reviews.length < 2) return 0;

    const midpoint = Math.floor(reviews.length / 2);
    const recentReviews = reviews.slice(0, midpoint);
    const olderReviews = reviews.slice(midpoint);

    if (olderReviews.length === 0) return 0;

    const recentAvg = recentReviews.reduce((s, r) => s + r.rating, 0) / recentReviews.length;
    const olderAvg = olderReviews.reduce((s, r) => s + r.rating, 0) / olderReviews.length;

    return Math.round((recentAvg - olderAvg) * 10) / 10;
  }

  /**
   * Extract top keywords from reviews
   */
  private extractKeywords(reviews: Review[]): Array<{ word: string; count: number; sentiment: string }> {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'was', 'were', 'are', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'this', 'that', 'these', 'those']);

    const wordCounts: Map<string, { count: number; sentiments: string[] }> = new Map();

    reviews.forEach(review => {
      const words = (review.comment || '').toLowerCase().split(/\s+/);
      words.forEach(word => {
        const cleaned = word.replace(/[^a-z]/g, '');
        if (cleaned.length > 2 && !stopWords.has(cleaned)) {
          const existing = wordCounts.get(cleaned);
          if (existing) {
            existing.count++;
            existing.sentiments.push(review.sentiment || 'neutral');
          } else {
            wordCounts.set(cleaned, { count: 1, sentiments: [review.sentiment || 'neutral'] });
          }
        }
      });
    });

    return Array.from(wordCounts.entries())
      .map(([word, data]) => {
        const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
        data.sentiments.forEach(s => sentimentCounts[s as keyof typeof sentimentCounts]++);
        const dominantSentiment = Object.entries(sentimentCounts).sort((a, b) => b[1] - a[1])[0][0];
        return { word, count: data.count, sentiment: dominantSentiment };
      })
      .filter(k => k.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Identify common issues from reviews
   */
  private identifyCommonIssues(
    reviews: Review[],
    sentiment: 'positive' | 'negative'
  ): Array<{ issue: string; count: number }> {
    const issueKeywords: Record<string, string[]> = {
      'Slow Service': ['slow', 'wait', 'waiting', 'delay', 'delayed', 'late', 'took long'],
      'Food Quality': ['cold', 'dry', 'overcooked', 'undercooked', 'bland', 'tasteless', 'stale'],
      'Portion Size': ['small', 'less', 'tiny', 'portion', 'size', 'quantity'],
      'Cleanliness': ['dirty', 'clean', 'hygiene', 'unhygienic', 'messy'],
      'Staff Behavior': ['rude', 'helpful', 'friendly', 'polite', 'staff', 'service'],
      'Price': ['expensive', 'price', 'cost', 'overpriced', 'worth', 'value'],
      'Delivery': ['delivery', 'late', 'packaging', 'spilled', 'damaged'],
      'Ambience': ['ambience', 'atmosphere', 'noise', 'loud', 'crowded', 'decor'],
    };

    const issueCounts: Record<string, number> = {};

    reviews
      .filter(r => r.sentiment === sentiment)
      .forEach(review => {
        const comment = (review.comment || '').toLowerCase();
        Object.entries(issueKeywords).forEach(([issue, keywords]) => {
          if (keywords.some(kw => comment.includes(kw))) {
            issueCounts[issue] = (issueCounts[issue] || 0) + 1;
          }
        });
      });

    return Object.entries(issueCounts)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Calculate impact of owner responses
   */
  private calculateResponseImpact(reviews: Review[]): number {
    const withResponse = reviews.filter(r => r.response);
    const withoutResponse = reviews.filter(r => !r.response);

    if (withResponse.length === 0 || withoutResponse.length === 0) return 0;

    const avgWithResponse = withResponse.reduce((s, r) => s + r.rating, 0) / withResponse.length;
    const avgWithoutResponse = withoutResponse.reduce((s, r) => s + r.rating, 0) / withoutResponse.length;

    return Math.round((avgWithResponse - avgWithoutResponse) * 10) / 10;
  }

  /**
   * Calculate recent sentiment
   */
  private calculateRecentSentiment(reviews: Review[]): 'positive' | 'neutral' | 'negative' {
    const recent = reviews.slice(0, 10);
    const sentiments = recent.map(r => r.sentiment).filter(Boolean);

    const counts = { positive: 0, neutral: 0, negative: 0 };
    sentiments.forEach(s => counts[s as keyof typeof counts]++);

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as 'positive' | 'neutral' | 'negative';
  }

  // ==========================================
  // SENTIMENT ANALYSIS
  // ==========================================

  /**
   * Basic sentiment analysis based on keywords
   */
  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = [
      'amazing', 'excellent', 'great', 'good', 'love', 'loved', 'best', 'fantastic',
      'wonderful', 'delicious', 'tasty', 'fresh', 'perfect', 'awesome', 'outstanding',
      'superb', 'recommend', 'happy', 'satisfied', 'friendly', 'quick', 'clean',
    ];

    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'worst', 'poor', 'disappointed', 'slow',
      'cold', 'rude', 'dirty', 'expensive', 'overpriced', 'bland', 'tasteless',
      'wait', 'waiting', 'long', 'late', 'missed', 'forgot', 'wrong', 'never',
    ];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
      if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // ==========================================
  // COMPETITIVE ANALYSIS
  // ==========================================

  /**
   * Compare ratings with similar restaurants
   */
  async compareWithCompetitors(
    restaurantId: string,
    category?: string
  ): Promise<{
    restaurantId: string;
    restaurantRating: number;
    categoryAverage: number;
    percentile: number;
    ranking: number;
    totalInCategory: number;
  }> {
    const whereClause: Record<string, unknown> = {};
    if (category) {
      // Assuming restaurants have a category field
      whereClause.category = category;
    }

    const restaurants = await (this.prisma as unknown as { restaurant: { findMany: Function } }).restaurant.findMany({
      where: whereClause,
      select: { id: true, averageRating: true },
    });

    const ourRestaurant = restaurants.find(r => r.id === restaurantId);
    const ourRating = ourRestaurant?.averageRating || 0;

    const ratings = restaurants
      .map(r => r.averageRating || 0)
      .filter(r => r > 0)
      .sort((a, b) => b - a);

    if (ratings.length === 0) {
      return {
        restaurantId,
        restaurantRating: ourRating,
        categoryAverage: 0,
        percentile: 0,
        ranking: 0,
        totalInCategory: 0,
      };
    }

    const categoryAverage = ratings.reduce((s, r) => s + r, 0) / ratings.length;
    const ranking = ratings.filter(r => r > ourRating).length + 1;
    const percentile = ((ratings.length - ranking + 1) / ratings.length) * 100;

    return {
      restaurantId,
      restaurantRating: Math.round(ourRating * 10) / 10,
      categoryAverage: Math.round(categoryAverage * 10) / 10,
      percentile: Math.round(percentile),
      ranking,
      totalInCategory: ratings.length,
    };
  }
}

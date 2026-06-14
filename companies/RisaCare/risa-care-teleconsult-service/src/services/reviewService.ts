import { v4 as uuidv4 } from 'uuid';
import {
  db,
  TeleconsultReview,
  DoctorReviewStats,
  SubmitReviewRequest,
} from '../models/teleconsult.js';

export class ReviewService {
  /**
   * Submit a review for a consultation
   */
  async submitReview(
    sessionId: string,
    request: SubmitReviewRequest
  ): Promise<TeleconsultReview> {
    // Verify session exists and is completed
    const session = db.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.status !== 'completed') {
      throw new Error('Can only review completed sessions');
    }

    // Check if review already exists
    const existingReview = this.getReviewBySession(sessionId);
    if (existingReview) {
      throw new Error('Review already submitted for this session');
    }

    // Validate rating
    if (request.rating < 1 || request.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const reviewId = uuidv4();
    const now = new Date().toISOString();

    const review: TeleconsultReview = {
      reviewId,
      sessionId,
      patientId: request.patientId,
      doctorId: session.doctorId,
      rating: request.rating,
      feedback: request.feedback,
      wouldRecommend: request.wouldRecommend,
      categories: request.categories,
      createdAt: now,
    };

    db.reviews.set(reviewId, review);

    return review;
  }

  /**
   * Get review by session ID
   */
  getReviewBySession(sessionId: string): TeleconsultReview | undefined {
    for (const review of db.reviews.values()) {
      if (review.sessionId === sessionId) {
        return review;
      }
    }
    return undefined;
  }

  /**
   * Get all reviews for a doctor
   */
  getDoctorReviews(
    doctorId: string,
    options?: {
      limit?: number;
      offset?: number;
      minRating?: number;
    }
  ): { reviews: TeleconsultReview[]; total: number } {
    const allReviews = Array.from(db.reviews.values())
      .filter(r => r.doctorId === doctorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let filtered = allReviews;
    if (options?.minRating) {
      filtered = filtered.filter(r => r.rating >= options.minRating!);
    }

    const total = filtered.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 20;

    return {
      reviews: filtered.slice(offset, offset + limit),
      total,
    };
  }

  /**
   * Get average rating for a doctor
   */
  getAverageRating(doctorId: string): number {
    const reviews = Array.from(db.reviews.values()).filter(r => r.doctorId === doctorId);
    if (reviews.length === 0) return 0;

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10; // Round to 1 decimal
  }

  /**
   * Get detailed review statistics for a doctor
   */
  getDoctorReviewStats(doctorId: string): DoctorReviewStats {
    const reviews = Array.from(db.reviews.values()).filter(r => r.doctorId === doctorId);

    if (reviews.length === 0) {
      return {
        doctorId,
        averageRating: 0,
        totalReviews: 0,
        wouldRecommendPercentage: 0,
        categoryAverages: undefined,
        recentReviews: [],
      };
    }

    const averageRating = this.getAverageRating(doctorId);
    const wouldRecommendCount = reviews.filter(r => r.wouldRecommend).length;
    const wouldRecommendPercentage = Math.round((wouldRecommendCount / reviews.length) * 100);

    // Calculate category averages
    const categoryAverages: DoctorReviewStats['categoryAverages'] = {};
    const categoryFields: Array<keyof NonNullable<TeleconsultReview['categories']>> = [
      'punctuality',
      'professionalism',
      'thoroughness',
      'communication',
    ];

    for (const field of categoryFields) {
      const values = reviews
        .map(r => r.categories?.[field])
        .filter((v): v is number => v !== undefined);

      if (values.length > 0) {
        categoryAverages[field] = Math.round(
          (values.reduce((a, b) => a + b, 0) / values.length) * 10
        ) / 10;
      }
    }

    // Get recent reviews (last 10)
    const recentReviews = reviews
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      doctorId,
      averageRating,
      totalReviews: reviews.length,
      wouldRecommendPercentage,
      categoryAverages: Object.keys(categoryAverages).length > 0 ? categoryAverages : undefined,
      recentReviews,
    };
  }

  /**
   * Get rating distribution for a doctor
   */
  getRatingDistribution(doctorId: string): {
    rating: number;
    count: number;
    percentage: number;
  }[] {
    const reviews = Array.from(db.reviews.values()).filter(r => r.doctorId === doctorId);
    const distribution = [1, 2, 3, 4, 5].map(rating => {
      const count = reviews.filter(r => r.rating === rating).length;
      return {
        rating,
        count,
        percentage: reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0,
      };
    });

    return distribution;
  }

  /**
   * Update a review
   */
  async updateReview(
    reviewId: string,
    updates: Partial<Pick<TeleconsultReview, 'rating' | 'feedback' | 'wouldRecommend' | 'categories'>>
  ): Promise<TeleconsultReview> {
    const review = db.reviews.get(reviewId);
    if (!review) {
      throw new Error(`Review not found: ${reviewId}`);
    }

    // Validate rating if provided
    if (updates.rating !== undefined && (updates.rating < 1 || updates.rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    const updated: TeleconsultReview = {
      ...review,
      ...updates,
    };

    db.reviews.set(reviewId, updated);

    return updated;
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<boolean> {
    return db.reviews.delete(reviewId);
  }

  /**
   * Get reviews for a patient
   */
  getPatientReviews(patientId: string): TeleconsultReview[] {
    return Array.from(db.reviews.values())
      .filter(r => r.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Check if patient has reviewed a session
   */
  hasReviewedSession(sessionId: string): boolean {
    return this.getReviewBySession(sessionId) !== undefined;
  }

  /**
   * Get top-rated doctors
   */
  getTopRatedDoctors(minReviews: number = 10): {
    doctorId: string;
    averageRating: number;
    totalReviews: number;
  }[] {
    const doctorRatings = new Map<string, { total: number; count: number }>();

    db.reviews.forEach(review => {
      const current = doctorRatings.get(review.doctorId) || { total: 0, count: 0 };
      doctorRatings.set(review.doctorId, {
        total: current.total + review.rating,
        count: current.count + 1,
      });
    });

    const topDoctors = Array.from(doctorRatings.entries())
      .filter(([, stats]) => stats.count >= minReviews)
      .map(([doctorId, stats]) => ({
        doctorId,
        averageRating: Math.round((stats.total / stats.count) * 10) / 10,
        totalReviews: stats.count,
      }))
      .sort((a, b) => b.averageRating - a.averageRating);

    return topDoctors;
  }

  /**
   * Get recent reviews across all doctors
   */
  getRecentReviews(limit: number = 20): TeleconsultReview[] {
    return Array.from(db.reviews.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Get review sentiment analysis (stub - would integrate with NLP service)
   */
  analyzeReviewSentiment(reviewId: string): {
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    keywords: string[];
  } | null {
    const review = db.reviews.get(reviewId);
    if (!review || !review.feedback) {
      return null;
    }

    // Simple keyword-based sentiment analysis
    // In production, use actual NLP service
    const positiveKeywords = ['great', 'excellent', 'amazing', 'helpful', 'recommend', 'best', 'wonderful'];
    const negativeKeywords = ['bad', 'poor', 'terrible', 'awful', 'worse', 'horrible', 'disappointing'];

    const feedback = review.feedback.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    for (const keyword of positiveKeywords) {
      if (feedback.includes(keyword)) positiveCount++;
    }
    for (const keyword of negativeKeywords) {
      if (feedback.includes(keyword)) negativeCount++;
    }

    const score = positiveCount - negativeCount;
    let sentiment: 'positive' | 'neutral' | 'negative';
    if (score > 0) sentiment = 'positive';
    else if (score < 0) sentiment = 'negative';
    else sentiment = 'neutral';

    return {
      sentiment,
      score,
      keywords: [...positiveKeywords, ...negativeKeywords].filter(k => feedback.includes(k)),
    };
  }
}

export const reviewService = new ReviewService();

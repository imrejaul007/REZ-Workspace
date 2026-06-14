import crypto from 'crypto';
import { Review, ReviewSummary, ReviewStats } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class ReviewsService {
  private reviews: Map<string, Review> = new Map();
  private productReviews: Map<string, Set<string>> = new Map();
  private customerReviews: Map<string, Set<string>> = new Map();

  createReview(review: Omit<Review, 'id'>): Review {
    const id = crypto.randomUUID();
    const fullReview: Review = {
      ...review,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.reviews.set(id, fullReview);
    this.addToIndex('product', review.shopifyProductId, id);
    if (review.customerId) {
      this.addToIndex('customer', review.customerId, id);
    }

    logger.info(`Review created: ${id} for product ${review.shopifyProductId}`);
    return fullReview;
  }

  private addToIndex(type: 'product' | 'customer', key: string, reviewId: string): void {
    const map = type === 'product' ? this.productReviews : this.customerReviews;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(reviewId);
  }

  getReview(id: string): Review | undefined {
    return this.reviews.get(id);
  }

  getProductReviews(productId: string, options?: {
    limit?: number;
    offset?: number;
    rating?: number;
    sort?: 'recent' | 'rating_high' | 'rating_low' | 'helpful'
  }): { reviews: Review[]; summary: ReviewSummary } {
    const reviewIds = this.productReviews.get(productId) || new Set();
    let reviews = Array.from(reviewIds).map(id => this.reviews.get(id)!).filter(r => r && r.status === 'approved');

    if (options?.rating) {
      reviews = reviews.filter(r => r.rating === options.rating);
    }

    reviews.sort((a, b) => {
      switch (options?.sort) {
        case 'rating_high': return b.rating - a.rating;
        case 'rating_low': return a.rating - b.rating;
        case 'helpful': return b.helpful - a.helpful;
        default: return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
      }
    });

    const offset = options?.offset || 0;
    const limit = options?.limit || 20;
    const paginated = reviews.slice(offset, offset + limit);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    let withPhotos = 0;
    let verified = 0;

    reviews.forEach(r => {
      distribution[r.rating as keyof typeof distribution]++;
      totalRating += r.rating;
      if (r.images.length > 0) withPhotos++;
      if (r.verified) verified++;
    });

    const summary: ReviewSummary = {
      productId,
      averageRating: reviews.length > 0 ? Math.round((totalRating / reviews.length) * 10) / 10 : 0,
      totalReviews: reviews.length,
      ratingDistribution: distribution,
      withPhotos,
      verifiedPurchases: verified
    };

    return { reviews: paginated, summary };
  }

  updateReview(id: string, updates: Partial<Review>): Review | undefined {
    const review = this.reviews.get(id);
    if (!review) return undefined;

    const updated = { ...review, ...updates, updatedAt: new Date().toISOString() };
    this.reviews.set(id, updated);
    return updated;
  }

  deleteReview(id: string): boolean {
    const review = this.reviews.get(id);
    if (!review) return false;

    this.productReviews.get(review.shopifyProductId)?.delete(id);
    if (review.customerId) {
      this.customerReviews.get(review.customerId)?.delete(id);
    }
    this.reviews.delete(id);
    return true;
  }

  markHelpful(id: string): Review | undefined {
    const review = this.reviews.get(id);
    if (review) {
      review.helpful++;
      review.updatedAt = new Date().toISOString();
      this.reviews.set(id, review);
    }
    return review;
  }

  markNotHelpful(id: string): Review | undefined {
    const review = this.reviews.get(id);
    if (review) {
      review.notHelpful++;
      review.updatedAt = new Date().toISOString();
      this.reviews.set(id, review);
    }
    return review;
  }

  addReply(reviewId: string, authorName: string, content: string): Review | undefined {
    const review = this.reviews.get(reviewId);
    if (review) {
      review.replies.push({
        id: crypto.randomUUID(),
        authorName,
        content,
        createdAt: new Date().toISOString()
      });
      review.updatedAt = new Date().toISOString();
      this.reviews.set(reviewId, review);
    }
    return review;
  }

  getStats(productId?: string): ReviewStats[] {
    const productIds = productId ? [productId] : Array.from(this.productReviews.keys());

    return productIds.map(pid => {
      const { summary } = this.getProductReviews(pid);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const reviewIds = this.productReviews.get(pid) || new Set();
      const reviews = Array.from(reviewIds).map(id => this.reviews.get(id)!).filter(Boolean);

      const thisWeek = reviews.filter(r => new Date(r.createdAt!) >= weekAgo).length;
      const thisMonth = reviews.filter(r => new Date(r.createdAt!) >= monthAgo).length;

      return {
        productId: pid,
        avgRating: summary.averageRating,
        totalReviews: summary.totalReviews,
        reviewsThisWeek: thisWeek,
        reviewsThisMonth: thisMonth,
        positiveSentiment: Math.round((summary.ratingDistribution[4] + summary.ratingDistribution[5]) / Math.max(summary.totalReviews, 1) * 100),
        negativeSentiment: Math.round((summary.ratingDistribution[1] + summary.ratingDistribution[2]) / Math.max(summary.totalReviews, 1) * 100)
      };
    });
  }

  moderateReview(id: string, status: 'approved' | 'rejected' | 'flagged'): Review | undefined {
    const review = this.reviews.get(id);
    if (review) {
      review.status = status;
      review.updatedAt = new Date().toISOString();
      this.reviews.set(id, review);
      logger.info(`Review ${id} moderated to ${status}`);
    }
    return review;
  }
}

export const reviewsService = new ReviewsService();

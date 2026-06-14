import crypto from 'crypto';
import { Review } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class ReviewsCore {
  private reviews: Map<string, Review> = new Map();
  private entityReviews: Map<string, Set<string>> = new Map();
  private userReviews: Map<string, Set<string>> = new Map();

  createReview(review: Review): Review {
    const id = crypto.randomUUID();
    const fullReview = { ...review, id, createdAt: new Date().toISOString() };

    this.reviews.set(id, fullReview);
    this.addToIndex('entity', `${review.entityType}:${review.entityId}`, id);
    this.addToIndex('user', review.userId, id);

    logger.info(`Review created: ${id} for ${review.entityType}:${review.entityId}`);
    return fullReview;
  }

  private addToIndex(index: 'entity' | 'user', key: string, reviewId: string): void {
    const map = index === 'entity' ? this.entityReviews : this.userReviews;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(reviewId);
  }

  getReview(id: string): Review | undefined {
    return this.reviews.get(id);
  }

  getEntityReviews(entityType: string, entityId: string, options?: { limit?: number; offset?: number; sort?: 'recent' | 'helpful' | 'rating' }): { reviews: Review[]; avgRating: number; total: number } {
    const key = `${entityType}:${entityId}`;
    const ids = this.entityReviews.get(key) || new Set();
    const reviews = Array.from(ids).map(id => this.reviews.get(id)!).filter(Boolean);

    const sorted = reviews.sort((a, b) => {
      if (options?.sort === 'rating') return b.rating - a.rating;
      if (options?.sort === 'helpful') return b.helpful - a.helpful;
      return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
    });

    const offset = options?.offset || 0;
    const limit = options?.limit || 20;
    const paginated = sorted.slice(offset, offset + limit);

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return { reviews: paginated, avgRating: Math.round(avgRating * 10) / 10, total: reviews.length };
  }

  getUserReviews(userId: string): Review[] {
    const ids = this.userReviews.get(userId) || new Set();
    return Array.from(ids).map(id => this.reviews.get(id)!).filter(Boolean);
  }

  markHelpful(reviewId: string): boolean {
    const review = this.reviews.get(reviewId);
    if (review) { review.helpful++; this.reviews.set(reviewId, review); return true; }
    return false;
  }

  addReply(reviewId: string, userId: string, content: string): boolean {
    const review = this.reviews.get(reviewId);
    if (review) {
      review.replies.push({ userId, content, createdAt: new Date().toISOString() });
      this.reviews.set(reviewId, review);
      return true;
    }
    return false;
  }

  deleteReview(id: string): boolean {
    const review = this.reviews.get(id);
    if (review) {
      this.entityReviews.get(`${review.entityType}:${review.entityId}`)?.delete(id);
      this.userReviews.get(review.userId)?.delete(id);
      this.reviews.delete(id);
      return true;
    }
    return false;
  }
}

export const reviewsCore = new ReviewsCore();

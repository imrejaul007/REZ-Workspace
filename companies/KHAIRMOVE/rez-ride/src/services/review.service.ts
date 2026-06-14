import { Injectable, Logger } from '@nestjs/common';

/**
 * Reviews Service - Star ratings + written reviews
 */

export interface Review {
  id: string;
  rideId: string;
  userId: string;
  driverId: string;
  rating: number;
  review?: string;
  tags: string[];
  response?: string;
  createdAt: Date;
}

export interface DriverReview {
  driverId: string;
  avgRating: number;
  totalReviews: number;
  distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  recentReviews: Review[];
}

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  private reviews: Map<string, Review> = new Map();

  async submitReview(rideId: string, review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const id = `REV_${Date.now()}`;
    const fullReview = { ...review, id, createdAt: new Date() };
    this.reviews.set(id, fullReview);
    return fullReview;
  }

  async getDriverReviews(driverId: string): Promise<DriverReview> {
    const driverReviews = Array.from(this.reviews.values())
      .filter(r => r.driverId === driverId);

    if (driverReviews.length === 0) {
      return {
        driverId,
        avgRating: 5,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recentReviews: [],
      };
    }

    const avg = driverReviews.reduce((sum, r) => sum + r.rating, 0) / driverReviews.length;
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    driverReviews.forEach(r => dist[r.rating as 1|2|3|4|5]++);

    return {
      driverId,
      avgRating: Math.round(avg * 10) / 10,
      totalReviews: driverReviews.length,
      distribution: dist,
      recentReviews: driverReviews.slice(-5),
    };
  }
}

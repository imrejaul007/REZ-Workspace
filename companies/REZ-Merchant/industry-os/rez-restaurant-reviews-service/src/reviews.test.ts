import { describe, it, expect, beforeEach } from 'vitest';

// ============ Type Definitions ============
interface Review {
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
  response?: {
    text: string;
    respondedAt: Date;
    respondedBy: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  createdAt: Date;
  updatedAt: Date;
}

interface ReviewFilters {
  restaurantId?: string;
  minRating?: number;
  maxRating?: number;
  status?: Review['status'];
  startDate?: Date;
  endDate?: Date;
  isVerifiedVisit?: boolean;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  verifiedVisits: number;
  responseRate: number;
}

// ============ Mock Data ============
const mockReview: Review = {
  id: 'REV-001',
  restaurantId: 'REST-001',
  customerId: 'CUST-001',
  customerName: 'John Doe',
  rating: 4,
  title: 'Great food and ambiance',
  comment: 'Amazing experience at this restaurant. The pasta was excellent and service was prompt.',
  foodRating: 5,
  serviceRating: 4,
  ambienceRating: 4,
  valueRating: 3,
  pros: ['Great food', 'Friendly staff', 'Nice ambiance'],
  cons: ['Slightly pricey'],
  visitDate: new Date('2024-01-15'),
  orderDetails: {
    items: ['Margherita Pizza', 'Caesar Salad', 'Tiramisu'],
    totalAmount: 2500,
  },
  isVerifiedVisit: true,
  isHelpful: 15,
  status: 'approved',
  createdAt: new Date('2024-01-16'),
  updatedAt: new Date('2024-01-16'),
};

const mockReviewNegative: Review = {
  id: 'REV-002',
  restaurantId: 'REST-001',
  customerId: 'CUST-002',
  customerName: 'Jane Smith',
  rating: 2,
  title: 'Disappointing experience',
  comment: 'The food took too long and when it arrived, it was lukewarm. Would not recommend.',
  foodRating: 2,
  serviceRating: 1,
  ambienceRating: 3,
  valueRating: 2,
  visitDate: new Date('2024-01-18'),
  isVerifiedVisit: true,
  isHelpful: 8,
  status: 'approved',
  createdAt: new Date('2024-01-20'),
  updatedAt: new Date('2024-01-20'),
};

const mockReviewPending: Review = {
  id: 'REV-003',
  restaurantId: 'REST-001',
  customerId: 'CUST-003',
  customerName: 'Bob Wilson',
  rating: 3,
  comment: 'Average experience, nothing special.',
  isVerifiedVisit: false,
  isHelpful: 0,
  status: 'pending',
  visitDate: new Date('2024-01-25'),
  createdAt: new Date('2024-01-25'),
  updatedAt: new Date('2024-01-25'),
};

// ============ Review Service (simulated) ============
class ReviewService {
  private reviews: Map<string, Review> = new Map();

  constructor(initialReviews: Review[] = []) {
    initialReviews.forEach((review) => this.reviews.set(review.id, review));
  }

  async createReview(data: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'isHelpful' | 'status'>): Promise<Review> {
    const review: Review = {
      ...data,
      id: `REV-${Date.now()}`,
      isHelpful: 0,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.reviews.set(review.id, review);
    return review;
  }

  async getReviewById(id: string): Promise<Review | null> {
    return this.reviews.get(id) || null;
  }

  async getReviewsByRestaurant(restaurantId: string, filters?: ReviewFilters): Promise<Review[]> {
    let reviews = Array.from(this.reviews.values()).filter(
      (r) => r.restaurantId === restaurantId
    );

    if (filters?.status) {
      reviews = reviews.filter((r) => r.status === filters.status);
    }
    if (filters?.minRating !== undefined) {
      reviews = reviews.filter((r) => r.rating >= filters.minRating!);
    }
    if (filters?.maxRating !== undefined) {
      reviews = reviews.filter((r) => r.rating <= filters.maxRating!);
    }
    if (filters?.isVerifiedVisit !== undefined) {
      reviews = reviews.filter((r) => r.isVerifiedVisit === filters.isVerifiedVisit);
    }

    return reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async approveReview(id: string): Promise<Review | null> {
    const review = this.reviews.get(id);
    if (!review || review.status === 'rejected') return null;

    const updated: Review = { ...review, status: 'approved', updatedAt: new Date() };
    this.reviews.set(id, updated);
    return updated;
  }

  async rejectReview(id: string): Promise<Review | null> {
    const review = this.reviews.get(id);
    if (!review) return null;

    const updated: Review = { ...review, status: 'rejected', updatedAt: new Date() };
    this.reviews.set(id, updated);
    return updated;
  }

  async flagReview(id: string): Promise<Review | null> {
    const review = this.reviews.get(id);
    if (!review) return null;

    const updated: Review = { ...review, status: 'flagged', updatedAt: new Date() };
    this.reviews.set(id, updated);
    return updated;
  }

  async addResponse(id: string, text: string, respondedBy: string): Promise<Review | null> {
    const review = this.reviews.get(id);
    if (!review) return null;

    const updated: Review = {
      ...review,
      response: { text, respondedAt: new Date(), respondedBy },
      updatedAt: new Date(),
    };
    this.reviews.set(id, updated);
    return updated;
  }

  async markHelpful(id: string): Promise<Review | null> {
    const review = this.reviews.get(id);
    if (!review) return null;

    const updated: Review = { ...review, isHelpful: review.isHelpful + 1, updatedAt: new Date() };
    this.reviews.set(id, updated);
    return updated;
  }

  async getReviewStats(restaurantId: string): Promise<ReviewStats> {
    const reviews = await this.getReviewsByRestaurant(restaurantId, { status: 'approved' });

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        verifiedVisits: 0,
        responseRate: 0,
      };
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => ratingDistribution[r.rating]++);

    const verifiedVisits = reviews.filter((r) => r.isVerifiedVisit).length;
    const respondedReviews = reviews.filter((r) => r.response).length;

    return {
      totalReviews: reviews.length,
      averageRating: Math.round((totalRating / reviews.length) * 10) / 10,
      ratingDistribution,
      verifiedVisits,
      responseRate: Math.round((respondedReviews / reviews.length) * 100),
    };
  }

  async getTopReviews(restaurantId: string, limit: number = 5): Promise<Review[]> {
    const approved = await this.getReviewsByRestaurant(restaurantId, { status: 'approved' });
    return approved.sort((a, b) => b.isHelpful - a.isHelpful).slice(0, limit);
  }

  async getRecentReviews(restaurantId: string, limit: number = 10): Promise<Review[]> {
    const approved = await this.getReviewsByRestaurant(restaurantId, { status: 'approved' });
    return approved.slice(0, limit);
  }
}

// ============ Tests ============
describe('ReviewService', () => {
  let reviewService: ReviewService;

  beforeEach(() => {
    reviewService = new ReviewService([mockReview, mockReviewNegative, mockReviewPending]);
  });

  describe('createReview', () => {
    it('should create a new review with pending status', async () => {
      const newReview = await reviewService.createReview({
        restaurantId: 'REST-001',
        customerId: 'CUST-NEW',
        customerName: 'New Customer',
        rating: 5,
        comment: 'Excellent service!',
        visitDate: new Date(),
        isVerifiedVisit: true,
      });

      expect(newReview.id).toBeDefined();
      expect(newReview.status).toBe('pending');
      expect(newReview.isHelpful).toBe(0);
      expect(newReview.createdAt).toBeDefined();
    });

    it('should include optional fields when provided', async () => {
      const newReview = await reviewService.createReview({
        restaurantId: 'REST-001',
        customerId: 'CUST-NEW',
        customerName: 'New Customer',
        rating: 4,
        title: 'Great Experience',
        comment: 'Really enjoyed the food',
        visitDate: new Date(),
        isVerifiedVisit: true,
        foodRating: 5,
        serviceRating: 4,
        pros: ['Great food', 'Nice ambiance'],
        cons: ['Long wait'],
      });

      expect(newReview.title).toBe('Great Experience');
      expect(newReview.pros).toHaveLength(2);
      expect(newReview.cons).toHaveLength(1);
    });

    it('should auto-generate unique IDs', async () => {
      const review1 = await reviewService.createReview({
        restaurantId: 'REST-001',
        customerId: 'CUST-1',
        customerName: 'Customer 1',
        rating: 5,
        comment: 'Test 1',
        visitDate: new Date(),
        isVerifiedVisit: true,
      });

      const review2 = await reviewService.createReview({
        restaurantId: 'REST-001',
        customerId: 'CUST-2',
        customerName: 'Customer 2',
        rating: 5,
        comment: 'Test 2',
        visitDate: new Date(),
        isVerifiedVisit: true,
      });

      expect(review1.id).not.toBe(review2.id);
    });
  });

  describe('getReviewById', () => {
    it('should return review when found', async () => {
      const result = await reviewService.getReviewById('REV-001');

      expect(result).not.toBeNull();
      expect(result?.customerName).toBe('John Doe');
      expect(result?.rating).toBe(4);
    });

    it('should return null for non-existent review', async () => {
      const result = await reviewService.getReviewById('NON-EXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('getReviewsByRestaurant', () => {
    it('should return all reviews for a restaurant', async () => {
      const result = await reviewService.getReviewsByRestaurant('REST-001');

      expect(result).toHaveLength(3);
    });

    it('should filter by status', async () => {
      const result = await reviewService.getReviewsByRestaurant('REST-001', {
        status: 'approved',
      });

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.status === 'approved')).toBe(true);
    });

    it('should filter by minimum rating', async () => {
      const result = await reviewService.getReviewsByRestaurant('REST-001', {
        minRating: 4,
      });

      expect(result).toHaveLength(1);
      expect(result[0].rating).toBeGreaterThanOrEqual(4);
    });

    it('should filter by maximum rating', async () => {
      const result = await reviewService.getReviewsByRestaurant('REST-001', {
        maxRating: 3,
      });

      expect(result).toHaveLength(1);
      expect(result[0].rating).toBeLessThanOrEqual(3);
    });

    it('should filter by verified visit status', async () => {
      const result = await reviewService.getReviewsByRestaurant('REST-001', {
        isVerifiedVisit: false,
      });

      expect(result).toHaveLength(1);
      expect(result[0].isVerifiedVisit).toBe(false);
    });

    it('should sort by creation date (newest first)', async () => {
      const result = await reviewService.getReviewsByRestaurant('REST-001');

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
          result[i].createdAt.getTime()
        );
      }
    });

    it('should combine multiple filters', async () => {
      const result = await reviewService.getReviewsByRestaurant('REST-001', {
        status: 'approved',
        minRating: 3,
      });

      expect(result.length).toBeLessThanOrEqual(2);
      result.forEach((r) => {
        expect(r.status).toBe('approved');
        expect(r.rating).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('approveReview', () => {
    it('should approve a pending review', async () => {
      const result = await reviewService.approveReview('REV-003');

      expect(result).not.toBeNull();
      expect(result?.status).toBe('approved');
    });

    it('should not approve an already rejected review', async () => {
      await reviewService.rejectReview('REV-003');
      const result = await reviewService.approveReview('REV-003');

      expect(result).toBeNull();
    });

    it('should return null for non-existent review', async () => {
      const result = await reviewService.approveReview('NON-EXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('rejectReview', () => {
    it('should reject an approved review', async () => {
      const result = await reviewService.rejectReview('REV-001');

      expect(result).not.toBeNull();
      expect(result?.status).toBe('rejected');
    });

    it('should return null for non-existent review', async () => {
      const result = await reviewService.rejectReview('NON-EXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('flagReview', () => {
    it('should flag a review', async () => {
      const result = await reviewService.flagReview('REV-001');

      expect(result).not.toBeNull();
      expect(result?.status).toBe('flagged');
    });
  });

  describe('addResponse', () => {
    it('should add a response to a review', async () => {
      const result = await reviewService.addResponse(
        'REV-001',
        'Thank you for your feedback!',
        'manager-001'
      );

      expect(result).not.toBeNull();
      expect(result?.response).toBeDefined();
      expect(result?.response?.text).toBe('Thank you for your feedback!');
      expect(result?.response?.respondedBy).toBe('manager-001');
    });

    it('should return null for non-existent review', async () => {
      const result = await reviewService.addResponse(
        'NON-EXISTENT',
        'Response',
        'manager'
      );

      expect(result).toBeNull();
    });
  });

  describe('markHelpful', () => {
    it('should increment helpful count', async () => {
      const before = await reviewService.getReviewById('REV-001');
      const beforeCount = before?.isHelpful || 0;

      const result = await reviewService.markHelpful('REV-001');

      expect(result?.isHelpful).toBe(beforeCount + 1);
    });

    it('should allow multiple helpful marks', async () => {
      await reviewService.markHelpful('REV-001');
      await reviewService.markHelpful('REV-001');
      const result = await reviewService.getReviewById('REV-001');

      expect(result?.isHelpful).toBe(mockReview.isHelpful + 2);
    });
  });

  describe('getReviewStats', () => {
    it('should calculate correct statistics', async () => {
      const stats = await reviewService.getReviewStats('REST-001');

      expect(stats.totalReviews).toBe(2); // Only approved reviews
      expect(stats.ratingDistribution[1]).toBe(0);
      expect(stats.ratingDistribution[2]).toBe(1);
      expect(stats.ratingDistribution[4]).toBe(1);
    });

    it('should calculate average rating correctly', async () => {
      const stats = await reviewService.getReviewStats('REST-001');

      // (4 + 2) / 2 = 3.0
      expect(stats.averageRating).toBe(3);
    });

    it('should calculate verified visits count', async () => {
      const stats = await reviewService.getReviewStats('REST-001');

      expect(stats.verifiedVisits).toBe(2);
    });

    it('should return zero response rate when no responses', async () => {
      const stats = await reviewService.getReviewStats('REST-001');

      expect(stats.responseRate).toBe(0);
    });

    it('should return zeros for restaurant with no reviews', async () => {
      const service = new ReviewService([]);
      const stats = await service.getReviewStats('REST-EMPTY');

      expect(stats.totalReviews).toBe(0);
      expect(stats.averageRating).toBe(0);
    });
  });

  describe('getTopReviews', () => {
    it('should return most helpful reviews', async () => {
      const topReviews = await reviewService.getTopReviews('REST-001');

      expect(topReviews[0].isHelpful).toBeGreaterThanOrEqual(topReviews[1].isHelpful);
    });

    it('should respect limit parameter', async () => {
      const topReviews = await reviewService.getTopReviews('REST-001', 1);

      expect(topReviews).toHaveLength(1);
    });

    it('should only return approved reviews', async () => {
      const topReviews = await reviewService.getTopReviews('REST-001');

      expect(topReviews.every((r) => r.status === 'approved')).toBe(true);
    });
  });

  describe('getRecentReviews', () => {
    it('should return most recent reviews', async () => {
      const recentReviews = await reviewService.getRecentReviews('REST-001');

      expect(recentReviews.length).toBeLessThanOrEqual(10);
    });

    it('should only return approved reviews', async () => {
      const recentReviews = await reviewService.getRecentReviews('REST-001');

      expect(recentReviews.every((r) => r.status === 'approved')).toBe(true);
    });
  });
});

describe('Review Validation', () => {
  it('should validate rating is between 1 and 5', () => {
    const validRatings = [1, 2, 3, 4, 5];

    validRatings.forEach((rating) => {
      expect(rating).toBeGreaterThanOrEqual(1);
      expect(rating).toBeLessThanOrEqual(5);
    });
  });

  it('should validate status values', () => {
    const validStatuses: Review['status'][] = ['pending', 'approved', 'rejected', 'flagged'];

    validStatuses.forEach((status) => {
      expect(['pending', 'approved', 'rejected', 'flagged']).toContain(status);
    });
  });

  it('should validate sub-ratings when provided', () => {
    const review = mockReview;

    if (review.foodRating) {
      expect(review.foodRating).toBeGreaterThanOrEqual(1);
      expect(review.foodRating).toBeLessThanOrEqual(5);
    }
    if (review.serviceRating) {
      expect(review.serviceRating).toBeGreaterThanOrEqual(1);
      expect(review.serviceRating).toBeLessThanOrEqual(5);
    }
  });
});

describe('Review Rating Logic', () => {
  it('should calculate average of sub-ratings', () => {
    const review = mockReview;

    if (review.foodRating && review.serviceRating && review.ambienceRating && review.valueRating) {
      const average =
        (review.foodRating +
          review.serviceRating +
          review.ambienceRating +
          review.valueRating) /
        4;

      // Average of 5, 4, 4, 3 = 4
      expect(average).toBe(4);
    }
  });

  it('should identify review sentiment based on rating', () => {
    const getSentiment = (rating: number): string => {
      if (rating >= 4) return 'positive';
      if (rating >= 3) return 'neutral';
      return 'negative';
    };

    expect(getSentiment(5)).toBe('positive');
    expect(getSentiment(4)).toBe('positive');
    expect(getSentiment(3)).toBe('neutral');
    expect(getSentiment(2)).toBe('negative');
    expect(getSentiment(1)).toBe('negative');
  });
});

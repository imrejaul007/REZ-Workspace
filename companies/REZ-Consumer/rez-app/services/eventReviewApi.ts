/**
 * Event Review API Service
 * Handles all review-related API calls for events
 *
 * BUG-FIX: All methods now use apiClient instead of raw fetch().
 * Raw fetch() calls bypassed the 401-refresh-logout interceptor in apiClient,
 * so expired tokens caused silent failures instead of triggering token refresh
 * and clean logout.
 */

import apiClient from './apiClient';

// Region getter - will be set by RegionContext
let getRegionFn: (() => string) | null = null;

export function setEventReviewApiRegionGetter(fn: (() => string) | null) {
  getRegionFn = fn;
}

export interface ReviewUser {
  id?: string;
  name: string;
  profilePicture?: string;
}

export interface EventReviewData {
  id: string;
  rating: number;
  title: string;
  review: string;
  helpfulCount: number;
  isVerifiedBooking: boolean;
  createdAt: string;
  updatedAt?: string;
  user: ReviewUser;
  response?: {
    text: string;
    respondedAt: string;
  };
}

export interface ReviewsResponse {
  success: boolean;
  data: {
    reviews: EventReviewData[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      hasMore: boolean;
    };
    summary: {
      averageRating: number;
      totalReviews: number;
      distribution: Record<number, number>;
    };
  };
}

export interface UserReviewResponse {
  success: boolean;
  data: {
    review: EventReviewData | null;
    canReview: boolean;
    hasBooking: boolean;
  };
}

export interface SubmitReviewData {
  rating: number;
  title: string;
  review: string;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';

class EventReviewApiService {
  /**
   * Get reviews for an event
   */
  async getEventReviews(
    eventId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: SortOption = 'newest'
  ): Promise<ReviewsResponse['data']> {
    const response = await apiClient.get<ReviewsResponse['data']>(
      `/events/${eventId}/reviews`,
      { page, limit, sortBy },
    );
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch reviews');
    }
    return response.data as ReviewsResponse['data'];
  }

  /**
   * Get user's own review for an event
   */
  async getUserReview(eventId: string): Promise<UserReviewResponse['data']> {
    const response = await apiClient.get<UserReviewResponse['data']>(
      `/events/${eventId}/my-review`,
    );
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch your review');
    }
    return response.data as UserReviewResponse['data'];
  }

  /**
   * Submit a new review for an event
   */
  async submitReview(eventId: string, reviewData: SubmitReviewData): Promise<EventReviewData> {
    const response = await apiClient.post<EventReviewData>(
      `/events/${eventId}/reviews`,
      reviewData as unknown as Record<string, unknown>,
    );
    if (!response.success) {
      throw new Error(response.error || 'Failed to submit review');
    }
    return response.data as EventReviewData;
  }

  /**
   * Update an existing review
   */
  async updateReview(reviewId: string, reviewData: Partial<SubmitReviewData>): Promise<EventReviewData> {
    const response = await apiClient.put<EventReviewData>(
      `/events/reviews/${reviewId}`,
      reviewData as unknown as Record<string, unknown>,
    );
    if (!response.success) {
      throw new Error(response.error || 'Failed to update review');
    }
    return response.data as EventReviewData;
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<void> {
    const response = await apiClient.delete(`/events/reviews/${reviewId}`);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete review');
    }
  }

  /**
   * Mark a review as helpful
   */
  async markReviewHelpful(reviewId: string): Promise<{ helpfulCount: number }> {
    const response = await apiClient.put<{ helpfulCount: number }>(
      `/events/reviews/${reviewId}/helpful`,
    );
    if (!response.success) {
      throw new Error(response.error || 'Failed to mark review as helpful');
    }
    return response.data as { helpfulCount: number };
  }
}

const eventReviewApi = new EventReviewApiService();
export default eventReviewApi;

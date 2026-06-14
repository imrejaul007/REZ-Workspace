// DEPRECATED: Use reviewApi.ts instead. This file has incorrect API paths.
// Reviews API Service
// Handles product and store reviews, ratings, and feedback

import apiClient, { ApiResponse } from './apiClient';

export interface Review {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    username: string;
    verified: boolean;
  };
  targetType: 'product' | 'store' | 'video' | 'project';
  targetId: string;
  target: {
    id: string;
    name: string;
    image?: string;
    type: Review['targetType'];
  };
  rating: number; // 1-5 stars
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
  images: Array<{
    id: string;
    url: string;
    thumbnail: string;
    alt: string;
  }>;
  videos?: Array<{
    id: string;
    url: string;
    thumbnail: string;
    duration: number;
  }>;
  helpful: {
    count: number;
    userVoted: boolean;
    voteType: 'helpful' | 'not_helpful' | null;
  };
  replies: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
      role: 'user' | 'store_owner' | 'admin';
    };
    content: string;
    createdAt: string;
  }>;
  metadata: {
    verified: boolean; // verified purchase/usage
    recommended: boolean;
    wouldBuyAgain?: boolean;
    usageTime?: string; // how long they used the product
    purchaseDate?: string;
    orderNumber?: string;
  };
  moderation: {
    status: 'approved' | 'pending' | 'rejected' | 'flagged';
    moderatedBy?: string;
    moderatedAt?: string;
    reason?: string;
  };
  tags: string[];
  featured: boolean;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewsQuery {
  page?: number;
  limit?: number;
  targetType?: Review['targetType'];
  targetId?: string;
  userId?: string;
  rating?: number;
  minRating?: number;
  maxRating?: number;
  verified?: boolean;
  recommended?: boolean;
  hasImages?: boolean;
  hasVideos?: boolean;
  search?: string;
  tags?: string[];
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';
  order?: 'asc' | 'desc';
  status?: Review['moderation']['status'];
  dateFrom?: string;
  dateTo?: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
  summary: {
    totalReviews: number;
    averageRating: number;
    ratingBreakdown: Record<number, number>;
    recommendationRate: number;
    verifiedReviews: number;
    featuredReviews: number;
  };
  filters: {
    ratings: Record<number, number>;
    tags: Array<{ name: string; count: number }>;
    verified: { verified: number; unverified: number };
  };
}

export interface CreateReviewRequest {
  targetType: Review['targetType'];
  targetId: string;
  rating: number;
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
  recommended: boolean;
  wouldBuyAgain?: boolean;
  usageTime?: string;
  tags?: string[];
}

export interface ReviewStats {
  overview: {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    recommendationRate: number;
    verifiedRate: number;
  };
  trends: {
    ratingsOverTime: Array<{
      date: string;
      average: number;
      count: number;
    }>;
    sentimentAnalysis: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  topKeywords: Array<{
    keyword: string;
    count: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;
  userSegments: {
    byVerification: Record<'verified' | 'unverified', {
      count: number;
      averageRating: number;
    }>;
    byUsageTime: Record<string, {
      count: number;
      averageRating: number;
    }>;
  };
}

// Response payload types
type HelpfullVoteResponse = { helpful: boolean; count: number };
type MessageResponse = { message: string };
type CanReviewResponse = {
  canReview: boolean;
  reason?: string;
  existingReviewId?: string;
  requiresVerification?: boolean;
};
type ReviewSuggestionsResponse = {
  titleSuggestions: string[];
  contentPrompts: string[];
  commonPros: string[];
  commonCons: string[];
  relevantTags: string[];
};
type BulkModerateResponse = { processed: number; successful: number; failed: number };
type ReviewAnalyticsResponse = {
  overview: {
    totalReviews: number;
    averageRating: number;
    reviewsThisMonth: number;
    ratingTrend: number;
  };
  engagement: { helpfulVotes: number; replies: number; reports: number };
  demographics: { verifiedUsers: number; repeatCustomers: number; averageUsageTime: string };
  insights: Array<{
    type: 'trending_keyword' | 'sentiment_shift' | 'rating_spike';
    title: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
};

class ReviewsService {
  // Get reviews with filtering and pagination
  async getReviews(query: ReviewsQuery = {}): Promise<ApiResponse<ReviewsResponse>> {
    return apiClient.get<ReviewsResponse>('/reviews', query as unknown as Record<string, string | number | boolean | null | undefined>);
  }

  // Get single review by ID
  async getReviewById(reviewId: string): Promise<ApiResponse<Review>> {
    return apiClient.get<Review>(`/reviews/${reviewId}`);
  }

  // Get reviews for a specific target (product/store/etc.)
  async getTargetReviews(
    targetType: Review['targetType'],
    targetId: string,
    query: Omit<ReviewsQuery, 'targetType' | 'targetId'> = {}
  ): Promise<ApiResponse<ReviewsResponse>> {
    return apiClient.get<ReviewsResponse>(`/reviews/${targetType}/${targetId}`, query as unknown as Record<string, string | number | boolean | null | undefined>);
  }

  // Get user's reviews
  async getUserReviews(
    userId?: string,
    query: Omit<ReviewsQuery, 'userId'> = {}
  ): Promise<ApiResponse<ReviewsResponse>> {
    const endpoint = userId ? `/reviews/user/${userId}` : '/reviews/my';
    return apiClient.get<ReviewsResponse>(endpoint, query as unknown as Record<string, string | number | boolean | null | undefined>);
  }

  // Create new review
  async createReview(
    data: CreateReviewRequest,
    images?: File[],
    videos?: File[]
  ): Promise<ApiResponse<Review>> {
    const endpoint = `/reviews/${data.targetType}/${data.targetId}`;
    if (images || videos) {
      const formData = new FormData();
      formData.append('review', JSON.stringify(data));

      if (images) {
        images.forEach((image, index) => {
          formData.append(`images[${index}]`, image);
        });
      }

      if (videos) {
        videos.forEach((video, index) => {
          formData.append(`videos[${index}]`, video);
        });
      }

      return apiClient.uploadFile(endpoint, formData);
    }

    return apiClient.post<Review>(endpoint, data as unknown as Record<string, unknown>);
  }

  // Update review
  async updateReview(
    reviewId: string,
    updates: Partial<{
      rating: number;
      title: string;
      content: string;
      pros: string[];
      cons: string[];
      recommended: boolean;
      wouldBuyAgain: boolean;
      ratingTime: string;
      tags: string[];
    }>
  ): Promise<ApiResponse<Review>> {
    return apiClient.patch<Review>(`/reviews/${reviewId}`, updates);
  }

  // Delete review
  async deleteReview(reviewId: string): Promise<ApiResponse<MessageResponse>> {
    return apiClient.delete<MessageResponse>(`/reviews/${reviewId}`);
  }

  // Mark review as helpful
  async markHelpful(reviewId: string): Promise<ApiResponse<HelpfullVoteResponse>> {
    return apiClient.post<HelpfullVoteResponse>(`/reviews/${reviewId}/helpful`);
  }

  // Mark review as not helpful
  async markNotHelpful(reviewId: string): Promise<ApiResponse<HelpfullVoteResponse>> {
    return apiClient.post<HelpfullVoteResponse>(`/reviews/${reviewId}/not-helpful`);
  }

  // Remove helpful/not helpful vote
  async removeHelpfulVote(reviewId: string): Promise<ApiResponse<HelpfullVoteResponse>> {
    return apiClient.delete<HelpfullVoteResponse>(`/reviews/${reviewId}/helpful`);
  }

  // Add reply to review
  async addReply(
    reviewId: string,
    content: string
  ): Promise<ApiResponse<Review['replies'][0]>> {
    return apiClient.post<Review['replies'][0]>(`/reviews/${reviewId}/replies`, { content });
  }

  // Update reply
  async updateReply(
    replyId: string,
    content: string
  ): Promise<ApiResponse<Review['replies'][0]>> {
    return apiClient.patch<Review['replies'][0]>(`/replies/${replyId}`, { content });
  }

  // Delete reply
  async deleteReply(replyId: string): Promise<ApiResponse<MessageResponse>> {
    return apiClient.delete<MessageResponse>(`/replies/${replyId}`);
  }

  // Report review
  async reportReview(
    reviewId: string,
    reason: 'spam' | 'inappropriate' | 'fake' | 'offensive' | 'other',
    description?: string
  ): Promise<ApiResponse<MessageResponse>> {
    return apiClient.post<MessageResponse>(`/reviews/${reviewId}/report`, {
      reason,
      description,
    });
  }

  // Feature review (admin/store owner)
  async featureReview(reviewId: string): Promise<ApiResponse<MessageResponse>> {
    return apiClient.patch<MessageResponse>(`/reviews/${reviewId}/feature`);
  }

  // Unfeature review (admin/store owner)
  async unfeatureReview(reviewId: string): Promise<ApiResponse<MessageResponse>> {
    return apiClient.patch<MessageResponse>(`/reviews/${reviewId}/unfeature`);
  }

  // Pin review (admin/store owner)
  async pinReview(reviewId: string): Promise<ApiResponse<MessageResponse>> {
    return apiClient.patch<MessageResponse>(`/reviews/${reviewId}/pin`);
  }

  // Unpin review (admin/store owner)
  async unpinReview(reviewId: string): Promise<ApiResponse<MessageResponse>> {
    return apiClient.patch<MessageResponse>(`/reviews/${reviewId}/unpin`);
  }

  // Get featured reviews
  async getFeaturedReviews(
    options?: {
      category?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<Review[]>> {
    return apiClient.get<Review[]>('/reviews/featured', {
      page: options?.page,
      limit: options?.limit,
      category: options?.category,
    });
  }

  // Get review statistics
  async getReviewStats(
    targetType: Review['targetType'],
    targetId: string,
    dateRange?: { from: string; to: string }
  ): Promise<ApiResponse<ReviewStats>> {
    return apiClient.get<ReviewStats>(`/reviews/${targetType}/${targetId}/stats`, dateRange);
  }

  // Get user's review for specific target
  async getUserTargetReview(
    targetType: Review['targetType'],
    targetId: string
  ): Promise<ApiResponse<Review | null>> {
    return apiClient.get<Review | null>(`/reviews/${targetType}/${targetId}/my`);
  }

  // Check if user can review target
  async canReview(
    targetType: Review['targetType'],
    targetId: string
  ): Promise<ApiResponse<CanReviewResponse>> {
    return apiClient.get<CanReviewResponse>(`/reviews/${targetType}/${targetId}/can-review`);
  }

  // Get review templates/suggestions
  async getReviewSuggestions(
    targetType: Review['targetType'],
    rating: number
  ): Promise<ApiResponse<ReviewSuggestionsResponse>> {
    return apiClient.get<ReviewSuggestionsResponse>('/reviews/suggestions', {
      targetType,
      rating,
    });
  }

  // Moderate review (admin only)
  async moderateReview(
    reviewId: string,
    action: 'approve' | 'reject' | 'flag',
    reason?: string
  ): Promise<ApiResponse<Review>> {
    return apiClient.patch<Review>(`/reviews/${reviewId}/moderate`, { action, reason });
  }

  // Get pending reviews for moderation (admin only)
  async getPendingReviews(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<ReviewsResponse>> {
    return apiClient.get<ReviewsResponse>('/reviews/pending', { page, limit });
  }

  // Bulk moderate reviews (admin only)
  async bulkModerate(
    reviewIds: string[],
    action: 'approve' | 'reject' | 'flag',
    reason?: string
  ): Promise<ApiResponse<BulkModerateResponse>> {
    return apiClient.post<BulkModerateResponse>('/reviews/bulk-moderate', {
      reviewIds,
      action,
      reason,
    });
  }

  // Get review analytics (admin/store owner)
  async getReviewAnalytics(
    targetType?: Review['targetType'],
    targetId?: string,
    dateRange?: { from: string; to: string }
  ): Promise<ApiResponse<ReviewAnalyticsResponse>> {
    return apiClient.get<ReviewAnalyticsResponse>('/reviews/analytics', {
      targetType,
      targetId,
      ...dateRange,
    });
  }
}

// Create singleton instance
const reviewsService = new ReviewsService();

export default reviewsService;
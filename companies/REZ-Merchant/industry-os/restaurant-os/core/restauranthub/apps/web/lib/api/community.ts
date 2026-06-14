import { apiClient, ApiResponse, PaginatedResponse } from './client';

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  images: string[];
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: string;
    reputation: number;
    badges: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  content: string;
  parentId?: string;
  likeCount: number;
  isLiked: boolean;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: string;
  };
  replies?: PostComment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  category: string;
  tags: string[];
  images?: File[];
}

export interface PostFilters {
  category?: string[];
  tags?: string[];
  authorId?: string;
  isPinned?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'likeCount' | 'commentCount' | 'viewCount';
  sortOrder?: 'asc' | 'desc';
}

export interface VendorSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  suggestedVendor?: {
    name: string;
    contact: string;
    location: string;
  };
  rating: number;
  ratingCount: number;
  status: 'ACTIVE' | 'RESOLVED' | 'CLOSED';
  isHelpful: boolean;
  helpfulCount: number;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    reputation: number;
  };
  responses: Array<{
    id: string;
    content: string;
    isMarkedBest: boolean;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSuggestionRequest {
  title: string;
  description: string;
  category: string;
  suggestedVendor?: {
    name: string;
    contact: string;
    location: string;
  };
}

export interface CommunityStats {
  totalPosts: number;
  totalComments: number;
  totalUsers: number;
  activeUsers: number;
  topCategories: Array<{
    category: string;
    postCount: number;
  }>;
  topContributors: Array<{
    userId: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    postCount: number;
    reputation: number;
  }>;
  recentActivity: Array<{
    type: 'post' | 'comment' | 'like' | 'share';
    userId: string;
    userName: string;
    postId?: string;
    postTitle?: string;
    createdAt: string;
  }>;
}

export interface UserReputation {
  userId: string;
  totalPoints: number;
  level: number;
  postsCreated: number;
  commentsCreated: number;
  likesReceived: number;
  sharesReceived: number;
  helpfulSuggestions: number;
  bestSuggestions: number;
  badgeCount: number;
  badges: Array<{
    type: string;
    title: string;
    description: string;
    icon: string;
    earnedAt: string;
  }>;
}

class CommunityApi {
  // Forum Posts
  async getPosts(
    filters?: PostFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<ForumPost>> {
    const params = { ...filters, page, limit };
    return apiClient.getPaginated<ForumPost>('/community/posts', params);
  }

  async getPost(id: string): Promise<ApiResponse<ForumPost>> {
    return apiClient.get<ForumPost>(`/community/posts/${id}`);
  }

  async createPost(data: CreatePostRequest): Promise<ApiResponse<ForumPost>> {
    if (data.images && data.images.length > 0) {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content);
      formData.append('category', data.category);
      data.tags.forEach(tag => formData.append('tags[]', tag));
      data.images.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });

      const response = await apiClient.post('/community/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } else {
      return apiClient.post<ForumPost>('/community/posts', {
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags,
      });
    }
  }

  async updatePost(id: string, data: Partial<CreatePostRequest>): Promise<ApiResponse<ForumPost>> {
    return apiClient.put<ForumPost>(`/community/posts/${id}`, data);
  }

  async deletePost(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/community/posts/${id}`);
  }

  async likePost(postId: string): Promise<ApiResponse<{ liked: boolean; likeCount: number }>> {
    return apiClient.post<{ liked: boolean; likeCount: number }>(`/community/posts/${postId}/like`);
  }

  async bookmarkPost(postId: string): Promise<ApiResponse<{ bookmarked: boolean }>> {
    return apiClient.post<{ bookmarked: boolean }>(`/community/posts/${postId}/bookmark`);
  }

  async sharePost(postId: string): Promise<ApiResponse<{ shareCount: number }>> {
    return apiClient.post<{ shareCount: number }>(`/community/posts/${postId}/share`);
  }

  async reportPost(postId: string, reason: string, details?: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/community/posts/${postId}/report`, { reason, details });
  }

  // Comments
  async getPostComments(
    postId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<PostComment>> {
    return apiClient.getPaginated<PostComment>(`/community/posts/${postId}/comments`, { page, limit });
  }

  async createComment(postId: string, content: string, parentId?: string): Promise<ApiResponse<PostComment>> {
    return apiClient.post<PostComment>(`/community/posts/${postId}/comments`, {
      content,
      parentId,
    });
  }

  async updateComment(commentId: string, content: string): Promise<ApiResponse<PostComment>> {
    return apiClient.put<PostComment>(`/community/comments/${commentId}`, { content });
  }

  async deleteComment(commentId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/community/comments/${commentId}`);
  }

  async likeComment(commentId: string): Promise<ApiResponse<{ liked: boolean; likeCount: number }>> {
    return apiClient.post<{ liked: boolean; likeCount: number }>(`/community/comments/${commentId}/like`);
  }

  async reportComment(commentId: string, reason: string, details?: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/community/comments/${commentId}/report`, { reason, details });
  }

  // Vendor Suggestions
  async getSuggestions(
    category?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<VendorSuggestion>> {
    const params = { category, page, limit };
    return apiClient.getPaginated<VendorSuggestion>('/community/suggestions', params);
  }

  async getSuggestion(id: string): Promise<ApiResponse<VendorSuggestion>> {
    return apiClient.get<VendorSuggestion>(`/community/suggestions/${id}`);
  }

  async createSuggestion(data: CreateSuggestionRequest): Promise<ApiResponse<VendorSuggestion>> {
    return apiClient.post<VendorSuggestion>('/community/suggestions', data);
  }

  async updateSuggestion(id: string, data: Partial<CreateSuggestionRequest>): Promise<ApiResponse<VendorSuggestion>> {
    return apiClient.put<VendorSuggestion>(`/community/suggestions/${id}`, data);
  }

  async deleteSuggestion(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/community/suggestions/${id}`);
  }

  async rateSuggestion(suggestionId: string, rating: number): Promise<ApiResponse<{ rating: number; ratingCount: number }>> {
    return apiClient.post<{ rating: number; ratingCount: number }>(`/community/suggestions/${suggestionId}/rate`, { rating });
  }

  async markSuggestionHelpful(suggestionId: string): Promise<ApiResponse<{ helpful: boolean; helpfulCount: number }>> {
    return apiClient.post<{ helpful: boolean; helpfulCount: number }>(`/community/suggestions/${suggestionId}/helpful`);
  }

  async respondToSuggestion(suggestionId: string, content: string): Promise<ApiResponse<unknown>> {
    return apiClient.post<unknown>(`/community/suggestions/${suggestionId}/responses`, { content });
  }

  async markBestResponse(suggestionId: string, responseId: string): Promise<ApiResponse<void>> {
    return apiClient.patch(`/community/suggestions/${suggestionId}/responses/${responseId}/best`);
  }

  // Search and Discovery
  async searchPosts(query: string, filters?: PostFilters): Promise<ApiResponse<ForumPost[]>> {
    return apiClient.search<ForumPost>('/community/posts/search', query, filters);
  }

  async searchSuggestions(query: string, category?: string): Promise<ApiResponse<VendorSuggestion[]>> {
    const filters = category ? { category } : {};
    return apiClient.search<VendorSuggestion>('/community/suggestions/search', query, filters);
  }

  async getTrendingPosts(period: '24h' | '7d' | '30d' = '7d'): Promise<ApiResponse<ForumPost[]>> {
    return apiClient.get<ForumPost[]>('/community/posts/trending', { params: { period } });
  }

  async getPopularCategories(): Promise<ApiResponse<string[]>> {
    return apiClient.get<string[]>('/community/categories/popular');
  }

  async getRecommendedPosts(userId: string): Promise<ApiResponse<ForumPost[]>> {
    return apiClient.get<ForumPost[]>(`/community/posts/recommended/${userId}`);
  }

  // User Activity
  async getUserPosts(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<ForumPost>> {
    return apiClient.getPaginated<ForumPost>(`/community/users/${userId}/posts`, { page, limit });
  }

  async getUserComments(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<PostComment>> {
    return apiClient.getPaginated<PostComment>(`/community/users/${userId}/comments`, { page, limit });
  }

  async getUserBookmarks(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<ForumPost>> {
    return apiClient.getPaginated<ForumPost>('/community/bookmarks', { page, limit });
  }

  async followUser(userId: string): Promise<ApiResponse<{ following: boolean }>> {
    return apiClient.post<{ following: boolean }>(`/community/users/${userId}/follow`);
  }

  async getFollowers(userId: string): Promise<ApiResponse<unknown[]>> {
    return apiClient.get<unknown[]>(`/community/users/${userId}/followers`);
  }

  async getFollowing(userId: string): Promise<ApiResponse<unknown[]>> {
    return apiClient.get<unknown[]>(`/community/users/${userId}/following`);
  }

  // Statistics and Reputation
  async getCommunityStats(): Promise<ApiResponse<CommunityStats>> {
    return apiClient.get<CommunityStats>('/community/stats');
  }

  async getUserReputation(userId: string): Promise<ApiResponse<UserReputation>> {
    return apiClient.get<UserReputation>(`/community/users/${userId}/reputation`);
  }

  async getLeaderboard(period: '7d' | '30d' | 'all' = '30d'): Promise<ApiResponse<unknown[]>> {
    return apiClient.get<unknown[]>('/community/leaderboard', { params: { period } });
  }

  // Moderation
  async pinPost(postId: string): Promise<ApiResponse<ForumPost>> {
    return apiClient.patch<ForumPost>(`/community/posts/${postId}/pin`);
  }

  async unpinPost(postId: string): Promise<ApiResponse<ForumPost>> {
    return apiClient.patch<ForumPost>(`/community/posts/${postId}/unpin`);
  }

  async lockPost(postId: string): Promise<ApiResponse<ForumPost>> {
    return apiClient.patch<ForumPost>(`/community/posts/${postId}/lock`);
  }

  async unlockPost(postId: string): Promise<ApiResponse<ForumPost>> {
    return apiClient.patch<ForumPost>(`/community/posts/${postId}/unlock`);
  }

  async getReports(
    type: 'post' | 'comment',
    status?: 'pending' | 'resolved' | 'dismissed',
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<unknown>> {
    const params = { type, status, page, limit };
    return apiClient.getPaginated<unknown>('/community/reports', params);
  }

  async resolveReport(reportId: string, action: 'dismiss' | 'remove' | 'warn', notes?: string): Promise<ApiResponse<void>> {
    return apiClient.patch(`/community/reports/${reportId}/resolve`, { action, notes });
  }
}

export const communityApi = new CommunityApi();
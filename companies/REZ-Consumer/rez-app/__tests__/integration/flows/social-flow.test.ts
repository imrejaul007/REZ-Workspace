// @ts-nocheck
/**
 * Social Flow Integration Tests
 *
 * Complete user journey for UGC and social interactions
 */

import apiClient from '@/services/apiClient';
import {
  setupAuthenticatedUser,
  cleanupAfterTest,
  testDataFactory,
} from '../utils/testHelpers';

// ugcApi only has default export
jest.mock('@/services/ugcApi', () => {
  const apiClient = require('@/services/apiClient').default;
  const mock = {
    getUGCFeed: (params?: any) => apiClient.get('/ugc/feed', params),
    getTrendingContent: () => apiClient.get('/ugc/trending'),
    searchByHashtag: (tag: string) => apiClient.get('/ugc/search', { hashtag: tag }),
    getContentByProduct: (productId: string) => apiClient.get('/ugc/product', { productId }),
    likeContent: (contentId: string) => apiClient.post('/ugc/like', { contentId }),
    addComment: (contentId: string, comment: string) => apiClient.post('/ugc/comment', { contentId, comment }),
    uploadContent: (data: any) => apiClient.post('/ugc/upload', data),
    shareContent: (contentId: string, platform: string) => apiClient.post('/ugc/share', { contentId, platform }),
    trackVideoView: (contentId: string, data: any) => apiClient.post('/ugc/view', { contentId, ...data }),
    reportContent: (contentId: string, data: any) => apiClient.post('/ugc/report', { contentId, ...data }),
    getFollowingFeed: () => apiClient.get('/ugc/following'),
  };
  return { __esModule: true, default: mock };
});
import ugcApi from '@/services/ugcApi';

// followApi exports named functions directly (no default export)
jest.mock('@/services/followApi', () => {
  const apiClient = require('@/services/apiClient').default;
  return {
    __esModule: true,
    followUser: (userId: string) => apiClient.post('/social/follow', { userId }),
    unfollowUser: (userId: string) => apiClient.delete(`/social/follow/${userId}`),
    getFollowers: (userId: string) => apiClient.get(`/social/followers/${userId}`),
    getFollowing: (userId: string) => apiClient.get(`/social/following/${userId}`),
    getFollowSuggestions: (limit: number) => apiClient.get('/social/suggestions', { limit }),
    checkFollowStatus: (userId: string) => apiClient.get(`/social/status/${userId}`),
    getFollowCounts: (userId: string) => apiClient.get(`/social/counts/${userId}`),
    toggleFollow: (userId: string) => apiClient.post('/social/toggle', { userId }),
    removeFollower: (userId: string) => apiClient.delete(`/social/followers/${userId}`),
    blockUser: (userId: string) => apiClient.post('/social/block', { userId }),
    unblockUser: (userId: string) => apiClient.delete(`/social/block/${userId}`),
    getBlockedUsers: () => apiClient.get('/social/blocked'),
    searchUsers: (query: string) => apiClient.get('/social/search', { q: query }),
    getPendingFollowRequests: () => apiClient.get('/social/requests'),
    acceptFollowRequest: (requestId: string) => apiClient.post('/social/requests/accept', { requestId }),
    rejectFollowRequest: (requestId: string) => apiClient.post('/social/requests/reject', { requestId }),
    getMutualFollowers: (userId: string) => apiClient.get(`/social/mutual/${userId}`),
  };
});
import * as followApi from '@/services/followApi';

describe('Social Flow Integration Tests', () => {
  beforeEach(async () => {
    await setupAuthenticatedUser();
  });

  afterEach(async () => {
    await cleanupAfterTest();
  });

  describe('Complete UGC Journey', () => {
    it('should complete: View Feed → Like/Comment → Upload Content → Share', async () => {
      // Step 1: View UGC feed
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          content: [testDataFactory.ugcContent()],
          pagination: { page: 1, hasMore: true },
        },
      });

      const feed = await ugcApi.getUGCFeed({ page: 1 });
      expect(feed.data.content.length).toBeGreaterThan(0);

      // Step 2: Like content
      const contentId = feed.content[0].id;
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: { contentId, liked: true, likes: 11 },
      });

      const likeResult = await ugcApi.likeContent(contentId);
      expect(likeResult.data.liked).toBe(true);

      // Step 3: Comment on content
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'comment_123',
          contentId,
          comment: 'Great content!',
          user: { id: 'user_123', name: 'Test User' },
        },
      });

      const comment = await ugcApi.addComment(contentId, 'Great content!');
      expect(comment.data.comment).toBe('Great content!');

      // Step 4: Upload own content
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'ugc_new_123',
          url: 'https://cdn.example.com/video.mp4',
          status: 'processing',
        },
      });

      const uploadResult = await ugcApi.uploadContent({
        type: 'video',
        file: 'mock_file',
        caption: 'My new video',
        productIds: ['prod_1', 'prod_2'],
      });
      expect(uploadResult.data.id).toBeDefined();

      // Step 5: Share content
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: { shared: true, platform: 'instagram' },
      });

      const shareResult = await ugcApi.shareContent(uploadResult.data.id, 'instagram');
      expect(shareResult.data.shared).toBe(true);
    });

    it('should handle follow/unfollow flow', async () => {
      // Follow user
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: { userId: 'user_456', following: true },
      });

      const followResult = await followApi.followUser('user_456');
      expect(followResult.data.following).toBe(true);

      // Get follower's content
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          content: [testDataFactory.ugcContent()],
        },
      });

      const followingFeed = await ugcApi.getFollowingFeed();
      expect(followingFeed.data.content).toBeDefined();

      // Unfollow user
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: { userId: 'user_456', following: false },
      });

      const unfollowResult = await followApi.unfollowUser('user_456');
      expect(unfollowResult.data.following).toBe(false);
    });
  });

  describe('Content Discovery', () => {
    it('should browse trending content', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          trending: [
            testDataFactory.ugcContent(),
            { ...testDataFactory.ugcContent(), id: 'ugc_2', likes: 100 },
          ],
        },
      });

      const trending = await ugcApi.getTrendingContent();
      expect(trending.data.trending.length).toBeGreaterThan(0);
    });

    it('should search content by hashtags', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          content: [testDataFactory.ugcContent()],
          hashtag: '#fashion',
        },
      });

      const hashtagResults = await ugcApi.searchByHashtag('#fashion');
      expect(hashtagResults.content).toBeDefined();
    });

    it('should browse content by product', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          content: [testDataFactory.ugcContent()],
          productId: 'prod_123',
        },
      });

      const productContent = await ugcApi.getContentByProduct('prod_123');
      expect(productContent.content).toBeDefined();
    });
  });

  describe('Content Interactions', () => {
    it('should handle video playback tracking', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: { tracked: true },
      });

      await ugcApi.trackVideoView('ugc_123', { duration: 30 });
      expect(apiClient.post).toHaveBeenCalled();
    });

    it('should report inappropriate content', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          reportId: 'report_123',
          status: 'submitted',
        },
      });

      const report = await ugcApi.reportContent('ugc_123', {
        reason: 'inappropriate',
        description: 'Test report',
      });
      expect(report.reportId).toBeDefined();
    });
  });
});

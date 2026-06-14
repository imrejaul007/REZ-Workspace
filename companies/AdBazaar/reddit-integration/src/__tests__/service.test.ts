/** Reddit Integration - Service Tests */
import { RedditApiService } from '../services/redditApiService';
import { SubredditService } from '../services/subredditService';
import { PostService } from '../services/postService';

jest.mock('../models', () => ({
  RedditAccount: { find: jest.fn(), findById: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn() },
  RedditSubreddit: { find: jest.fn(), create: jest.fn() },
  RedditPost: { find: jest.fn(), create: jest.fn(), countDocuments: jest.fn() },
  ScheduledPost: { find: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn() },
}));

describe('RedditApiService', () => {
  let service: RedditApiService;
  beforeEach(() => { jest.clearAllMocks(); service = new RedditApiService({ accessToken: 'test-token' }); });

  describe('authenticate', () => {
    it('should authenticate with Reddit API', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'new-token' }) } as Response);
      const result = await service.authenticate('test', 'secret', 'user', 'pass');
      expect(result).toBeDefined();
    });
  });

  describe('createPost', () => {
    it('should create post via API', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'post-123' }) } as Response);
      const result = await service.createPost({ subreddit: 'test', title: 'Test', content: 'Body' });
      expect(result).toBeDefined();
    });
  });

  describe('getSubredditInfo', () => {
    it('should return subreddit info', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'r/test', subscribers: 10000 }) } as Response);
      const result = await service.getSubredditInfo('test');
      expect(result?.subscribers).toBe(10000);
    });
  });
});

describe('SubredditService', () => {
  let service: SubredditService;
  beforeEach(() => { jest.clearAllMocks(); service = new SubredditService(); });

  describe('addSubreddit', () => {
    it('should add subreddit to tracking', async () => {
      const RedditSubreddit = require('../models').RedditSubreddit;
      RedditSubreddit.create.mockResolvedValue(createMockSubreddit());
      const result = await service.addSubreddit('marketing', 'r/marketing');
      expect(result.name).toBe('marketing');
    });
  });

  describe('getSubreddits', () => {
    it('should return tracked subreddits', async () => {
      const RedditSubreddit = require('../models').RedditSubreddit;
      RedditSubreddit.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([createMockSubreddit(), createMockSubreddit({ name: 'tech' })]) });
      const result = await service.getSubreddits();
      expect(result).toHaveLength(2);
    });
  });
});

describe('PostService', () => {
  let service: PostService;
  beforeEach(() => { jest.clearAllMocks(); service = new PostService(); });

  describe('schedulePost', () => {
    it('should schedule a post', async () => {
      const ScheduledPost = require('../models').ScheduledPost;
      ScheduledPost.create.mockResolvedValue(createMockScheduledPost());
      const result = await service.schedulePost({ subreddit: 'test', title: 'Test', content: 'Body' }, new Date());
      expect(result.status).toBe('pending');
    });
  });

  describe('getScheduledPosts', () => {
    it('should return scheduled posts', async () => {
      const ScheduledPost = require('../models').ScheduledPost;
      ScheduledPost.find.mockReturnValue({ sort: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([createMockScheduledPost()]) });
      const result = await service.getScheduledPosts();
      expect(result).toHaveLength(1);
    });
  });

  describe('cancelScheduledPost', () => {
    it('should cancel scheduled post', async () => {
      const ScheduledPost = require('../models').ScheduledPost;
      ScheduledPost.findByIdAndUpdate.mockResolvedValue(createMockScheduledPost({ status: 'cancelled' }));
      const result = await service.cancelScheduledPost('sched-123');
      expect(result?.status).toBe('cancelled');
    });
  });
});
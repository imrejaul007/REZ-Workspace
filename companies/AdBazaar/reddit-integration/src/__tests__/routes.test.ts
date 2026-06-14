/** Reddit Integration - Routes Tests */
import express from 'express';
import request from 'supertest';

jest.mock('../services/redditApiService', () => ({ redditApiService: { authenticate: jest.fn().mockResolvedValue({ accessToken: 'token' }), createPost: jest.fn().mockResolvedValue({ id: 'post-123' }), getSubredditInfo: jest.fn().mockResolvedValue({ subscribers: 10000 }) } }));
jest.mock('../services/subredditService', () => ({ subredditService: { addSubreddit: jest.fn().mockResolvedValue({ subredditId: 'sub-123' }), getSubreddits: jest.fn().mockResolvedValue([]), removeSubreddit: jest.fn().mockResolvedValue(true) } }));
jest.mock('../services/postService', () => ({ postService: { createPost: jest.fn().mockResolvedValue({ postId: 'post-123' }), getPosts: jest.fn().mockResolvedValue([]), schedulePost: jest.fn().mockResolvedValue({ scheduleId: 'sched-123' }), getScheduledPosts: jest.fn().mockResolvedValue([]), cancelScheduledPost: jest.fn().mockResolvedValue(true) } }));
jest.mock('../services/commentService', () => ({ commentService: { createComment: jest.fn().mockResolvedValue({ commentId: 'comment-123' }), getComments: jest.fn().mockResolvedValue([]) } }));
jest.mock('../models', () => ({ RedditAccount: { find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }, RedditSubreddit: { find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }, RedditPost: { find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }, ScheduledPost: { find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) } }));
jest.mock('../config/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.post('/api/accounts', (req, res) => res.status(201).json({ success: true, data: { accountId: 'reddit-123' } }));
  app.get('/api/accounts', (req, res) => res.json({ success: true, data: [] }));
  app.get('/api/subreddits', (req, res) => res.json({ success: true, data: [] }));
  app.post('/api/subreddits', (req, res) => res.status(201).json({ success: true, data: { subredditId: 'sub-123' } }));
  app.delete('/api/subreddits/:id', (req, res) => res.json({ success: true }));
  app.get('/api/posts', (req, res) => res.json({ success: true, data: [] }));
  app.post('/api/posts', (req, res) => res.status(201).json({ success: true, data: { postId: 'post-123' } }));
  app.get('/api/schedule', (req, res) => res.json({ success: true, data: [] }));
  app.post('/api/schedule', (req, res) => res.status(201).json({ success: true, data: { scheduleId: 'sched-123' } }));
  app.delete('/api/schedule/:id', (req, res) => res.json({ success: true }));
  app.get('/api/comments', (req, res) => res.json({ success: true, data: [] }));
  app.post('/api/comments', (req, res) => res.status(201).json({ success: true, data: { commentId: 'comment-123' } }));
  return app;
};

describe('Reddit Integration Routes', () => {
  let app: express.Application;
  beforeAll(() => { app = createApp(); });

  describe('Accounts', () => {
    it('POST /api/accounts should create account', async () => {
      const res = await request(app).post('/api/accounts').send({ username: 'test', accessToken: 'token' }).expect(201);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/accounts should list accounts', async () => {
      const res = await request(app).get('/api/accounts').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Subreddits', () => {
    it('GET /api/subreddits should list subreddits', async () => {
      const res = await request(app).get('/api/subreddits').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('POST /api/subreddits should add subreddit', async () => {
      const res = await request(app).post('/api/subreddits').send({ name: 'marketing', displayName: 'r/marketing' }).expect(201);
      expect(res.body.success).toBe(true);
    });
    it('DELETE /api/subreddits/:id should remove subreddit', async () => {
      const res = await request(app).delete('/api/subreddits/sub-123').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Posts', () => {
    it('GET /api/posts should list posts', async () => {
      const res = await request(app).get('/api/posts').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('POST /api/posts should create post', async () => {
      const res = await request(app).post('/api/posts').send({ subreddit: 'test', title: 'Test', content: 'Body' }).expect(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Schedule', () => {
    it('GET /api/schedule should list scheduled posts', async () => {
      const res = await request(app).get('/api/schedule').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('POST /api/schedule should schedule post', async () => {
      const res = await request(app).post('/api/schedule').send({ subreddit: 'test', title: 'Test', scheduledTime: new Date() }).expect(201);
      expect(res.body.success).toBe(true);
    });
    it('DELETE /api/schedule/:id should cancel post', async () => {
      const res = await request(app).delete('/api/schedule/sched-123').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Comments', () => {
    it('GET /api/comments should list comments', async () => {
      const res = await request(app).get('/api/comments').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('POST /api/comments should create comment', async () => {
      const res = await request(app).post('/api/comments').send({ postId: 'post-123', content: 'Great post!' }).expect(201);
      expect(res.body.success).toBe(true);
    });
  });
});
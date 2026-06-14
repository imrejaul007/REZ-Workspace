/** Test Setup for Reddit Integration */
jest.mock('mongoose', () => { const m = jest.requireActual('mongoose'); return { ...m, connect: jest.fn().mockResolvedValue(m.connection), disconnect: jest.fn().mockResolvedValue(undefined), connection: { readyState: 1 } }; });
jest.mock('../config/logger', () => ({ logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() } }));
jest.mock('../config/env', () => ({ config: { port: 3000, reddit: { clientId: 'test', clientSecret: 'test', username: 'test', password: 'test' } } }));
jest.setTimeout(10000);
afterEach(() => { jest.clearAllMocks(); });
export const createMockRedditAccount = (o = {}) => ({ accountId: 'reddit-123', username: 'testuser', accessToken: 'token', refreshToken: 'refresh', isActive: true, ...o });
export const createMockSubreddit = (o = {}) => ({ subredditId: 'sub-123', name: 'test', displayName: 'r/test', subscribers: 10000, ...o });
export const createMockPost = (o = {}) => ({ postId: 'post-123', subreddit: 'test', title: 'Test Post', author: 'testuser', score: 100, ...o });
export const createMockScheduledPost = (o = {}) => ({ scheduleId: 'sched-123', subreddit: 'test', title: 'Test', scheduledTime: new Date(), status: 'pending', ...o });
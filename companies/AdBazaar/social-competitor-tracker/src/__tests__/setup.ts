/** Test Setup for Social Competitor Tracker */
jest.mock('mongoose', () => { const m = jest.requireActual('mongoose'); return { ...m, connect: jest.fn().mockResolvedValue(m.connection), disconnect: jest.fn().mockResolvedValue(undefined), connection: { readyState: 1 } }; });
jest.mock('../config/logger', () => ({ logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() } }));
jest.mock('../config', () => ({ config: { port: 3000, nodeEnv: 'test' } }));
jest.setTimeout(10000);
afterEach(() => { jest.clearAllMocks(); });
export const createMockCompetitor = (o = {}) => ({ competitorId: 'comp-123', name: 'Test Competitor', platforms: ['instagram', 'twitter'], followers: 10000, isActive: true, ...o });
export const createMockCompetitorPost = (o = {}) => ({ postId: 'post-123', competitorId: 'comp-123', platform: 'instagram', content: 'Test post', engagement: { likes: 100, comments: 10, shares: 5 }, postedAt: new Date(), ...o });
export const createMockBenchmark = (o = {}) => ({ benchmarkId: 'bench-123', name: 'Test Benchmark', metrics: { engagement: 5.5, reach: 10000, growth: 2.3 }, ...o });
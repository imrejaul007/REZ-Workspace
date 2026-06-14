/** Test Setup for Influencer Authenticity Check */
jest.mock('mongoose', () => { const m = jest.requireActual('mongoose'); return { ...m, connect: jest.fn().mockResolvedValue(m.connection), disconnect: jest.fn().mockResolvedValue(undefined), connection: { readyState: 1 } }; });
jest.mock('../utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() } }));
jest.mock('../config', () => ({ config: { port: 3000, nodeEnv: 'test' } }));
jest.setTimeout(10000);
afterEach(() => { jest.clearAllMocks(); });
export const createMockProfile = (o = {}) => ({ profileId: 'profile-123', platform: 'instagram', username: 'testuser', followers: 10000, authenticityScore: 0.85, isVerified: true, ...o });
export const createMockAuthenticityCheck = (o = {}) => ({ checkId: 'check-123', profileId: 'profile-123', status: 'completed', score: 0.9, flags: [], ...o });
export const createMockAlert = (o = {}) => ({ alertId: 'alert-123', profileId: 'profile-123', type: 'fake_followers', severity: 'high', message: 'High fake follower percentage', ...o });
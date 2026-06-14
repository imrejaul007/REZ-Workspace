/** Test Setup for Snapchat Integration */
jest.mock('mongoose', () => { const m = jest.requireActual('mongoose'); return { ...m, connect: jest.fn().mockResolvedValue(m.connection), disconnect: jest.fn().mockResolvedValue(undefined), connection: { readyState: 1 } }; });
jest.mock('../utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() } }));
jest.mock('../config', () => ({ config: { port: 3000, nodeEnv: 'test', snapchat: { apiKey: 'test-key', adAccountId: 'test-account' } } }));
jest.mock('../config/database', () => ({ connectDatabase: jest.fn().mockResolvedValue({}) }));
jest.setTimeout(10000);
afterEach(() => { jest.clearAllMocks(); });
export const createMockCampaign = (o = {}) => ({ campaignId: 'camp-123', name: 'Test Campaign', status: 'active', budget: 1000, objective: 'AWARENESS', ...o });
export const createMockAd = (o = {}) => ({ adId: 'ad-123', campaignId: 'camp-123', name: 'Test Ad', status: 'active', type: 'SINGLE_IMAGE', ...o });
export const createMockAudience = (o = {}) => ({ audienceId: 'aud-123', name: 'Test Audience', size: 5000, source: 'CUSTOMER_LIST', ...o });
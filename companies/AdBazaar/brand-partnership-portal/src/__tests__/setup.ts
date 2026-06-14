/** Test Setup for Brand Partnership Portal */
jest.mock('mongoose', () => { const m = jest.requireActual('mongoose'); return { ...m, connect: jest.fn().mockResolvedValue(m.connection), disconnect: jest.fn().mockResolvedValue(undefined), connection: { readyState: 1 } }; });
jest.mock('../utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() } }));
jest.mock('../config', () => ({ config: { port: 3000, nodeEnv: 'test' } }));
jest.setTimeout(10000);
afterEach(() => { jest.clearAllMocks(); });
export const createMockBrand = (o = {}) => ({ brandId: 'brand-123', name: 'Test Brand', industry: 'fashion', website: 'https://test.com', budget: 50000, ...o });
export const createMockCampaign = (o = {}) => ({ campaignId: 'camp-123', brandId: 'brand-123', name: 'Test Campaign', status: 'draft', budget: 10000, ...o });
export const createMockProposal = (o = {}) => ({ proposalId: 'prop-123', campaignId: 'camp-123', influencerId: 'inf-123', status: 'pending', amount: 5000, ...o });
export const createMockApplication = (o = {}) => ({ applicationId: 'app-123', campaignId: 'camp-123', influencerId: 'inf-123', status: 'submitted', ...o });
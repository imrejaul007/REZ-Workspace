/** Test Setup for Content Compliance AI */
jest.mock('mongoose', () => { const m = jest.requireActual('mongoose'); return { ...m, connect: jest.fn().mockResolvedValue(m.connection), disconnect: jest.fn().mockResolvedValue(undefined), connection: { readyState: 1 } }; });
jest.mock('../config/logger', () => ({ logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() } }));
jest.mock('../config', () => ({ config: { port: 3000, nodeEnv: 'test' } }));
jest.setTimeout(10000);
afterEach(() => { jest.clearAllMocks(); });
export const createMockComplianceRule = (o = {}) => ({ ruleId: 'rule-123', name: 'Test Rule', type: 'content_policy', isActive: true, severity: 'high', ...o });
export const createMockComplianceCheck = (o = {}) => ({ checkId: 'check-123', contentId: 'content-123', status: 'passed', score: 0.95, violations: [], ...o });
export const createMockComplianceReport = (o = {}) => ({ reportId: 'report-123', summary: 'All checks passed', totalChecks: 100, passedChecks: 95, failedChecks: 5, ...o });
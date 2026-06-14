/**
 * Test Setup for Crisis Alert Service
 */

jest.mock('mongoose', () => { const m = jest.requireActual('mongoose'); return { ...m, connect: jest.fn().mockResolvedValue(m.connection), disconnect: jest.fn().mockResolvedValue(undefined), connection: { readyState: 1 } }; });
jest.mock('../utils/logger', () => { const l = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }; return { default: l, logger: l }; });
jest.mock('../utils/metrics', () => ({ crisisMetrics: { incrementAlertsCreated: jest.fn(), incrementAlertsAcknowledged: jest.fn(), incrementAlertsEscalated: jest.fn(), incrementAlertsResolved: jest.fn(), incrementPlaybooksExecuted: jest.fn(), setActiveAlerts: jest.fn() } }));
jest.mock('../index', () => ({ io: { emit: jest.fn() } }));
jest.mock('../config', () => ({ config: { port: 3000, nodeEnv: 'test' } }));

jest.setTimeout(10000);
afterEach(() => { jest.clearAllMocks(); jest.resetModules(); });

export const createMockAlert = (overrides = {}) => ({ alertId: 'ALERT-123', severity: 'high', type: 'negative_sentiment', title: 'Test Alert', description: 'Test description', status: 'active', metrics: { mentions: 100, sentiment: -0.5 }, source: { platform: 'twitter', postId: '123' }, createdAt: new Date(), ...overrides });
export const createMockPlaybook = (overrides = {}) => ({ playbookId: 'PLAY-123', name: 'Test Playbook', triggerConditions: { sentimentThreshold: -0.5, mentionThreshold: 50 }, notifications: [{ type: 'email', recipients: ['test@example.com'] }], isActive: true, ...overrides });
export const createMockKeyword = (overrides = {}) => ({ keywordId: 'KW-123', keyword: 'brand', platforms: ['twitter', 'instagram'], alertOnMatch: true, ...overrides });
export const createMockPostMortem = (overrides = {}) => ({ postMortemId: 'PM-123', alertId: 'ALERT-123', title: 'Post-mortem Report', status: 'draft', createdAt: new Date(), ...overrides });
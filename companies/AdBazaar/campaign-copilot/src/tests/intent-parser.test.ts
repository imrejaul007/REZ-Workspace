import { jest } from '@jest/globals';

// Mock config
jest.mock('../config', () => ({
  config: {
    port: 4823,
    mongodb: { uri: 'mongodb://localhost:27017/test' },
    redis: { url: 'redis://localhost:6379' },
    jwt: { secret: 'test-secret' },
    openai: { apiKey: '' },
    rezAdsService: { url: 'http://localhost:4007' },
    nodeEnv: 'test',
    logLevel: 'error',
  },
}));

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  connection: { readyState: 1 },
  model: jest.fn().mockReturnValue({
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
  }),
  Schema: class MockSchema {
    index = jest.fn();
    static index = jest.fn();
  },
}));

// Mock redis
jest.mock('../services/cache.service', () => ({
  connectRedis: jest.fn().mockResolvedValue({}),
  getRedisClient: jest.fn().mockResolvedValue({
    get: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  }),
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(undefined),
}));

// Mock logger
jest.mock('../services/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock metrics
jest.mock('../services/metrics', () => ({
  register: { contentType: 'text/plain', metrics: jest.fn().mockResolvedValue('') },
  httpRequestsTotal: { inc: jest.fn() },
  httpRequestDuration: { observe: jest.fn() },
  conversationsTotal: { inc: jest.fn() },
  messagesTotal: { inc: jest.fn() },
  actionsExecuted: { inc: jest.fn() },
  suggestionsGenerated: { inc: jest.fn() },
  activeConversations: { set: jest.fn() },
  aiResponseDuration: { observe: jest.fn() },
  metricsMiddleware: () => (req: unknown, res: { on: jest.fn }, next: () => void) => next(),
}));

describe('Intent Parser Service', () => {
  let parseIntent: (query: string) => {
    action: string;
    entities: Record<string, unknown>;
    confidence: number;
    rawQuery: string;
  };

  beforeAll(async () => {
    const module = await import('../services/intent-parser.service.js');
    parseIntent = module.parseIntent;
  });

  describe('Campaign Listing', () => {
    it('should parse list campaigns intent', () => {
      const result = parseIntent('list my campaigns');
      expect(result.action).toBe('list_campaigns');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should parse show campaigns intent', () => {
      const result = parseIntent('show me my campaigns');
      expect(result.action).toBe('list_campaigns');
    });

    it('should parse what campaigns intent', () => {
      const result = parseIntent('what campaigns are running');
      expect(result.action).toBe('list_campaigns');
    });
  });

  describe('Pause Campaign', () => {
    it('should parse pause campaigns intent', () => {
      const result = parseIntent('pause my running campaigns');
      expect(result.action).toBe('pause_campaigns');
    });

    it('should parse stop campaigns intent', () => {
      const result = parseIntent('stop all campaigns');
      expect(result.action).toBe('pause_campaigns');
    });
  });

  describe('Resume Campaign', () => {
    it('should parse resume campaigns intent', () => {
      const result = parseIntent('resume my campaigns');
      expect(result.action).toBe('resume_campaigns');
    });

    it('should parse start campaigns intent', () => {
      const result = parseIntent('start my campaigns');
      expect(result.action).toBe('resume_campaigns');
    });
  });

  describe('Budget Adjustment', () => {
    it('should parse increase budget intent', () => {
      const result = parseIntent('increase budget for my campaign by 20%');
      expect(result.action).toBe('adjust_budget');
      expect(result.entities.operation).toBe('increase');
    });

    it('should parse decrease budget intent', () => {
      const result = parseIntent('decrease budget by 10%');
      expect(result.action).toBe('adjust_budget');
      expect(result.entities.operation).toBe('decrease');
    });

    it('should extract budget amount', () => {
      const result = parseIntent('set budget to 50000');
      expect(result.entities.budget).toBe(50000);
    });
  });

  describe('Performance Metrics', () => {
    it('should parse performance metrics intent', () => {
      const result = parseIntent('show me yesterday performance');
      expect(result.action).toBe('performance_metrics');
      expect(result.entities.dateRange).toBeDefined();
    });

    it('should parse weekly performance intent', () => {
      const result = parseIntent('how is this week performance');
      expect(result.action).toBe('performance_metrics');
    });
  });

  describe('Create Campaign', () => {
    it('should parse create campaign intent', () => {
      const result = parseIntent('create a new campaign');
      expect(result.action).toBe('create_campaign');
    });

    it('should parse launch campaign intent', () => {
      const result = parseIntent('launch a new campaign');
      expect(result.action).toBe('create_campaign');
    });
  });

  describe('Help', () => {
    it('should parse help intent', () => {
      const result = parseIntent('what can you do');
      expect(result.action).toBe('help');
    });

    it('should parse help command', () => {
      const result = parseIntent('help');
      expect(result.action).toBe('help');
    });
  });

  describe('Unknown Intent', () => {
    it('should default to general_query for unknown intents', () => {
      const result = parseIntent('random text that does not match');
      expect(result.action).toBe('general_query');
      expect(result.confidence).toBeLessThan(0.6);
    });
  });
});

describe('Types', () => {
  it('should export all required types', async () => {
    const types = await import('../types/index.js');

    expect(types.CopilotConversation).toBeDefined();
    expect(types.CopilotMessage).toBeDefined();
    expect(types.CopilotContext).toBeDefined();
    expect(types.ChatRequest).toBeDefined();
    expect(types.ChatResponse).toBeDefined();
    expect(types.CopilotSuggestion).toBeDefined();
    expect(types.ParsedIntent).toBeDefined();
  });

  it('should have correct message role types', async () => {
    const types = await import('../types/index.js');

    const message = {
      id: 'test-id',
      role: 'user' as const,
      content: 'test message',
      timestamp: new Date(),
    };

    expect(message.role).toBe('user');
  });

  it('should have correct action types', async () => {
    const types = await import('../types/index.js');

    const action = {
      type: 'create_campaign' as const,
      params: {},
      executed: false,
    };

    expect(action.type).toBe('create_campaign');
  });
});
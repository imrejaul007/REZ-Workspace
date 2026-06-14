// Merchant AI Employee UI - Unit Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock mongoose before importing services
vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    model: vi.fn(() => ({
      find: vi.fn(),
      findById: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findByIdAndDelete: vi.fn(),
      deleteMany: vi.fn(),
      countDocuments: vi.fn(),
    })),
  },
  Schema: class MockSchema {
    index() {}
  },
  model: vi.fn(),
}));

vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('AIGentConfigSchema Validation', () => {
  it('should validate correct agent config', async () => {
    const { AIGentConfigSchema } = await import('../src/types');

    const validConfig = {
      merchantId: 'merchant_123',
      agentType: 'support',
      name: 'Test Agent',
      personality: {
        tone: 'friendly',
        responseLength: 'medium',
        language: 'en',
      },
      capabilities: {
        maxConcurrentConversations: 10,
        autoEscalation: true,
        sentimentAnalysis: true,
        multiTurnMemory: true,
        productRecommendations: false,
        dynamicPricing: false,
      },
      operatingHours: {
        enabled: true,
        timezone: 'Asia/Kolkata',
      },
      escalationSettings: {
        autoEscalateOnSentiment: true,
        sentimentThreshold: -0.5,
        maxBotHandoffs: 3,
        handoffDelaySeconds: 30,
      },
    };

    const result = AIGentConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it('should reject missing required fields', async () => {
    const { AIGentConfigSchema } = await import('../src/types');

    const invalidConfig = {
      merchantId: 'merchant_123',
      // missing name and agentType
    };

    const result = AIGentConfigSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });

  it('should reject invalid agent type', async () => {
    const { AIGentConfigSchema } = await import('../src/types');

    const invalidConfig = {
      merchantId: 'merchant_123',
      agentType: 'invalid_type',
      name: 'Test Agent',
      personality: {
        tone: 'friendly',
        responseLength: 'medium',
        language: 'en',
      },
      capabilities: {
        maxConcurrentConversations: 10,
        autoEscalation: true,
        sentimentAnalysis: true,
        multiTurnMemory: true,
        productRecommendations: false,
        dynamicPricing: false,
      },
      operatingHours: {
        enabled: true,
        timezone: 'Asia/Kolkata',
      },
      escalationSettings: {
        autoEscalateOnSentiment: true,
        sentimentThreshold: -0.5,
        maxBotHandoffs: 3,
        handoffDelaySeconds: 30,
      },
    };

    const result = AIGentConfigSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });
});

describe('TrainingDataSchema Validation', () => {
  it('should validate correct training data', async () => {
    const { TrainingDataSchema } = await import('../src/types');

    const validData = {
      merchantId: 'merchant_123',
      type: 'faq',
      question: 'What are your hours?',
      answer: 'We are open 9-5',
      metadata: {
        category: 'general',
        tags: ['hours', 'location'],
      },
    };

    const result = TrainingDataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject empty question', async () => {
    const { TrainingDataSchema } = await import('../src/types');

    const invalidData = {
      merchantId: 'merchant_123',
      type: 'faq',
      question: '',
      answer: 'We are open 9-5',
    };

    const result = TrainingDataSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('AgentType Enum', () => {
  it('should have correct agent types', async () => {
    const { AgentType } = await import('../src/types');

    expect(AgentType.SUPPORT).toBe('support');
    expect(AgentType.SALES).toBe('sales');
    expect(AgentType.CONVERSATIONAL).toBe('conversational');
    expect(AgentType.ANALYTICS).toBe('analytics');
    expect(AgentType.ESCALATION).toBe('escalation');
  });
});

describe('AgentStatus Enum', () => {
  it('should have correct statuses', async () => {
    const { AgentStatus } = await import('../src/types');

    expect(AgentStatus.ACTIVE).toBe('active');
    expect(AgentStatus.INACTIVE).toBe('inactive');
    expect(AgentStatus.TRAINING).toBe('training');
    expect(AgentStatus.ERROR).toBe('error');
  });
});

describe('TrainingDataType Enum', () => {
  it('should have correct types', async () => {
    const { TrainingDataType } = await import('../src/types');

    expect(TrainingDataType.FAQ).toBe('faq');
    expect(TrainingDataType.PRODUCT).toBe('product');
    expect(TrainingDataType.POLICY).toBe('policy');
    expect(TrainingDataType.CONVERSATION).toBe('conversation');
    expect(TrainingDataType.CUSTOM).toBe('custom');
  });
});

describe('API Response Structure', () => {
  it('should have correct success response structure', async () => {
    const { APIResponseSchema } = await import('../src/types');

    const successResponse = {
      success: true,
      data: { agentId: 'agent_123' },
    };

    const result = APIResponseSchema.safeParse(successResponse);
    expect(result.success).toBe(true);
  });

  it('should have correct error response structure', async () => {
    const { APIResponseSchema } = await import('../src/types');

    const errorResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Agent not found',
      },
    };

    const result = APIResponseSchema.safeParse(errorResponse);
    expect(result.success).toBe(true);
  });
});

describe('EmployeeContext', () => {
  it('should validate correct employee context', async () => {
    const { EmployeeContextSchema } = await import('../src/types');

    const validContext = {
      id: 'emp_123',
      merchantId: 'merchant_123',
      employeeId: 'user_456',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'manager',
      permissions: ['agents:read', 'agents:write'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = EmployeeContextSchema.safeParse(validContext);
    expect(result.success).toBe(true);
  });
});

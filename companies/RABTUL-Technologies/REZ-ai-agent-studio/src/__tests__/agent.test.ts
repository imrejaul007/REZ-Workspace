/**
 * AI Agent Studio Tests
 * Tests for agent creation, conversation, and response generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface Agent {
  id: string;
  name: string;
  type: 'customer_support' | 'sales' | 'marketing' | 'operations' | 'custom';
  instructions: string;
  capabilities: string[];
  model?: string;
  status: 'active' | 'inactive' | 'training';
}

interface Conversation {
  id: string;
  agentId: string;
  userId: string;
  messages: Message[];
  status: 'active' | 'ended';
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Agent validation
function validateAgent(agent: Partial<Agent>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!agent.name || agent.name.trim().length < 2) {
    errors.push('name must be at least 2 characters');
  }

  if (!agent.type) {
    errors.push('type is required');
  }

  const validTypes = ['customer_support', 'sales', 'marketing', 'operations', 'custom'];
  if (agent.type && !validTypes.includes(agent.type)) {
    errors.push('type must be one of: ' + validTypes.join(', '));
  }

  return { valid: errors.length === 0, errors };
}

// Conversation management
function createConversation(agentId: string, userId: string): Conversation {
  return {
    id: `conv_${Date.now()}`,
    agentId,
    userId,
    messages: [],
    status: 'active',
  };
}

function addMessage(conversation: Conversation, role: Message['role'], content: string): Message {
  const message: Message = {
    id: `msg_${Date.now()}`,
    role,
    content,
  };
  conversation.messages.push(message);
  return message;
}

// Response generation (mock)
function generateResponse(
  messages: Message[],
  agent: Agent
): string {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();

  if (!lastUserMessage) {
    return `Hello! I'm ${agent.name}. How can I help you today?`;
  }

  // Simple keyword-based response
  const content = lastUserMessage.content.toLowerCase();

  if (content.includes('order')) {
    return "I can help you with your order. What's your order ID?";
  }
  if (content.includes('return') || content.includes('refund')) {
    return "I understand you want to return an item. Let me help you with that process.";
  }
  if (content.includes('payment') || content.includes('bill')) {
    return "For payment inquiries, I can check your billing history. What would you like to know?";
  }
  if (content.includes('hello') || content.includes('hi')) {
    return "Hello! How can I assist you today?";
  }

  return "Thank you for your message. How else can I help you?";
}

// Intent detection
function detectIntent(message: string): string {
  const content = message.toLowerCase();

  if (/order|tracking|delivery/.test(content)) return 'order_inquiry';
  if (/return|refund|exchange/.test(content)) return 'return_request';
  if (/payment|bill|charge|invoice/.test(content)) return 'payment_inquiry';
  if (/complaint|issue|problem|broken/.test(content)) return 'complaint';
  if (/hello|hi|hey/.test(content)) return 'greeting';

  return 'general';
}

// Sentiment analysis (mock)
function analyzeSentiment(text: string): { score: number; label: 'positive' | 'neutral' | 'negative' } {
  const positive = ['great', 'excellent', 'amazing', 'thank', 'love', 'happy', 'good', 'wonderful'];
  const negative = ['bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'disappointed', 'worst'];

  const words = text.toLowerCase().split(/\s+/);
  let score = 0;

  for (const word of words) {
    if (positive.includes(word)) score += 1;
    if (negative.includes(word)) score -= 1;
  }

  let label: 'positive' | 'neutral' | 'negative';
  if (score > 0) label = 'positive';
  else if (score < 0) label = 'negative';
  else label = 'neutral';

  return { score, label };
}

describe('Agent Validation', () => {
  it('should validate complete agent', () => {
    const agent: Partial<Agent> = {
      name: 'Sales Bot',
      type: 'sales',
      instructions: 'Help customers with purchases',
    };
    const result = validateAgent(agent);
    expect(result.valid).toBe(true);
  });

  it('should reject short name', () => {
    const agent: Partial<Agent> = { name: 'A', type: 'support' };
    const result = validateAgent(agent);
    expect(result.valid).toBe(false);
  });

  it('should reject invalid type', () => {
    const agent: Partial<Agent> = { name: 'Test Bot', type: 'invalid' };
    const result = validateAgent(agent);
    expect(result.valid).toBe(false);
  });
});

describe('Conversation Management', () => {
  let conversation: Conversation;

  beforeEach(() => {
    conversation = createConversation('agent_1', 'user_123');
  });

  it('should create conversation', () => {
    expect(conversation.agentId).toBe('agent_1');
    expect(conversation.userId).toBe('user_123');
    expect(conversation.status).toBe('active');
  });

  it('should add user message', () => {
    const message = addMessage(conversation, 'user', 'Hello there');
    expect(message.role).toBe('user');
    expect(conversation.messages).toHaveLength(1);
  });

  it('should add assistant message', () => {
    addMessage(conversation, 'user', 'Hello');
    const response = addMessage(conversation, 'assistant', 'Hi! How can I help?');
    expect(response.role).toBe('assistant');
  });
});

describe('Response Generation', () => {
  const agent: Agent = {
    id: 'agent_1',
    name: 'Support Bot',
    type: 'customer_support',
    instructions: 'Help customers',
    capabilities: ['order_status', 'returns', 'general'],
    status: 'active',
  };

  it('should generate contextual response for order', () => {
    const messages: Message[] = [
      { id: '1', role: 'user', content: 'Where is my order?' },
    ];
    const response = generateResponse(messages, agent);
    expect(response).toContain('order');
  });

  it('should generate response for return request', () => {
    const messages: Message[] = [
      { id: '1', role: 'user', content: 'I want to return my item' },
    ];
    const response = generateResponse(messages, agent);
    expect(response).toContain('return');
  });

  it('should handle greeting', () => {
    const messages: Message[] = [
      { id: '1', role: 'user', content: 'Hi there!' },
    ];
    const response = generateResponse(messages, agent);
    expect(response).toContain('Hello');
  });
});

describe('Intent Detection', () => {
  it('should detect order inquiry', () => {
    expect(detectIntent('Where is my order?')).toBe('order_inquiry');
    expect(detectIntent('Track my delivery')).toBe('order_inquiry');
  });

  it('should detect return request', () => {
    expect(detectIntent('I want a refund')).toBe('return_request');
    expect(detectIntent('How do I return?')).toBe('return_request');
  });

  it('should detect payment inquiry', () => {
    expect(detectIntent('My bill is wrong')).toBe('payment_inquiry');
    expect(detectIntent('Payment issue')).toBe('payment_inquiry');
  });

  it('should detect greeting', () => {
    expect(detectIntent('Hello!')).toBe('greeting');
    expect(detectIntent('Hey there')).toBe('greeting');
  });
});

describe('Sentiment Analysis', () => {
  it('should detect positive sentiment', () => {
    const result = analyzeSentiment('This is great, thank you!');
    expect(result.label).toBe('positive');
    expect(result.score).toBeGreaterThan(0);
  });

  it('should detect negative sentiment', () => {
    const result = analyzeSentiment('This is terrible, I am frustrated');
    expect(result.label).toBe('negative');
    expect(result.score).toBeLessThan(0);
  });

  it('should detect neutral sentiment', () => {
    const result = analyzeSentiment('I have a question');
    expect(result.label).toBe('neutral');
    expect(result.score).toBe(0);
  });
});

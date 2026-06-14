/**
 * AI Agent Models
 */

export type AgentType = 'customer_support' | 'sales' | 'marketing' | 'operations' | 'custom';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  instructions: string;
  capabilities: string[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  status: 'active' | 'inactive' | 'training';
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: { type: string; url: string }[];
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  agentId: string;
  userId: string;
  status: 'active' | 'ended';
  messages: Message[];
  context?: Record<string, unknown>;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentMetrics {
  agentId: string;
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  avgResponseTime: number;
  satisfactionScore?: number;
  period: {
    start: Date;
    end: Date;
  };
}

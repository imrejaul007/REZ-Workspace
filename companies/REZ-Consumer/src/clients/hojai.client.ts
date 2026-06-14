/**
 * HOJAI AI Services Client
 * Genie (Memory, Relations, Briefing) + Intelligence Suite
 */

import axios, { AxiosInstance } from 'axios';
import { config, hojaiServices } from '../config';
import type { APIResponse } from '../types';

// Create client factory
function createClient(baseURL: string, timeout: number = 10000): AxiosInstance {
  return axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': config.internalToken,
      'X-Service-Name': 'REZ-Consumer',
    },
  });
}

// Service clients
const genieMemoryClient = createClient(hojaiServices.GENIE_MEMORY.url, hojaiServices.GENIE_MEMORY.timeout);
const genieRelationClient = createClient(hojaiServices.GENIE_RELATION.url, hojaiServices.GENIE_RELATION.timeout);
const genieBriefingClient = createClient(hojaiServices.GENIE_BRIEFING.url, hojaiServices.GENIE_BRIEFING.timeout);
const commerceAIClient = createClient(hojaiServices.COMMERCE_AI.url, hojaiServices.COMMERCE_AI.timeout);
const customerAIClient = createClient(hojaiServices.CUSTOMER_AI.url, hojaiServices.CUSTOMER_AI.timeout);
const marketingAIClient = createClient(hojaiServices.MARKETING_AI.url, hojaiServices.MARKETING_AI.timeout);
const financialAIClient = createClient(hojaiServices.FINANCIAL_AI.url, hojaiServices.FINANCIAL_AI.timeout);
const hojaiMemoryClient = createClient(hojaiServices.MEMORY.url, hojaiServices.MEMORY.timeout);
const hojaiAgentsClient = createClient(hojaiServices.AGENTS.url, hojaiServices.AGENTS.timeout);
const voiceOSClient = createClient(hojaiServices.VOICE_OS.url, hojaiServices.VOICE_OS.timeout);
const voiceAgentsClient = createClient(hojaiServices.VOICE_AGENTS.url, hojaiServices.VOICE_AGENTS.timeout);

// Safe API call helper
async function safeCall<T>(
  client: AxiosInstance,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  data?: unknown
): Promise<APIResponse<T> | null> {
  try {
    const response = await client.request({ method, url: path, data });
    return response.data;
  } catch (error) {
    console.error(`HOJAI API Error [${method} ${path}]:`, error);
    return null;
  }
}

// ============================================
// GENIE MEMORY SERVICE
// ============================================

export const genieMemoryService = {
  async remember(userId: string, content: string, importance: number = 5): Promise<APIResponse> {
    return safeCall(genieMemoryClient, 'POST', '/api/v1/remember', {
      user_id: userId,
      content,
      importance,
      type: 'personal_experience',
    }) || { success: false, error: 'Memory service unavailable', timestamp: new Date() };
  },

  async recall(userId: string, query: string): Promise<APIResponse> {
    return safeCall(genieMemoryClient, 'POST', '/api/v1/recall', { user_id: userId, query }) || {
      success: false,
      error: 'Recall failed',
      timestamp: new Date(),
    };
  },

  async getMemories(userId: string, limit: number = 20): Promise<APIResponse> {
    return safeCall(genieMemoryClient, 'POST', '/api/v1/memories', { user_id: userId, limit }) || {
      success: false,
      error: 'Failed to get memories',
      timestamp: new Date(),
    };
  },
};

// ============================================
// GENIE RELATION SERVICE
// ============================================

export const genieRelationService = {
  async track(userId: string, targetId: string, type: string, strength: number = 50): Promise<APIResponse> {
    return safeCall(genieRelationClient, 'POST', '/api/v1/track', {
      user_id: userId,
      target_id: targetId,
      type,
      strength,
    }) || { success: false, error: 'Relationship tracking failed', timestamp: new Date() };
  },

  async getRelationships(userId: string): Promise<APIResponse> {
    return safeCall(genieRelationClient, 'POST', '/api/v1/relationships', { user_id: userId }) || {
      success: false,
      error: 'Failed to get relationships',
      timestamp: new Date(),
    };
  },

  async getInsights(userId: string): Promise<APIResponse> {
    return safeCall(genieRelationClient, 'POST', '/api/v1/insights', { user_id: userId }) || {
      success: false,
      error: 'Failed to get insights',
      timestamp: new Date(),
    };
  },
};

// ============================================
// GENIE BRIEFING SERVICE
// ============================================

export const genieBriefingService = {
  async generate(userId: string, date?: string): Promise<APIResponse> {
    return safeCall(genieBriefingClient, 'POST', '/api/v1/generate', {
      user_id: userId,
      date: date || new Date().toISOString().split('T')[0],
    }) || { success: false, error: 'Briefing generation failed', timestamp: new Date() };
  },

  async get(userId: string, date?: string): Promise<APIResponse> {
    return safeCall(genieBriefingClient, 'POST', '/api/v1/briefing', {
      user_id: userId,
      date: date || new Date().toISOString().split('T')[0],
    }) || { success: false, error: 'Failed to get briefing', timestamp: new Date() };
  },

  async getWeekly(userId: string): Promise<APIResponse> {
    return safeCall(genieBriefingClient, 'POST', '/api/v1/weekly', { user_id: userId }) || {
      success: false,
      error: 'Failed to get weekly briefing',
      timestamp: new Date(),
    };
  },
};

// ============================================
// INTELLIGENCE SUITE
// ============================================

export const commerceAIService = {
  async analyze(userId: string, data: unknown): Promise<APIResponse> {
    return safeCall(commerceAIClient, 'POST', '/api/analyze', { user_id: userId, ...data }) || {
      success: false,
      error: 'Commerce AI unavailable',
      timestamp: new Date(),
    };
  },
};

export const customerAIService = {
  async analyze(userId: string, data: unknown): Promise<APIResponse> {
    return safeCall(customerAIClient, 'POST', '/api/analyze', { user_id: userId, ...data }) || {
      success: false,
      error: 'Customer AI unavailable',
      timestamp: new Date(),
    };
  },
};

export const marketingAIService = {
  async getOffers(userId: string): Promise<APIResponse> {
    return safeCall(marketingAIClient, 'POST', '/api/offers', { user_id: userId }) || {
      success: false,
      error: 'Marketing AI unavailable',
      timestamp: new Date(),
    };
  },
};

export const financialAIService = {
  async getInsights(userId: string): Promise<APIResponse> {
    return safeCall(financialAIClient, 'POST', '/api/insights', { user_id: userId }) || {
      success: false,
      error: 'Financial AI unavailable',
      timestamp: new Date(),
    };
  },
};

// ============================================
// VOICE SERVICES
// ============================================

export const voiceOSService = {
  async synthesize(text: string): Promise<APIResponse> {
    return safeCall(voiceOSClient, 'POST', '/api/synthesize', { text }) || {
      success: false,
      error: 'Voice OS unavailable',
      timestamp: new Date(),
    };
  },
};

export const voiceAgentsService = {
  async chat(userId: string, message: string): Promise<APIResponse> {
    return safeCall(voiceAgentsClient, 'POST', '/api/chat', { user_id: userId, message }) || {
      success: false,
      error: 'Voice agents unavailable',
      timestamp: new Date(),
    };
  },
};

// Export all as namespace
export const hojaiServices = {
  genieMemory: genieMemoryService,
  genieRelation: genieRelationService,
  genieBriefing: genieBriefingService,
  commerceAI: commerceAIService,
  customerAI: customerAIService,
  marketingAI: marketingAIService,
  financialAI: financialAIService,
  voiceOS: voiceOSService,
  voiceAgents: voiceAgentsService,
};
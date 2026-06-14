/**
 * AI Chat Service - REZ Support Copilot Integration
 *
 * Connects to the REZ-support-copilot service for AI-powered chat responses.
 * Provides intent detection and knowledge base search capabilities.
 */

import axios from 'axios';

const SUPPORT_COPILOT_URL =
  process.env.REZ_SUPPORT_COPILOT_URL || 'https://REZ-support-copilot.onrender.com';
const SEARCH_SERVICE_URL =
  process.env.REZ_SEARCH_URL || 'https://rez-search-service.onrender.com';
const KNOWLEDGE_BASE_URL =
  process.env.KNOWLEDGE_BASE_URL || 'https://rez-knowledge-base-service.onrender.com';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
  metadata?: {
    intent?: string;
    confidence?: number;
    entities?: Record<string, unknown>;
    actions?: Array<{
      type: string;
      label: string;
      data?: Record<string, unknown>;
    }>;
  };
}

export interface SendMessageParams {
  merchantId: string;
  userId: string;
  message: string;
  sessionId?: string;
  context?: {
    location?: { lat: number; lng: number };
    preferences?: string[];
    orderHistory?: string[];
    storeSlug?: string;
    storeType?: string;
  };
}

export interface IntentDetectionResult {
  intent: string;
  confidence: number;
  entities?: Record<string, unknown>;
}

export interface KnowledgeResult {
  id: string;
  title: string;
  content: string;
  relevanceScore: number;
  source?: string;
  url?: string;
}

// ── Service Class ───────────────────────────────────────────────────────────────

export class AIChatService {
  private client = axios.create({
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Send a message to the AI chat and receive a response.
   */
  async sendMessage(params: SendMessageParams): Promise<ChatMessage> {
    try {
      const response = await this.client.post(`${SUPPORT_COPILOT_URL}/api/chat`, {
        merchantId: params.merchantId,
        userId: params.userId,
        message: params.message,
        sessionId: params.sessionId,
        context: params.context,
      });

      const data = response.data;

      return {
        id: data.id || `msg_${Date.now()}`,
        content: data.content || data.message || '',
        sender: 'ai' as const,
        timestamp: new Date(data.timestamp || Date.now()),
        metadata: {
          intent: data.intent,
          confidence: data.confidence,
          entities: data.entities,
          actions: data.actions,
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(
            `AI Chat error: ${error.response.status} - ${error.response.data?.message || error.message}`
          );
        } else if (error.request) {
          throw new Error('AI Chat service is unavailable. Please try again later.');
        }
      }
      throw new Error('Failed to send message to AI Chat');
    }
  }

  /**
   * Detect user intent from a message without sending a full chat response.
   */
  async detectIntent(message: string): Promise<IntentDetectionResult> {
    try {
      const response = await this.client.post(`${SUPPORT_COPILOT_URL}/api/intent/detect`, {
        message,
      });
      return {
        intent: response.data.intent || 'unknown',
        confidence: response.data.confidence || 0,
        entities: response.data.entities,
      };
    } catch {
      return { intent: 'unknown', confidence: 0 };
    }
  }

  /**
   * Search the knowledge base for relevant articles.
   */
  async searchKnowledge(
    query: string,
    merchantId?: string
  ): Promise<KnowledgeResult[]> {
    try {
      const response = await this.client.post(`${SEARCH_SERVICE_URL}/api/search`, {
        query,
        merchantId,
        limit: 5,
      });
      return response.data.results || [];
    } catch {
      return [];
    }
  }

  /**
   * Search the REZ Knowledge Base service for articles.
   */
  async searchKnowledgeBase(
    query: string,
    category?: string
  ): Promise<KnowledgeResult[]> {
    try {
      const response = await this.client.post(`${KNOWLEDGE_BASE_URL}/api/articles/search`, {
        query,
        category,
        limit: 5,
      });
      return response.data.articles || response.data.results || [];
    } catch {
      return [];
    }
  }

  /**
   * Get a quick response for common intents (FAQ, greetings, etc.).
   */
  async getQuickResponse(
    intent: string,
    context?: Record<string, unknown>
  ): Promise<string | null> {
    try {
      const response = await this.client.post(`${SUPPORT_COPILOT_URL}/api/quick-response`, {
        intent,
        context,
      });
      return response.data.response || null;
    } catch {
      return null;
    }
  }

  /**
   * Start a new chat session.
   */
  async createSession(userId: string, merchantId: string): Promise<string> {
    try {
      const response = await this.client.post(`${SUPPORT_COPILOT_URL}/api/session`, {
        userId,
        merchantId,
      });
      return response.data.sessionId;
    } catch {
      return `session_${Date.now()}_${userId}`;
    }
  }
}

// ── Singleton Export ─────────────────────────────────────────────────────────────

export const aiChatService = new AIChatService();

// ── Quick Action Helpers ────────────────────────────────────────────────────────

export const QUICK_ACTIONS = {
  ORDER: { id: 'order', label: 'Order', icon: 'shopping-bag' },
  BOOK: { id: 'book', label: 'Book', icon: 'calendar' },
  ENQUIRE: { id: 'enquire', label: 'Enquire', icon: 'help-circle' },
} as const;

export type QuickActionType = 'order' | 'book' | 'enquire';

export const QUICK_ACTION_MESSAGES: Record<QuickActionType, string> = {
  order: "I'd like to place an order",
  book: "I'd like to make a reservation",
  enquire: 'I have a question',
};

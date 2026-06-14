// AI Support Service
// Connects to REZ-support-copilot for AI-powered customer support

import axios, { AxiosError } from 'axios';
import { logger } from '@/utils/logger';

const SUPPORT_COPILOT_URL = process.env.EXPO_PUBLIC_SUPPORT_COPILOT_URL || 'https://REZ-support-copilot.onrender.com';

export interface AIChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
  intent?: string;
  confidence?: number;
  quickReplies?: QuickReply[];
}

export interface QuickReply {
  id: string;
  text: string;
  value: string;
  icon?: string;
}

export interface SendMessageParams {
  merchantId: string;
  userId: string;
  message: string;
  sessionId?: string;
  context?: {
    orderId?: string;
    productId?: string;
    storeId?: string;
  };
}

export interface IntentDetectionResult {
  intent: string;
  confidence: number;
  suggestedActions?: string[];
}

export interface AIUserProfile {
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  tier?: string;
  totalOrders?: number;
  recentOrders?: RecentOrder[];
}

export interface RecentOrder {
  orderId: string;
  orderNumber: string;
  storeName: string;
  status: string;
  total: number;
  createdAt: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

class AISupportService {
  private axiosInstance = axios.create({
    baseURL: SUPPORT_COPILOT_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        logger.debug('AI Support API request', {
          method: config.method?.toUpperCase(),
          url: config.url,
        });
        return config;
      },
      (error) => {
        logger.error('AI Support API request error', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
        logger.error('AI Support API response error', { message: errorMessage, status: error.response?.status });
        return Promise.reject(new Error(errorMessage));
      }
    );
  }

  /**
   * Send a message to the AI support copilot
   */
  async sendMessage(params: SendMessageParams): Promise<AIChatMessage> {
    try {
      const response = await this.axiosInstance.post<AIChatMessage>('/api/chat', {
        merchantId: params.merchantId,
        userId: params.userId,
        message: params.message,
        sessionId: params.sessionId,
        context: params.context,
      });

      // Normalize timestamp to Date object if it's a string
      const message = response.data;
      if (typeof message.timestamp === 'string') {
        message.timestamp = new Date(message.timestamp);
      }

      return message;
    } catch (error) {
      logger.error('AI sendMessage failed', error);
      throw error;
    }
  }

  /**
   * Detect user intent from a message
   */
  async detectIntent(message: string): Promise<IntentDetectionResult> {
    try {
      const response = await this.axiosInstance.post<IntentDetectionResult>('/api/intent/detect', { message });
      return response.data;
    } catch (error) {
      logger.error('AI detectIntent failed', error);
      throw error;
    }
  }

  /**
   * Get user profile information for context
   */
  async getUserProfile(userId: string): Promise<AIUserProfile> {
    try {
      const response = await this.axiosInstance.get<AIUserProfile>(`/api/user/${userId}`);
      return response.data;
    } catch (error) {
      logger.error('AI getUserProfile failed', error);
      throw error;
    }
  }

  /**
   * Get conversation history for a session
   */
  async getConversationHistory(sessionId: string): Promise<AIChatMessage[]> {
    try {
      const response = await this.axiosInstance.get<AIChatMessage[]>(`/api/chat/history/${sessionId}`);
      return response.data.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    } catch (error) {
      logger.error('AI getConversationHistory failed', error);
      throw error;
    }
  }

  /**
   * Start a new chat session
   */
  async startSession(userId: string, merchantId: string): Promise<{ sessionId: string }> {
    try {
      const response = await this.axiosInstance.post<{ sessionId: string }>('/api/chat/session', {
        userId,
        merchantId,
      });
      return response.data;
    } catch (error) {
      logger.error('AI startSession failed', error);
      throw error;
    }
  }

  /**
   * End a chat session
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/api/chat/session/${sessionId}`);
    } catch (error) {
      logger.error('AI endSession failed', error);
      throw error;
    }
  }

  /**
   * Get suggested FAQs based on user context
   */
  async getSuggestedFAQs(userId: string): Promise<FAQSuggestion[]> {
    try {
      const response = await this.axiosInstance.get<FAQSuggestion[]>(`/api/faq/suggested/${userId}`);
      return response.data;
    } catch (error) {
      logger.error('AI getSuggestedFAQs failed', error);
      throw error;
    }
  }

  /**
   * Check if AI support is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export interface FAQSuggestion {
  id: string;
  question: string;
  answer: string;
  category: string;
  relevanceScore: number;
  helpful?: boolean;
  articleUrl?: string;
}

export const aiSupportService = new AISupportService();
export default aiSupportService;

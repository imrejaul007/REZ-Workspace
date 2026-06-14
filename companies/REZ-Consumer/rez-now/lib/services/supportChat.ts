/**
 * REZ Support Chat Service for REZ Now
 *
 * Provides AI-powered customer support chat for merchants scanned via QR.
 * Now integrates with REZ Care Service (4058) + REZ-support-copilot (4033)
 *
 * Architecture:
 * - REZ Care (4058) - Central hub for tickets, escalations, CSAT
 * - REZ-support-copilot (4033) - AI chat, sentiment, suggestions
 */

import { publicClient } from '@/lib/client';

// Service URLs
const SUPPORT_COPILOT_URL = process.env.NEXT_PUBLIC_SUPPORT_COPILOT_URL || 'https://rez-support-copilot.onrender.com';
const REZ_CARE_URL = process.env.NEXT_PUBLIC_REZ_CARE_URL || 'https://rez-care.onrender.com';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface MerchantContext {
  merchantId: string;
  merchantName: string;
  merchantType: 'restaurant' | 'hotel' | 'retail' | 'general';
  businessInfo?: {
    type?: string;
    policies?: Record<string, unknown>;
    operatingHours?: string;
    contactPhone?: string;
  };
  storeSlug?: string;
  tableNumber?: string;
  roomCode?: string;
}

export interface ChatSession {
  sessionId: string;
  merchantContext: MerchantContext;
  customerId?: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'staff';
  content: string;
  timestamp: string;
  metadata?: {
    suggestions?: string[];
    confidence?: number;
    actions?: AIAction[];
  };
}

export interface AIAction {
  type: 'create_booking' | 'place_order' | 'send_to_staff' | 'provide_info' | 'escalate' | 'create_ticket';
  data: Record<string, unknown>;
  reason: string;
}

export interface SupportChatResponse {
  success: boolean;
  sessionId?: string;
  message?: string;
  suggestions?: string[];
  actions?: AIAction[];
  escalate?: boolean;
  ticketCreated?: boolean;
  ticketNumber?: string;
  error?: string;
}

// ─── Support Chat Service ─────────────────────────────────────────────────────

class SupportChatService {
  private readonly basePath = '/api/support-chat';

  // REZ Care API helper
  private async rezCareRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T | null> {
    const url = `${REZ_CARE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`REZ Care error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[REZ Care] ${options.method || 'GET'} ${endpoint} failed:`, error);
      return null;
    }
  }

  // ─── Chat Methods ───────────────────────────────────────────────────────

  /**
   * Open a chat session with merchant context
   */
  async openChat(merchantContext: MerchantContext): Promise<SupportChatResponse> {
    try {
      // Start session via REZ-support-copilot (existing)
      const response = await publicClient.post(`${SUPPORT_COPILOT_URL}/session/start`, {
        merchantId: merchantContext.merchantId,
        merchantName: merchantContext.merchantName,
        merchantType: merchantContext.merchantType,
        context: merchantContext.businessInfo,
      });

      if (response.data?.sessionId) {
        return {
          success: true,
          sessionId: response.data.sessionId,
          message: "Hi! How can I help you today?",
        };
      }

      return { success: false, error: 'Failed to open chat' };
    } catch (error) {
      console.error('[SupportChat] Failed to open chat:', error);
      return { success: false, error: 'Chat service unavailable' };
    }
  }

  /**
   * Send message and get AI response
   */
  async sendMessage(
    sessionId: string,
    message: string,
    merchantContext: MerchantContext,
    customerId?: string
  ): Promise<SupportChatResponse> {
    try {
      // Send to REZ-support-copilot for AI response
      const response = await publicClient.post(`${SUPPORT_COPILOT_URL}/chat`, {
        sessionId,
        message,
        context: {
          merchantId: merchantContext.merchantId,
          merchantName: merchantContext.merchantName,
          merchantType: merchantContext.merchantType,
          customerId,
        },
      });

      if (response.data) {
        // If escalation needed, create ticket in REZ Care
        if (response.data.escalate) {
          await this.createSupportTicket(
            customerId || 'anonymous',
            message,
            merchantContext
          );
        }

        return {
          success: true,
          sessionId,
          message: response.data.message || response.data.response,
          suggestions: response.data.suggestions,
          actions: response.data.actions,
          escalate: response.data.escalate,
        };
      }

      return { success: false, error: 'No response from AI' };
    } catch (error) {
      console.error('[SupportChat] Failed to send message:', error);
      return { success: false, error: 'Message failed' };
    }
  }

  /**
   * Create support ticket via REZ Care
   */
  async createSupportTicket(
    customerId: string,
    message: string,
    merchantContext: MerchantContext
  ): Promise<{ ticketNumber?: string; success: boolean }> {
    try {
      const response = await this.rezCareRequest<unknown>('/api/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          userId: customerId,
          subject: `Support request - ${merchantContext.merchantName}`,
          category: 'order',
          message: message,
          platform: merchantContext.merchantType,
          relatedEntity: {
            type: 'order',
            id: merchantContext.storeSlug,
          },
          priority: 'medium',
        }),
      });

      if (response?.ticketNumber) {
        return {
          success: true,
          ticketNumber: response.ticketNumber,
        };
      }

      return { success: false };
    } catch (error) {
      console.error('[SupportChat] Failed to create ticket:', error);
      return { success: false };
    }
  }

  /**
   * Get unified customer view from REZ Care
   */
  async getCustomerContext(customerId: string): Promise<unknown> {
    try {
      const response = await this.rezCareRequest<unknown>(`/api/support/ai/unified/${customerId}`);

      if (response?.success) {
        return response;
      }

      return null;
    } catch (error) {
      console.error('[SupportChat] Failed to get customer context:', error);
      return null;
    }
  }

  /**
   * Analyze sentiment via REZ Care
   */
  async analyzeSentiment(message: string): Promise<{
    sentiment: string;
    score: number;
    suggestions: string[];
  } | null> {
    try {
      const response = await this.rezCareRequest<unknown>('/api/support/ai/sentiment', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });

      if (response?.analysis) {
        return response.analysis;
      }

      return null;
    } catch (error) {
      console.error('[SupportChat] Sentiment analysis failed:', error);
      return null;
    }
  }

  /**
   * Get AI suggestions for a situation
   */
  async getSuggestions(
    message: string,
    context: MerchantContext
  ): Promise<string[]> {
    try {
      const response = await publicClient.post(`${SUPPORT_COPILOT_URL}/suggestions`, {
        message,
        context: {
          merchantType: context.merchantType,
          merchantName: context.merchantName,
        },
      });

      return response.data?.suggestions || [];
    } catch (error) {
      console.error('[SupportChat] Failed to get suggestions:', error);
      return [];
    }
  }

  /**
   * End chat session
   */
  async endChat(sessionId: string): Promise<boolean> {
    try {
      await publicClient.post(`${SUPPORT_COPILOT_URL}/session/end`, { sessionId });
      return true;
    } catch (error) {
      console.error('[SupportChat] Failed to end chat:', error);
      return false;
    }
  }

  /**
   * Send feedback via REZ Care
   */
  async sendFeedback(
    sessionId: string,
    rating: number,
    comment?: string
  ): Promise<boolean> {
    try {
      // Record in REZ Care for CSAT
      await this.rezCareRequest('/api/csat/respond', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          score: rating,
          comment,
        }),
      });

      return true;
    } catch (error) {
      console.error('[SupportChat] Failed to send feedback:', error);
      return false;
    }
  }

  /**
   * Quick actions - Retry payment, Sync wallet, etc.
   */
  async executeQuickAction(
    customerId: string,
    actionType: 'retry_payment' | 'sync_wallet' | 'track_order' | 'report_issue',
    actionData?: Record<string, unknown>
  ): Promise<unknown> {
    try {
      const response = await this.rezCareRequest<unknown>('/api/mobile/execute', {
        method: 'POST',
        headers: {
          'x-customer-id': customerId,
        },
        body: JSON.stringify({
          actionType,
          actionData,
        }),
      });

      return response?.success || false;
    } catch (error) {
      console.error('[SupportChat] Quick action failed:', error);
      return false;
    }
  }
}

// Singleton instance
const supportChatService = new SupportChatService();

export default supportChatService;
export { SupportChatService };

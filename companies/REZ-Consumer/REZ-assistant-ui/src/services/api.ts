'use client';

/**
 * REZ Assistant UI - API Service
 */

const API_URL = process.env.NEXT_PUBLIC_ASSISTANT_API_URL || 'http://localhost:3010';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface SendMessageRequest {
  userId: string;
  message: string;
  context?: Record<string, any>;
}

interface SendMessageResponse {
  success: boolean;
  data?: {
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
  };
  error?: string;
}

class AssistantApi {
  private userId: string = 'default';

  setUserId(userId: string) {
    this.userId = userId;
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      const response = await fetch(`${API_URL}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  async getHistory(userId: string, limit: number = 50): Promise<{ success: boolean; data?: ChatMessage[] }> {
    try {
      const response = await fetch(`${API_URL}/api/chat/history/${userId}?limit=${limit}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }

  async clearHistory(userId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${API_URL}/api/chat/history/${userId}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }
}

export const assistantApi = new AssistantApi();

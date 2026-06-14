/**
 * REZ Inbox UI - API Service
 */

const API_URL = process.env.NEXT_PUBLIC_INBOX_API_URL || 'http://localhost:3003';

export interface Message {
  id: string;
  from: string;
  fromName?: string;
  subject: string;
  body: string;
  category: 'travel' | 'food' | 'invoice' | 'subscription' | 'banking' | 'social' | 'promotion' | 'other';
  date: string;
  status: 'unread' | 'read' | 'archived';
  isStarred: boolean;
}

interface GetMessagesResponse {
  success: boolean;
  data?: {
    items: Message[];
    total: number;
  };
}

class InboxApi {
  async getMessages(params: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
  } = {}): Promise<GetMessagesResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.category) searchParams.set('category', params.category);
      if (params.status) searchParams.set('status', params.status);

      const response = await fetch(`${API_URL}/api/messages?${searchParams}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }

  async getMessage(id: string): Promise<{ success: boolean; data?: Message }> {
    try {
      const response = await fetch(`${API_URL}/api/messages/${id}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }

  async markAsRead(id: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${API_URL}/api/messages/${id}/read`, {
        method: 'PATCH',
      });
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }

  async toggleStar(id: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${API_URL}/api/messages/${id}/star`, {
        method: 'PATCH',
      });
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return { success: false };
    }
  }
}

export const inboxApi = new InboxApi();

// @ts-nocheck
import apiClient, { ApiResponse } from './apiClient';
import { logger } from '@/utils/logger';

// ============================================================================
// REZ CARE API SERVICE (Unified Support)
// ============================================================================
// This service now calls REZ Care Service (4058)
// which integrates with REZ-support-copilot for AI features

// REZ Care API Base URL
const REZ_CARE_URL = process.env.EXPO_PUBLIC_REZ_CARE_URL || 'https://rez-care.onrender.com';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Support Ticket Message
 */
export interface TicketMessage {
  sender: string;
  senderType: 'user' | 'agent' | 'system';
  message: string;
  attachments: string[];
  timestamp: string;
  isRead: boolean;
}

/**
 * Support Ticket
 */
export interface SupportTicket {
  _id: string;
  ticketNumber: string;
  user: string;
  subject: string;
  category: 'order' | 'payment' | 'product' | 'account' | 'technical' | 'delivery' | 'refund' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  relatedEntity?: {
    type: 'order' | 'product' | 'transaction' | 'none';
    id?: string;
  };
  messages: TicketMessage[];
  assignedTo?: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  resolution?: string;
  rating?: {
    score: number;
    comment: string;
    ratedAt: string;
  };
  attachments: string[];
  tags: string[];
  responseTime?: number;
  resolutionTime?: number;
}

/**
 * FAQ
 */
export interface FAQ {
  _id: string;
  category: string;
  subcategory?: string;
  question: string;
  answer: string;
  shortAnswer?: string;
  isActive: boolean;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  tags: string[];
  relatedQuestions: FAQ[];
  order: number;
  imageUrl?: string;
  videoUrl?: string;
  relatedArticles: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * FAQ Category
 */
export interface FAQCategory {
  category: string;
  count: number;
  subcategories: string[];
}

/**
 * Create Ticket Request
 */
export interface CreateTicketRequest {
  subject: string;
  category: 'order' | 'payment' | 'product' | 'account' | 'technical' | 'delivery' | 'refund' | 'other';
  message: string;
  relatedEntity?: {
    type: 'order' | 'product' | 'transaction' | 'none';
    id?: string;
  };
  attachments?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  idempotencyKey?: string;
  tags?: string[];
}

/**
 * Get Tickets Filters
 */
export interface GetTicketsFilters {
  status?: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  category?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

/**
 * Get Tickets Response
 */
export interface GetTicketsResponse {
  tickets: SupportTicket[];
  total: number;
  pages: number;
}

// ============================================================================
// REZ CARE API CLIENT
// ============================================================================

class RezCareAPIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = REZ_CARE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`REZ Care API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error(`[REZ Care] ${options.method || 'GET'} ${endpoint} failed:`, error);
      throw error;
    }
  }

  // ============================================
  // TICKETS
  // ============================================

  async createTicket(data: CreateTicketRequest): Promise<{
    success: boolean;
    ticketNumber?: string;
    aiSuggestions?: string[];
    similarIssues?: unknown[];
    message?: string;
    error?: string;
  }> {
    return this.request('/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTickets(
    filters?: GetTicketsFilters
  ): Promise<ApiResponse<GetTicketsResponse>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const queryString = params.toString();
    const endpoint = `/api/support/tickets${queryString ? `?${queryString}` : ''}`;

    // Fallback to old API if REZ Care unavailable
    try {
      return await this.request(endpoint);
    } catch {
      // Fallback to existing support API
      return apiClient.get<GetTicketsResponse>('/support/tickets', filters as unknown);
    }
  }

  async getTicketById(
    ticketNumber: string
  ): Promise<ApiResponse<{ ticket: SupportTicket; aiSuggestions?: unknown[] }>> {
    try {
      return await this.request(`/api/support/tickets/${ticketNumber}`);
    } catch {
      // Fallback to old API
      return apiClient.get(`/support/tickets/${ticketNumber}`);
    }
  }

  async addMessage(
    ticketNumber: string,
    message: string,
    attachments?: string[]
  ): Promise<ApiResponse<unknown>> {
    try {
      return await this.request(`/api/support/tickets/${ticketNumber}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message, attachments }),
      });
    } catch {
      return apiClient.post(`/support/tickets/${ticketNumber}/messages`, {
        message,
        attachments,
      });
    }
  }

  async closeTicket(
    ticketNumber: string,
    resolution?: string
  ): Promise<ApiResponse<unknown>> {
    try {
      return await this.request(`/api/support/tickets/${ticketNumber}/close`, {
        method: 'POST',
        body: JSON.stringify({ resolution }),
      });
    } catch {
      return apiClient.post(`/support/tickets/${ticketNumber}/close`, { resolution });
    }
  }

  async reopenTicket(
    ticketNumber: string,
    reason: string
  ): Promise<ApiResponse<unknown>> {
    try {
      return await this.request(`/api/support/tickets/${ticketNumber}/reopen`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    } catch {
      return apiClient.post(`/support/tickets/${ticketNumber}/reopen`, { reason });
    }
  }

  async rateTicket(
    ticketNumber: string,
    score: number,
    comment?: string
  ): Promise<ApiResponse<unknown>> {
    try {
      return await this.request(`/api/support/tickets/${ticketNumber}/rate`, {
        method: 'POST',
        body: JSON.stringify({ score, comment }),
      });
    } catch {
      return apiClient.post(`/support/tickets/${ticketNumber}/rate`, {
        score,
        comment,
      });
    }
  }

  async getTicketSummary(): Promise<ApiResponse<unknown>> {
    try {
      return await this.request('/api/support/tickets/summary');
    } catch {
      return apiClient.get('/support/tickets/summary');
    }
  }

  // ============================================
  // FAQ
  // ============================================

  async getFAQs(
    category?: string,
    subcategory?: string
  ): Promise<ApiResponse<{ faqs: FAQ[] }>> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (subcategory) params.append('subcategory', subcategory);
      const queryString = params.toString();
      const endpoint = `/api/support/faq${queryString ? `?${queryString}` : ''}`;
      return await this.request(endpoint);
    } catch {
      return apiClient.get('/support/faq', { category, subcategory } as unknown);
    }
  }

  async searchFAQs(
    query: string,
    limit?: number
  ): Promise<ApiResponse<{ results: unknown[] }>> {
    try {
      return await this.request(`/api/support/faq/search?q=${encodeURIComponent(query)}&limit=${limit || 10}`);
    } catch {
      return apiClient.get('/support/faq/search', { q: query, limit } as unknown);
    }
  }

  async getFAQCategories(): Promise<ApiResponse<{ categories: FAQCategory[] }>> {
    try {
      return await this.request('/api/support/faq/categories');
    } catch {
      return apiClient.get('/support/faq/categories');
    }
  }

  async getPopularFAQs(limit: number = 5): Promise<ApiResponse<{ faqs: FAQ[] }>> {
    try {
      return await this.request(`/api/support/faq?limit=${limit}`);
    } catch {
      return apiClient.get('/support/faq/popular', { limit } as unknown);
    }
  }

  async markFAQHelpful(
    faqId: string,
    helpful: boolean
  ): Promise<ApiResponse<unknown>> {
    try {
      return await this.request(`/api/support/faq/${faqId}/helpful`, {
        method: 'POST',
        body: JSON.stringify({ helpful }),
      });
    } catch {
      return apiClient.post(`/support/faq/${faqId}/helpful`, { helpful });
    }
  }

  async trackFAQView(faqId: string): Promise<ApiResponse<unknown>> {
    try {
      return await this.request(`/api/support/faq/${faqId}/view`, {
        method: 'POST',
      });
    } catch {
      return apiClient.post(`/support/faq/${faqId}/view`, {});
    }
  }

  // ============================================
  // QUICK ACTIONS
  // ============================================

  async createOrderIssueTicket(
    orderId: string,
    issueDescription: string
  ): Promise<ApiResponse<unknown>> {
    return this.createTicket({
      subject: `Order Issue - ${orderId}`,
      category: 'order',
      message: issueDescription,
      relatedEntity: {
        type: 'order',
        id: orderId,
      },
      priority: 'medium',
    });
  }

  async reportProductIssue(
    productId: string,
    issueDescription: string
  ): Promise<ApiResponse<unknown>> {
    return this.createTicket({
      subject: `Product Issue - ${productId}`,
      category: 'product',
      message: issueDescription,
      relatedEntity: {
        type: 'product',
        id: productId,
      },
      priority: 'medium',
    });
  }

  // ============================================
  // CALLBACK
  // ============================================

  async requestCallback(
    phone: string,
    category: string,
    message?: string
  ): Promise<ApiResponse<unknown>> {
    try {
      return await this.request('/api/support/callback', {
        method: 'POST',
        body: JSON.stringify({ phone, category, message }),
      });
    } catch {
      return apiClient.post('/support/callback', { phone, category, message });
    }
  }

  // ============================================
  // AI-POWERED FEATURES (via REZ Care → REZ-support-copilot)
  // ============================================

  async getAISuggestions(ticketNumber: string): Promise<unknown[]> {
    try {
      const response = await this.request<{ success: boolean; suggestions: unknown[] }>(
        `/api/support/ai/suggestions/${ticketNumber}`
      );
      return response.suggestions || [];
    } catch {
      return [];
    }
  }

  async analyzeSentiment(message: string): Promise<{
    sentiment: string;
    score: number;
    suggestions: string[];
  } | null> {
    try {
      const response = await this.request<{ success: boolean; analysis: unknown }>(
        '/api/support/ai/sentiment',
        {
          method: 'POST',
          body: JSON.stringify({ message }),
        }
      );
      return response.analysis;
    } catch {
      return null;
    }
  }

  async getUnifiedCustomerView(customerId: string): Promise<unknown> {
    try {
      return await this.request(`/api/support/ai/unified/${customerId}`);
    } catch {
      return null;
    }
  }

  // ============================================
  // SELF-SERVICE (via REZ Care)
  // ============================================

  async getSelfServiceActions(customerId: string): Promise<unknown[]> {
    try {
      const response = await this.request<{ success: boolean; data: { actions: unknown[] } }>(
        `/api/mobile/actions`,
        {
          headers: {
            'x-customer-id': customerId,
          },
        }
      );
      return response.data?.actions || [];
    } catch {
      return [];
    }
  }

  async executeSelfServiceAction(
    customerId: string,
    actionType: string,
    actionData?: unknown
  ): Promise<unknown> {
    try {
      return await this.request('/api/mobile/execute', {
        method: 'POST',
        headers: {
          'x-customer-id': customerId,
        },
        body: JSON.stringify({ actionType, actionData }),
      });
    } catch {
      return null;
    }
  }
}

// Singleton instance
const rezCareAPI = new RezCareAPIClient();

// ============================================================================
// EXPORTS
// ============================================================================

export const supportApi = {
  // Tickets
  createTicket: (data: CreateTicketRequest) => rezCareAPI.createTicket(data),
  getTickets: (filters?: GetTicketsFilters) => rezCareAPI.getTickets(filters),
  getTicketById: (ticketNumber: string) => rezCareAPI.getTicketById(ticketNumber),
  addMessage: (ticketNumber: string, message: string, attachments?: string[]) =>
    rezCareAPI.addMessage(ticketNumber, message, attachments),
  closeTicket: (ticketNumber: string, resolution?: string) =>
    rezCareAPI.closeTicket(ticketNumber, resolution),
  reopenTicket: (ticketNumber: string, reason: string) =>
    rezCareAPI.reopenTicket(ticketNumber, reason),
  rateTicket: (ticketNumber: string, score: number, comment?: string) =>
    rezCareAPI.rateTicket(ticketNumber, score, comment),
  getTicketSummary: () => rezCareAPI.getTicketSummary(),

  // FAQ
  getFAQs: (category?: string, subcategory?: string) =>
    rezCareAPI.getFAQs(category, subcategory),
  searchFAQs: (query: string, limit?: number) =>
    rezCareAPI.searchFAQs(query, limit),
  getFAQCategories: () => rezCareAPI.getFAQCategories(),
  getPopularFAQs: (limit?: number) => rezCareAPI.getPopularFAQs(limit),
  markFAQHelpful: (faqId: string, helpful: boolean) =>
    rezCareAPI.markFAQHelpful(faqId, helpful),
  trackFAQView: (faqId: string) => rezCareAPI.trackFAQView(faqId),

  // Quick Actions
  createOrderIssueTicket: (orderId: string, description: string) =>
    rezCareAPI.createOrderIssueTicket(orderId, description),
  reportProductIssue: (productId: string, description: string) =>
    rezCareAPI.reportProductIssue(productId, description),

  // Callback
  requestCallback: (phone: string, category: string, message?: string) =>
    rezCareAPI.requestCallback(phone, category, message),

  // AI Features
  getAISuggestions: (ticketNumber: string) =>
    rezCareAPI.getAISuggestions(ticketNumber),
  analyzeSentiment: (message: string) => rezCareAPI.analyzeSentiment(message),
  getUnifiedCustomerView: (customerId: string) =>
    rezCareAPI.getUnifiedCustomerView(customerId),

  // Self-Service
  getSelfServiceActions: (customerId: string) =>
    rezCareAPI.getSelfServiceActions(customerId),
  executeSelfServiceAction: (
    customerId: string,
    actionType: string,
    actionData?: unknown
  ) => rezCareAPI.executeSelfServiceAction(customerId, actionType, actionData),
};

export default supportApi;

// Re-export types
export type { SupportTicket, FAQ, CreateTicketRequest, GetTicketsFilters };

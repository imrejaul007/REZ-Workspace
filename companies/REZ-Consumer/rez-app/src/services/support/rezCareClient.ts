/**
 * REZ Care API Client for Mobile Apps
 *
 * Integration layer for consumer and merchant apps to connect to REZ Care service.
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '@/utils/logger';

// Configuration
const REZ_CARE_BASE_URL = process.env.REZ_CARE_URL || 'https://rez-care-service.onrender.com';
const API_TIMEOUT = 15000;
const MOBILE_API = '/api/mobile-sdk';

// Types
export interface Ticket {
  ticketId: string;
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  message: string;
  customerId: string;
  assignedTo?: string;
  assignedAgent?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  csatRating?: number;
  sentiment?: string;
  platform: string;
  tags?: string[];
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  role: 'customer' | 'agent' | 'system';
  content: string;
  timestamp: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  type: 'image' | 'document';
  url: string;
  name: string;
}

export interface SelfServiceOptions {
  category: string;
  options: Array<{
    id: string;
    label: string;
    description: string;
    icon: string;
    action: string;
  }>;
}

export interface CSATSubmission {
  ticketId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
}

export interface SupportArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  helpful: number;
  tags: string[];
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

class RezCareClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: REZ_CARE_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.client.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    });

    // Add error handler
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logger.warn('[REZ Care] Unauthorized - please login');
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  clearAuth(): void {
    this.authToken = null;
  }

  // ============================================
  // SELF-SERVICE
  // ============================================

  async getSelfServiceOptions(category?: string): Promise<SelfServiceOptions[]> {
    const response = await this.client.get(`${MOBILE_API}/self-service/options`, {
      params: { category },
    });
    return response.data.options || [];
  }

  async createTicket(data: {
    userId: string;
    category: string;
    subject: string;
    message: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<Ticket> {
    const response = await this.client.post(`${MOBILE_API}/tickets`, data);
    return response.data.ticket;
  }

  async retryPayment(orderId: string, userId: string): Promise<{ success: boolean; redirectUrl?: string; error?: string }> {
    const response = await this.client.post(`${MOBILE_API}/self-service/retry-payment`, {
      orderId,
      userId,
    });
    return response.data;
  }

  async syncWallet(userId: string): Promise<{ success: boolean; balance?: number; error?: string }> {
    const response = await this.client.post(`${MOBILE_API}/self-service/sync-wallet`, {
      userId,
    });
    return response.data;
  }

  async trackOrder(orderId: string): Promise<{
    status: string;
    estimatedDelivery?: string;
    driverName?: string;
    driverPhone?: string;
    trackingUrl?: string;
  }> {
    const response = await this.client.get(`${MOBILE_API}/self-service/track/${orderId}`);
    return response.data;
  }

  // ============================================
  // TICKET MANAGEMENT
  // ============================================

  async getTickets(userId: string, options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ tickets: Ticket[]; total: number }> {
    const response = await this.client.get(`${MOBILE_API}/tickets`, {
      params: { userId, ...options },
    });
    return response.data;
  }

  async getTicket(ticketId: string): Promise<Ticket> {
    const response = await this.client.get(`${MOBILE_API}/tickets/${ticketId}`);
    return response.data.ticket;
  }

  async respondToTicket(ticketId: string, userId: string, message: string): Promise<Ticket> {
    const response = await this.client.post(`${MOBILE_API}/tickets/${ticketId}/respond`, {
      userId,
      message,
    });
    return response.data.ticket;
  }

  async resolveTicket(ticketId: string, userId: string): Promise<Ticket> {
    const response = await this.client.post(`${MOBILE_API}/tickets/${ticketId}/resolve`, {
      userId,
    });
    return response.data.ticket;
  }

  async reopenTicket(ticketId: string, userId: string, reason: string): Promise<Ticket> {
    const response = await this.client.post(`${MOBILE_API}/tickets/${ticketId}/reopen`, {
      userId,
      reason,
    });
    return response.data.ticket;
  }

  // ============================================
  // CSAT
  // ============================================

  async submitCSAT(data: CSATSubmission): Promise<{ success: boolean }> {
    const response = await this.client.post(`${MOBILE_API}/csat`, data);
    return response.data;
  }

  async getPendingCSAT(userId: string): Promise<Ticket[]> {
    const response = await this.client.get(`${MOBILE_API}/csat/pending`, {
      params: { userId },
    });
    return response.data.tickets || [];
  }

  // ============================================
  // KNOWLEDGE BASE
  // ============================================

  async searchKB(query: string, options?: {
    category?: string;
    limit?: number;
  }): Promise<SupportArticle[]> {
    const response = await this.client.get(`${MOBILE_API}/knowledge/search`, {
      params: { q: query, ...options },
    });
    return response.data.articles || [];
  }

  async getKBArticle(articleId: string): Promise<SupportArticle> {
    const response = await this.client.get(`${MOBILE_API}/knowledge/${articleId}`);
    return response.data.article;
  }

  async markArticleHelpful(articleId: string, helpful: boolean): Promise<void> {
    await this.client.post(`${MOBILE_API}/knowledge/${articleId}/helpful`, { helpful });
  }

  async getFAQs(category?: string): Promise<FAQ[]> {
    const response = await this.client.get(`${MOBILE_API}/faqs`, {
      params: { category },
    });
    return response.data.faqs || [];
  }

  // ============================================
  // LIVE CHAT
  // ============================================

  async startChat(userId: string, message: string): Promise<{
    sessionId: string;
    ticketId: string;
    response: string;
  }> {
    const response = await this.client.post(`${MOBILE_API}/chat/start`, {
      userId,
      message,
    });
    return response.data;
  }

  async sendChatMessage(sessionId: string, userId: string, message: string): Promise<{
    response: string;
    intent?: string;
    actions?: Array<{ type: string; label: string; data?: unknown }>;
  }> {
    const response = await this.client.post(`${MOBILE_API}/chat/send`, {
      sessionId,
      userId,
      message,
    });
    return response.data;
  }

  async getChatHistory(sessionId: string): Promise<Array<{
    role: 'customer' | 'agent' | 'bot';
    content: string;
    timestamp: string;
  }>> {
    const response = await this.client.get(`${MOBILE_API}/chat/${sessionId}/history`);
    return response.data.messages || [];
  }

  async endChat(sessionId: string): Promise<void> {
    await this.client.post(`${MOBILE_API}/chat/${sessionId}/end`);
  }

  // ============================================
  // ORDER SUPPORT
  // ============================================

  async getOrderSupportOptions(orderId: string): Promise<Array<{
    type: string;
    label: string;
    description: string;
    available: boolean;
  }>> {
    const response = await this.client.get(`${MOBILE_API}/orders/${orderId}/support-options`);
    return response.data.options || [];
  }

  async cancelOrder(orderId: string, userId: string, reason: string): Promise<{
    success: boolean;
    refundAmount?: number;
    refundId?: string;
    error?: string;
  }> {
    const response = await this.client.post(`${MOBILE_API}/orders/${orderId}/cancel`, {
      userId,
      reason,
    });
    return response.data;
  }

  async requestRefund(orderId: string, userId: string, reason: string, amount?: number): Promise<{
    success: boolean;
    ticketId?: string;
    estimatedDays?: number;
    error?: string;
  }> {
    const response = await this.client.post(`${MOBILE_API}/orders/${orderId}/refund`, {
      userId,
      reason,
      amount,
    });
    return response.data;
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data?.status === 'ok';
    } catch {
      return false;
    }
  }
}

export const rezCareClient = new RezCareClient();
export default rezCareClient;

import { apiClient } from './client';

// ============================================================================
// REZ CARE MERCHANT SUPPORT SERVICE (Unified)
// ============================================================================
// This service now integrates with REZ Care Service (4058)
// which includes merchant communication features

// REZ Care API Base URL
const REZ_CARE_URL = process.env.EXPO_PUBLIC_REZ_CARE_URL || 'https://rez-care.onrender.com';

// ============================================================================
// TYPES
// ============================================================================

export interface MerchantTicket {
  _id: string;
  ticketNumber: string;
  user: { _id: string; fullName?: string; phoneNumber?: string; email?: string };
  merchant?: { _id: string; name?: string };
  subject: string;
  category: string;
  priority: string;
  status: string;
  assignedTo?: { _id: string; fullName?: string };
  messages: Array<{
    sender: string;
    senderType: 'user' | 'agent' | 'system';
    message: string;
    attachments?: string[];
    timestamp: string;
    isRead: boolean;
  }>;
  resolution?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MerchantTicketStats {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  openCount: number;
  inProgressCount: number;
}

// ============================================================================
// MERCHANT SUPPORT SERVICE (Unified)
// ============================================================================

class MerchantSupportService {
  // REZ Care API client
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
        throw new Error(`REZ Care API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`[REZ Care] ${options.method || 'GET'} ${endpoint} failed:`, error);
      return null;
    }
  }

  // ============================================
  // TICKETS (from rez-merchant-service)
  // ============================================

  async listTickets(params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  }): Promise<{
    tickets: MerchantTicket[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    try {
      const queryParams: Record<string, string> = {};
      if (params?.page) queryParams.page = String(params.page);
      if (params?.limit) queryParams.limit = String(params.limit);
      if (params?.status && params.status !== 'all') queryParams.status = params.status;
      if (params?.category && params.category !== 'all') queryParams.category = params.category;
      if (params?.search) queryParams.search = params.search;

      const qs = Object.entries(queryParams)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');
      const url = qs ? `merchant/support/tickets?${qs}` : 'merchant/support/tickets';
      const response = await apiClient.get(url);

      return (
        response.data || { tickets: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }
      );
    } catch (error) {
      console.error('[Support] Failed to list tickets:', error);
      return { tickets: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
    }
  }

  async getTicket(ticketNumber: string): Promise<MerchantTicket | null> {
    try {
      const response = await apiClient.get(`merchant/support/tickets/${ticketNumber}`);
      return response.data?.ticket || null;
    } catch (error) {
      console.error('[Support] Failed to get ticket:', error);
      return null;
    }
  }

  async addMessage(
    ticketNumber: string,
    message: string,
    senderType: 'user' | 'agent' = 'user'
  ): Promise<boolean> {
    try {
      await apiClient.post(`merchant/support/tickets/${ticketNumber}/messages`, {
        message,
        senderType,
      });
      return true;
    } catch (error) {
      console.error('[Support] Failed to add message:', error);
      return false;
    }
  }

  async closeTicket(ticketNumber: string, resolution?: string): Promise<boolean> {
    try {
      await apiClient.post(`merchant/support/tickets/${ticketNumber}/close`, {
        resolution,
      });
      return true;
    } catch (error) {
      console.error('[Support] Failed to close ticket:', error);
      return false;
    }
  }

  async getStats(): Promise<MerchantTicketStats> {
    try {
      const response = await apiClient.get('merchant/support/stats');
      return response.data || {
        total: 0,
        byStatus: {},
        byCategory: {},
        openCount: 0,
        inProgressCount: 0,
      };
    } catch (error) {
      console.error('[Support] Failed to get stats:', error);
      return {
        total: 0,
        byStatus: {},
        byCategory: {},
        openCount: 0,
        inProgressCount: 0,
      };
    }
  }

  // ============================================
  // MERCHANT COMMUNICATION (via REZ Care)
  // ============================================

  /**
   * Receive customer issue and communicate with merchant
   * NEW: Uses REZ Care merchant communication
   */
  async receiveCustomerIssue(params: {
    ticketNumber: string;
    customerId: string;
    customerName?: string;
    customerPhone: string;
    issueDescription: string;
    category: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<{
    success: boolean;
    communicationId?: string;
    message?: string;
  }> {
    // First create ticket via old API
    await this.listTickets();

    // Also notify via REZ Care
    const response = await this.rezCareRequest<unknown>('/api/merchant/communicate', {
      method: 'POST',
      body: JSON.stringify({
        ticketId: params.ticketNumber,
        customerId: params.customerId,
        customerName: params.customerName,
        partnerPhone: '', // Merchant phone
        issueCategory: params.category,
        issueDescription: params.issueDescription,
        priority: params.priority || 'medium',
        channel: 'whatsapp',
      }),
    });

    if (response) {
      return {
        success: true,
        communicationId: response.communicationId,
      };
    }

    return { success: true };
  }

  /**
   * Respond to customer issue (merchant side)
   */
  async respondToCustomer(params: {
    communicationId: string;
    response: string;
    resolution?: string;
    escalate?: boolean;
  }): Promise<boolean> {
    const response = await this.rezCareRequest<unknown>('/api/merchant/respond', {
      method: 'POST',
      body: JSON.stringify({
        communicationId: params.communicationId,
        response: params.response,
        resolution: params.resolution,
        escalate: params.escalate,
      }),
    });

    return !!response;
  }

  /**
   * Get merchant communication dashboard
   */
  async getCommunicationDashboard(): Promise<unknown> {
    const response = await this.rezCareRequest<unknown>('/api/merchant/dashboard');
    return response?.data || null;
  }

  /**
   * Get pending communications
   */
  async getPendingCommunications(): Promise<unknown[]> {
    const response = await this.rezCareRequest<unknown>('/api/merchant/communications?status=pending');
    return response?.data?.pending || [];
  }

  // ============================================
  // MERCHANT ANALYTICS (via REZ Care)
  // ============================================

  /**
   * Get merchant support metrics
   */
  async getMerchantMetrics(merchantId: string): Promise<{
    totalIssues: number;
    resolutionRate: number;
    avgResponseTime: number;
    csatScore: number;
    status: 'good' | 'warning' | 'critical';
  } | null> {
    const response = await this.rezCareRequest<unknown>(`/api/merchant/${merchantId}/metrics`);
    return response?.data || null;
  }

  /**
   * Get issue trends
   */
  async getIssueTrends(merchantId: string, days: number = 7): Promise<unknown> {
    const response = await this.rezCareRequest<unknown>(
      `/api/merchant/${merchantId}/trends?days=${days}`
    );
    return response?.data || null;
  }
}

// Singleton instance
const merchantSupportService = new MerchantSupportService();

export default merchantSupportService;

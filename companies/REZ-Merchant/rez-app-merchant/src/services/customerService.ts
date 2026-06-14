/**
 * Customer Service - Real Customer CRM Integration
 *
 * Connects directly to https://rez-merchant-service.onrender.com
 * Provides customer management, segmentation, lifetime value calculation,
 * order history, and customer notes functionality.
 */

import { logger } from '@/utils/logger';

// Customer Service base URL
const CUSTOMER_SERVICE_URL =
  process.env.EXPO_PUBLIC_CUSTOMER_SERVICE_URL || 'https://rez-merchant-service.onrender.com';

// ============================================
// TYPES
// ============================================

export type CustomerSegment =
  | 'new'
  | 'active'
  | 'inactive'
  | 'at_risk'
  | 'churned'
  | 'vip'
  | 'occasional';

export type CustomerTag = string;

export interface CustomerAddress {
  id?: string;
  label?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  pincode?: string;
  country?: string;
  isDefault?: boolean;
}

export interface CustomerPreferences {
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  language?: string;
  dietaryRestrictions?: string[];
}

export interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string | null;
  firstOrderDate: string | null;
  favoriteItems: string[];
  favoriteCategories: string[];
  visits: number;
}

export interface CustomerLifetimeValue {
  currentValue: number;
  predictedValue: number;
  potentialValue: number;
  score: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lastCalculated: string;
}

export interface Customer {
  id: string;
  _id?: string;
  merchantId: string;
  name: string;
  email?: string;
  phone: string;
  phoneNumber?: string;
  avatar?: string;
  profileImage?: string;
  addresses?: CustomerAddress[];
  preferences?: CustomerPreferences;
  tags?: CustomerTag[];
  segment?: CustomerSegment;
  segmentSource?: string;
  stats?: CustomerStats;
  lifetimeValue?: CustomerLifetimeValue;
  totalSpent?: number;
  totalOrders?: number;
  averageOrderValue?: number;
  visitCount?: number;
  notes?: CustomerNote[];
  lastOrderDate?: string;
  lastOrderAt?: string;
  firstOrderDate?: string;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
  isVerified?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CustomerNote {
  id: string;
  _id?: string;
  content: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
  isPinned?: boolean;
  tags?: string[];
}

export interface CustomerOrder {
  id: string;
  _id?: string;
  orderId: string;
  merchantId: string;
  customerId: string;
  orderNumber?: string;
  items: Array<{
    id?: string;
    productId?: string;
    productName?: string;
    name?: string;
    quantity: number;
    price: number;
    subtotal?: number;
    total?: number;
  }>;
  totalAmount: number;
  subtotal?: number;
  tax?: number;
  discount?: number;
  deliveryFee?: number;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  deliveryType?: 'pickup' | 'delivery' | 'dine_in' | 'drive_thru';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CustomerSearchParams {
  merchantId: string;
  query?: string;
  segment?: CustomerSegment | CustomerSegment[];
  tags?: string[];
  status?: 'active' | 'inactive' | 'all';
  sortBy?: 'name' | 'createdAt' | 'totalSpent' | 'lastOrderDate' | 'visitCount';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  minSpent?: number;
  maxSpent?: number;
  minOrders?: number;
  maxOrders?: number;
}

export interface CustomerListResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  segments?: {
    new: number;
    active: number;
    inactive: number;
    at_risk: number;
    churned: number;
    vip: number;
    occasional: number;
  };
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone: string;
  addresses?: CustomerAddress[];
  preferences?: CustomerPreferences;
  tags?: CustomerTag[];
  metadata?: Record<string, unknown>;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  addresses?: CustomerAddress[];
  preferences?: CustomerPreferences;
  tags?: CustomerTag[];
  segment?: CustomerSegment;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AddNoteRequest {
  content: string;
  tags?: string[];
  isPinned?: boolean;
}

export interface SegmentAnalytics {
  segment: CustomerSegment;
  count: number;
  percentage: number;
  totalSpent: number;
  averageSpent: number;
  averageOrders: number;
  averageLifetimeValue: number;
}

export interface CustomerInsights {
  totalCustomers: number;
  newCustomersThisMonth: number;
  returningCustomers: number;
  averageLifetimeValue: number;
  averageOrderValue: number;
  totalRevenue: number;
  segments: SegmentAnalytics[];
  topCustomers: Customer[];
  atRiskCustomers: Customer[];
}

export interface ExportCustomersParams {
  merchantId: string;
  format?: 'csv' | 'json' | 'xlsx';
  segments?: CustomerSegment[];
  includeStats?: boolean;
  includeNotes?: boolean;
}

// ============================================
// SEGMENT CONFIGURATION
// ============================================

export const SEGMENT_CONFIG: Record<
  CustomerSegment,
  { label: string; description: string; color: string; bgColor: string }
> = {
  new: {
    label: 'New',
    description: 'Customers with first order in last 30 days',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  active: {
    label: 'Active',
    description: 'Customers who ordered in last 30 days',
    color: '#10B981',
    bgColor: '#ECFDF5',
  },
  inactive: {
    label: 'Inactive',
    description: 'No orders in 30-60 days',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
  },
  at_risk: {
    label: 'At Risk',
    description: 'No orders in 60-90 days',
    color: '#EF4444',
    bgColor: '#FEF2F2',
  },
  churned: {
    label: 'Churned',
    description: 'No orders in over 90 days',
    color: '#6B7280',
    bgColor: '#F3F4F6',
  },
  vip: {
    label: 'VIP',
    description: 'Top 10% by lifetime value',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
  },
  occasional: {
    label: 'Occasional',
    description: 'Less than 3 orders total',
    color: '#06B6D4',
    bgColor: '#ECFEFF',
  },
};

export const LTV_TIER_CONFIG: Record<
  CustomerLifetimeValue['tier'],
  { label: string; minScore: number; color: string; bgColor: string }
> = {
  bronze: { label: 'Bronze', minScore: 0, color: '#CD7F32', bgColor: '#FEF3C7' },
  silver: { label: 'Silver', minScore: 25, color: '#C0C0C0', bgColor: '#F3F4F6' },
  gold: { label: 'Gold', minScore: 50, color: '#FFD700', bgColor: '#FFFBEB' },
  platinum: { label: 'Platinum', minScore: 75, color: '#E5E4E2', bgColor: '#F5F3FF' },
};

// ============================================
// SERVICE CLASS
// ============================================

interface CustomerServiceError {
  code: string;
  message: string;
  statusCode?: number;
}

class CustomerService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = CUSTOMER_SERVICE_URL;
  }

  setToken(token: string): void {
    this.token = token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private getCustomerId(customer: Customer): string {
    return customer._id || customer.id;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: CustomerServiceError = {
        code: errorData.code || `HTTP_${response.status}`,
        message: errorData.message || `Request failed with status ${response.status}`,
        statusCode: response.status,
      };
      throw error;
    }
    return response.json();
  }

  // ============================================
  // CUSTOMER CRUD OPERATIONS
  // ============================================

  /**
   * GET /customers/:merchantId
   * Fetch all customers for a merchant with filtering and pagination
   */
  async getCustomers(params: CustomerSearchParams): Promise<CustomerListResponse> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('merchantId', params.merchantId);

      if (params.query) searchParams.append('query', params.query);
      if (params.segment) {
        const segments = Array.isArray(params.segment) ? params.segment : [params.segment];
        segments.forEach((s) => searchParams.append('segment', s));
      }
      if (params.tags) {
        params.tags.forEach((t) => searchParams.append('tags', t));
      }
      if (params.status) searchParams.append('status', params.status);
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.order) searchParams.append('order', params.order);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);
      if (params.minSpent) searchParams.append('minSpent', params.minSpent.toString());
      if (params.maxSpent) searchParams.append('maxSpent', params.maxSpent.toString());
      if (params.minOrders) searchParams.append('minOrders', params.minOrders.toString());
      if (params.maxOrders) searchParams.append('maxOrders', params.maxOrders.toString());

      const url = `${this.baseUrl}/customers/${params.merchantId}?${searchParams.toString()}`;
      logger.debug('[CustomerService] Fetching customers:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: {
          customers?: Customer[];
          items?: Customer[];
          total?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
          hasMore?: boolean;
          segments?: CustomerListResponse['segments'];
        };
        customers?: Customer[];
        items?: Customer[];
        pagination?: {
          total?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
          hasMore?: boolean;
        };
        segments?: CustomerListResponse['segments'];
      }>(response);

      // Normalize response - support multiple response shapes
      const customers = data.data?.customers || data.data?.items || data.customers || data.items || [];
      const pagination = data.data || data.pagination || {};

      return {
        customers,
        total: pagination.total || customers.length,
        page: pagination.page || 1,
        limit: pagination.limit || customers.length,
        totalPages: pagination.totalPages || 1,
        hasMore: pagination.hasMore || false,
        segments: data.data?.segments || data.segments,
      };
    } catch (error) {
      logger.error('[CustomerService] Error fetching customers:', error);
      throw error;
    }
  }

  /**
   * GET /customers/detail/:id
   * Fetch a single customer by ID with full details
   */
  async getCustomerById(customerId: string): Promise<Customer> {
    try {
      const url = `${this.baseUrl}/customers/detail/${customerId}`;
      logger.debug('[CustomerService] Fetching customer:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: Customer;
        customer?: Customer;
      }>(response);

      return data.data || data.customer!;
    } catch (error) {
      logger.error('[CustomerService] Error fetching customer:', error);
      throw error;
    }
  }

  /**
   * POST /customers
   * Create a new customer
   */
  async createCustomer(merchantId: string, customerData: CreateCustomerRequest): Promise<Customer> {
    try {
      const url = `${this.baseUrl}/customers`;
      logger.debug('[CustomerService] Creating customer:', url, customerData);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ merchantId, ...customerData }),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: Customer;
        customer?: Customer;
      }>(response);

      return data.data || data.customer!;
    } catch (error) {
      logger.error('[CustomerService] Error creating customer:', error);
      throw error;
    }
  }

  /**
   * PATCH /customers/:id
   * Update customer details
   */
  async updateCustomer(
    customerId: string,
    updateData: UpdateCustomerRequest
  ): Promise<Customer> {
    try {
      const url = `${this.baseUrl}/customers/${customerId}`;
      logger.debug('[CustomerService] Updating customer:', url, updateData);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(updateData),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: Customer;
        customer?: Customer;
      }>(response);

      return data.data || data.customer!;
    } catch (error) {
      logger.error('[CustomerService] Error updating customer:', error);
      throw error;
    }
  }

  /**
   * DELETE /customers/:id
   * Soft delete a customer
   */
  async deleteCustomer(customerId: string): Promise<{ success: boolean }> {
    try {
      const url = `${this.baseUrl}/customers/${customerId}`;
      logger.debug('[CustomerService] Deleting customer:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return this.handleResponse<{ success: boolean }>(response);
    } catch (error) {
      logger.error('[CustomerService] Error deleting customer:', error);
      throw error;
    }
  }

  // ============================================
  // CUSTOMER ORDERS
  // ============================================

  /**
   * GET /customers/:id/orders
   * Fetch order history for a specific customer
   */
  async getCustomerOrders(
    customerId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{
    orders: CustomerOrder[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    try {
      const searchParams = new URLSearchParams();
      if (options?.page) searchParams.append('page', options.page.toString());
      if (options?.limit) searchParams.append('limit', options.limit.toString());
      if (options?.status) searchParams.append('status', options.status);
      if (options?.startDate) searchParams.append('startDate', options.startDate);
      if (options?.endDate) searchParams.append('endDate', options.endDate);

      const url = `${this.baseUrl}/customers/${customerId}/orders?${searchParams.toString()}`;
      logger.debug('[CustomerService] Fetching customer orders:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: {
          orders?: CustomerOrder[];
          items?: CustomerOrder[];
          total?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
          hasMore?: boolean;
        };
        orders?: CustomerOrder[];
        items?: CustomerOrder[];
        pagination?: {
          total?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
          hasMore?: boolean;
        };
      }>(response);

      const orders = data.data?.orders || data.data?.items || data.orders || data.items || [];
      const pagination = data.data || data.pagination || {};

      return {
        orders,
        total: pagination.total || orders.length,
        page: pagination.page || 1,
        limit: pagination.limit || orders.length,
        totalPages: pagination.totalPages || 1,
        hasMore: pagination.hasMore || false,
      };
    } catch (error) {
      logger.error('[CustomerService] Error fetching customer orders:', error);
      throw error;
    }
  }

  // ============================================
  // CUSTOMER NOTES
  // ============================================

  /**
   * GET /customers/:id/notes
   * Fetch all notes for a customer
   */
  async getCustomerNotes(customerId: string): Promise<CustomerNote[]> {
    try {
      const url = `${this.baseUrl}/customers/${customerId}/notes`;
      logger.debug('[CustomerService] Fetching customer notes:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: {
          notes?: CustomerNote[];
        };
        notes?: CustomerNote[];
      }>(response);

      return data.data?.notes || data.notes || [];
    } catch (error) {
      logger.error('[CustomerService] Error fetching customer notes:', error);
      throw error;
    }
  }

  /**
   * POST /customers/:id/notes
   * Add a new note to a customer
   */
  async addCustomerNote(
    customerId: string,
    noteData: AddNoteRequest
  ): Promise<CustomerNote> {
    try {
      const url = `${this.baseUrl}/customers/${customerId}/notes`;
      logger.debug('[CustomerService] Adding customer note:', url, noteData);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(noteData),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: {
          note?: CustomerNote;
        };
        note?: CustomerNote;
      }>(response);

      return data.data?.note || data.note!;
    } catch (error) {
      logger.error('[CustomerService] Error adding customer note:', error);
      throw error;
    }
  }

  /**
   * PATCH /customers/:id/notes/:noteId
   * Update an existing note
   */
  async updateCustomerNote(
    customerId: string,
    noteId: string,
    updateData: Partial<AddNoteRequest>
  ): Promise<CustomerNote> {
    try {
      const url = `${this.baseUrl}/customers/${customerId}/notes/${noteId}`;
      logger.debug('[CustomerService] Updating customer note:', url, updateData);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(updateData),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: {
          note?: CustomerNote;
        };
        note?: CustomerNote;
      }>(response);

      return data.data?.note || data.note!;
    } catch (error) {
      logger.error('[CustomerService] Error updating customer note:', error);
      throw error;
    }
  }

  /**
   * DELETE /customers/:id/notes/:noteId
   * Delete a customer note
   */
  async deleteCustomerNote(
    customerId: string,
    noteId: string
  ): Promise<{ success: boolean }> {
    try {
      const url = `${this.baseUrl}/customers/${customerId}/notes/${noteId}`;
      logger.debug('[CustomerService] Deleting customer note:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return this.handleResponse<{ success: boolean }>(response);
    } catch (error) {
      logger.error('[CustomerService] Error deleting customer note:', error);
      throw error;
    }
  }

  // ============================================
  // CUSTOMER SEGMENTATION
  // ============================================

  /**
   * GET /customers/:merchantId/segments
   * Get segment distribution and analytics
   */
  async getSegmentAnalytics(merchantId: string): Promise<SegmentAnalytics[]> {
    try {
      const url = `${this.baseUrl}/customers/${merchantId}/segments`;
      logger.debug('[CustomerService] Fetching segment analytics:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: {
          segments?: SegmentAnalytics[];
        };
        segments?: SegmentAnalytics[];
      }>(response);

      return data.data?.segments || data.segments || [];
    } catch (error) {
      logger.error('[CustomerService] Error fetching segment analytics:', error);
      throw error;
    }
  }

  /**
   * POST /customers/:id/segment
   * Manually update customer segment
   */
  async updateCustomerSegment(
    customerId: string,
    segment: CustomerSegment,
    source: string = 'manual'
  ): Promise<Customer> {
    try {
      const url = `${this.baseUrl}/customers/${customerId}/segment`;
      logger.debug('[CustomerService] Updating customer segment:', url, { segment, source });

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ segment, source }),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: Customer;
        customer?: Customer;
      }>(response);

      return data.data || data.customer!;
    } catch (error) {
      logger.error('[CustomerService] Error updating customer segment:', error);
      throw error;
    }
  }

  /**
   * POST /customers/:merchantId/segments/recalculate
   * Recalculate segments for all customers
   */
  async recalculateSegments(merchantId: string): Promise<{
    success: boolean;
    updated: number;
  }> {
    try {
      const url = `${this.baseUrl}/customers/${merchantId}/segments/recalculate`;
      logger.debug('[CustomerService] Recalculating segments:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      return this.handleResponse<{
        success?: boolean;
        data?: {
          updated?: number;
        };
        updated?: number;
      }>(response);
    } catch (error) {
      logger.error('[CustomerService] Error recalculating segments:', error);
      throw error;
    }
  }

  // ============================================
  // CUSTOMER LIFETIME VALUE (CLV)
  // ============================================

  /**
   * Calculate Customer Lifetime Value locally
   * Uses historical data to predict future value
   */
  calculateCLV(customer: Customer): CustomerLifetimeValue {
    const stats = customer.stats || {
      totalOrders: customer.totalOrders || 0,
      totalSpent: customer.totalSpent || 0,
      averageOrderValue: customer.averageOrderValue || 0,
    };

    const avgOrderValue = stats.averageOrderValue || (stats.totalSpent / (stats.totalOrders || 1));
    const orderCount = stats.totalOrders || 0;

    // Calculate recency factor (0-1, higher = more recent activity)
    const lastOrderDate = customer.lastOrderDate || customer.lastOrderAt;
    let recencyFactor = 0;
    if (lastOrderDate) {
      const daysSinceLastOrder = Math.floor(
        (Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastOrder <= 30) recencyFactor = 1;
      else if (daysSinceLastOrder <= 60) recencyFactor = 0.8;
      else if (daysSinceLastOrder <= 90) recencyFactor = 0.5;
      else if (daysSinceLastOrder <= 180) recencyFactor = 0.3;
      else recencyFactor = 0.1;
    }

    // Calculate frequency factor (orders per month average)
    const firstOrderDate = customer.firstOrderDate || stats.firstOrderDate;
    let monthsAsCustomer = 1;
    if (firstOrderDate) {
      monthsAsCustomer = Math.max(
        1,
        Math.floor((Date.now() - new Date(firstOrderDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
      );
    }
    const ordersPerMonth = orderCount / monthsAsCustomer;

    // Calculate monetary value
    const monetaryValue = avgOrderValue;

    // CLV Score calculation (0-100)
    // Components: recency (30%), frequency (30%), monetary (40%)
    const recencyScore = recencyFactor * 30;
    const frequencyScore = Math.min(ordersPerMonth / 5, 1) * 30; // Normalize to max 5 orders/month
    const monetaryScore = Math.min(monetaryValue / 500, 1) * 40; // Normalize to max $500/order

    const score = Math.round(recencyScore + frequencyScore + monetaryScore);

    // Determine tier
    let tier: CustomerLifetimeValue['tier'] = 'bronze';
    if (score >= 75) tier = 'platinum';
    else if (score >= 50) tier = 'gold';
    else if (score >= 25) tier = 'silver';

    // Calculate predicted value (next 12 months)
    const predictedMonthlyOrders = ordersPerMonth * recencyFactor;
    const predictedValue = predictedMonthlyOrders * 12 * avgOrderValue;

    return {
      currentValue: stats.totalSpent || customer.totalSpent || 0,
      predictedValue: Math.round(predictedValue * 100) / 100,
      potentialValue: Math.round((stats.totalSpent + predictedValue) * 100) / 100,
      score,
      tier,
      lastCalculated: new Date().toISOString(),
    };
  }

  /**
   * GET /customers/:merchantId/ltv
   * Get CLV statistics for all customers
   */
  async getMerchantCLVStats(merchantId: string): Promise<{
    averageLTV: number;
    totalLTV: number;
    topCustomers: Customer[];
    distribution: {
      bronze: number;
      silver: number;
      gold: number;
      platinum: number;
    };
  }> {
    try {
      const url = `${this.baseUrl}/customers/${merchantId}/ltv`;
      logger.debug('[CustomerService] Fetching CLV stats:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return this.handleResponse<{
        success?: boolean;
        data?: {
          averageLTV?: number;
          totalLTV?: number;
          topCustomers?: Customer[];
          distribution?: {
            bronze: number;
            silver: number;
            gold: number;
            platinum: number;
          };
        };
        averageLTV?: number;
        totalLTV?: number;
        topCustomers?: Customer[];
        distribution?: {
          bronze: number;
          silver: number;
          gold: number;
          platinum: number;
        };
      }>(response);
    } catch (error) {
      logger.error('[CustomerService] Error fetching CLV stats:', error);
      throw error;
    }
  }

  // ============================================
  // CUSTOMER INSIGHTS
  // ============================================

  /**
   * GET /customers/:merchantId/insights
   * Get comprehensive customer insights
   */
  async getCustomerInsights(merchantId: string): Promise<CustomerInsights> {
    try {
      const url = `${this.baseUrl}/customers/${merchantId}/insights`;
      logger.debug('[CustomerService] Fetching customer insights:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: CustomerInsights;
        insights?: CustomerInsights;
      }>(response);

      return data.data || data.insights!;
    } catch (error) {
      logger.error('[CustomerService] Error fetching customer insights:', error);
      throw error;
    }
  }

  // ============================================
  // SEARCH & FILTERING
  // ============================================

  /**
   * Search customers by phone number
   */
  async searchByPhone(merchantId: string, phone: string): Promise<Customer | null> {
    try {
      const customers = await this.getCustomers({
        merchantId,
        query: phone,
        limit: 1,
      });

      return customers.customers[0] || null;
    } catch (error) {
      logger.error('[CustomerService] Error searching by phone:', error);
      throw error;
    }
  }

  /**
   * Search customers by email
   */
  async searchByEmail(merchantId: string, email: string): Promise<Customer | null> {
    try {
      const customers = await this.getCustomers({
        merchantId,
        query: email,
        limit: 1,
      });

      return customers.customers[0] || null;
    } catch (error) {
      logger.error('[CustomerService] Error searching by email:', error);
      throw error;
    }
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Export customers
   */
  async exportCustomers(params: ExportCustomersParams): Promise<string> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('merchantId', params.merchantId);
      if (params.format) searchParams.append('format', params.format);
      if (params.includeStats) searchParams.append('includeStats', 'true');
      if (params.includeNotes) searchParams.append('includeNotes', 'true');
      if (params.segments) {
        params.segments.forEach((s) => searchParams.append('segments', s));
      }

      const url = `${this.baseUrl}/customers/${params.merchantId}/export?${searchParams.toString()}`;
      logger.debug('[CustomerService] Exporting customers:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.text();
      return data;
    } catch (error) {
      logger.error('[CustomerService] Error exporting customers:', error);
      throw error;
    }
  }

  /**
   * Add tags to multiple customers
   */
  async bulkAddTags(
    merchantId: string,
    customerIds: string[],
    tags: string[]
  ): Promise<{ success: boolean; updated: number }> {
    try {
      const url = `${this.baseUrl}/customers/${merchantId}/bulk/tags`;
      logger.debug('[CustomerService] Bulk adding tags:', url, { customerIds, tags });

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ customerIds, tags, action: 'add' }),
      });

      return this.handleResponse<{
        success?: boolean;
        data?: {
          updated?: number;
        };
        updated?: number;
      }>(response);
    } catch (error) {
      logger.error('[CustomerService] Error bulk adding tags:', error);
      throw error;
    }
  }

  /**
   * Remove tags from multiple customers
   */
  async bulkRemoveTags(
    merchantId: string,
    customerIds: string[],
    tags: string[]
  ): Promise<{ success: boolean; updated: number }> {
    try {
      const url = `${this.baseUrl}/customers/${merchantId}/bulk/tags`;
      logger.debug('[CustomerService] Bulk removing tags:', url, { customerIds, tags });

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ customerIds, tags, action: 'remove' }),
      });

      return this.handleResponse<{
        success?: boolean;
        data?: {
          updated?: number;
        };
        updated?: number;
      }>(response);
    } catch (error) {
      logger.error('[CustomerService] Error bulk removing tags:', error);
      throw error;
    }
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return this.handleResponse<{ status: string; timestamp: string }>(response);
    } catch (error) {
      logger.error('[CustomerService] Health check failed:', error);
      throw error;
    }
  }
}

// ============================================
// EXPORTS
// ============================================

export const customerService = new CustomerService();
export default customerService;

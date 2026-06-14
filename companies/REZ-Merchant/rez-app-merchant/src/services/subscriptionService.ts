/**
 * Subscription Service - Membership & Subscription Management
 *
 * Connects directly to https://rez-merchant-service.onrender.com
 * Provides subscription plans, members, payments, and analytics
 * functionality for merchant membership programs.
 */

import { logger } from '@/utils/logger';

// Subscription Service base URL
const SUBSCRIPTION_SERVICE_URL =
  process.env.EXPO_PUBLIC_SUBSCRIPTION_SERVICE_URL || 'https://rez-merchant-service.onrender.com/api/v1/subscriptions';

// ============================================
// TYPES & INTERFACES
// ============================================

// Subscription Plan Types
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired' | 'frozen';
export type BillingCycle = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type PlanType = 'basic' | 'standard' | 'premium' | 'enterprise';

export interface SubscriptionPlan {
  id: string;
  _id?: string;
  merchantId: string;
  name: string;
  description?: string;
  planType?: PlanType;
  price: number;
  originalPrice?: number;
  currency?: string;
  billingCycle: BillingCycle;
  duration: number; // in days
  features?: string[];
  benefits?: string[];
  maxUses?: number; // null = unlimited
  currentUses?: number;
  minSpend?: number; // minimum monthly spend requirement
  discount?: number; // percentage discount
  isActive: boolean;
  isFeatured?: boolean;
  isDefault?: boolean;
  maxMembers?: number;
  currentMembers?: number;
  color?: string;
  icon?: string;
  image?: string;
  terms?: string;
  cancellationPolicy?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlan {
  name: string;
  description?: string;
  planType?: PlanType;
  price: number;
  originalPrice?: number;
  currency?: string;
  billingCycle: BillingCycle;
  duration: number;
  features?: string[];
  benefits?: string[];
  maxUses?: number;
  minSpend?: number;
  discount?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  isDefault?: boolean;
  maxMembers?: number;
  color?: string;
  icon?: string;
  image?: string;
  terms?: string;
  cancellationPolicy?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdatePlan {
  name?: string;
  description?: string;
  planType?: PlanType;
  price?: number;
  originalPrice?: number;
  billingCycle?: BillingCycle;
  duration?: number;
  features?: string[];
  benefits?: string[];
  maxUses?: number;
  minSpend?: number;
  discount?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  isDefault?: boolean;
  maxMembers?: number;
  color?: string;
  icon?: string;
  image?: string;
  terms?: string;
  cancellationPolicy?: string;
  metadata?: Record<string, unknown>;
}

// Subscription Member Types
export type MemberStatus = 'active' | 'paused' | 'cancelled' | 'expired' | 'frozen' | 'pending' | 'trial';

export interface SubscriptionMember {
  id: string;
  _id?: string;
  merchantId: string;
  planId: string;
  plan?: SubscriptionPlan;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    avatar?: string;
  };
  status: MemberStatus;
  startDate: string;
  endDate: string;
  nextBillingDate?: string;
  autoRenew?: boolean;
  usesRemaining?: number;
  totalUses?: number;
  freezeStartDate?: string;
  freezeEndDate?: string;
  pausedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  notes?: string;
  referralCode?: string;
  referredBy?: string;
  welcomeMessage?: string;
  paymentMethod?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SubscribeMember {
  merchantId: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  startDate?: string;
  autoRenew?: boolean;
  paymentMethod?: string;
  notes?: string;
  referralCode?: string;
  metadata?: Record<string, unknown>;
}

// Payment Types
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'netbanking' | 'wallet' | 'other';
export type PaymentType = 'subscription' | 'renewal' | 'upgrade' | 'one_time' | 'penalty';

export interface Payment {
  id: string;
  _id?: string;
  merchantId: string;
  memberId: string;
  member?: SubscriptionMember;
  planId?: string;
  plan?: SubscriptionPlan;
  amount: number;
  currency?: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentType?: PaymentType;
  transactionId?: string;
  orderId?: string;
  gatewayResponse?: Record<string, unknown>;
  description?: string;
  receiptUrl?: string;
  paidAt?: string;
  dueDate?: string;
  refundedAt?: string;
  refundReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface InitiatePaymentRequest {
  amount: number;
  paymentMethod?: PaymentMethod;
  description?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

// Analytics Types
export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface SubscriptionAnalytics {
  merchantId: string;
  dateRange: DateRange;
  totalPlans: number;
  activePlans: number;
  totalMembers: number;
  activeMembers: number;
  frozenMembers: number;
  cancelledMembers: number;
  expiredMembers: number;
  newMembersThisPeriod: number;
  churnedMembersThisPeriod: number;
  grossRevenue: number;
  netRevenue: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  averageRevenuePerMember: number;
  churnRate: number;
  retentionRate: number;
  topPlans: Array<{
    plan: SubscriptionPlan;
    memberCount: number;
    revenue: number;
  }>;
  revenueByPlan: Record<string, number>;
  membersByStatus: Record<MemberStatus, number>;
  revenueTrend: Array<{
    date: string;
    revenue: number;
    newMembers: number;
    churnedMembers: number;
  }>;
  generatedAt: string;
}

// Service Error Type
interface SubscriptionServiceError {
  code: string;
  message: string;
  statusCode?: number;
}

// ============================================
// SERVICE CLASS
// ============================================

class SubscriptionService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = SUBSCRIPTION_SERVICE_URL;
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

  private getPlanId(plan: SubscriptionPlan): string {
    return plan._id || plan.id;
  }

  private getMemberId(member: SubscriptionMember): string {
    return member._id || member.id;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: SubscriptionServiceError = {
        code: errorData.code || `HTTP_${response.status}`,
        message: errorData.message || `Request failed with status ${response.status}`,
        statusCode: response.status,
      };
      throw error;
    }
    return response.json();
  }

  // ============================================
  // SUBSCRIPTION PLANS CRUD
  // ============================================

  /**
   * GET /subscriptions/plans/:merchantId
   * Fetch all subscription plans for a merchant
   */
  async getSubscriptions(merchantId: string): Promise<SubscriptionPlan[]> {
    try {
      const url = `${this.baseUrl}/plans/${merchantId}`;
      logger.debug('[SubscriptionService] Fetching subscription plans:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: {
          plans?: SubscriptionPlan[];
          items?: SubscriptionPlan[];
        };
        plans?: SubscriptionPlan[];
        items?: SubscriptionPlan[];
      }>(response);

      return data.data?.plans || data.data?.items || data.plans || data.items || [];
    } catch (error) {
      logger.error('[SubscriptionService] Error fetching subscription plans:', error);
      throw error;
    }
  }

  /**
   * GET /subscriptions/plans/detail/:id
   * Fetch a single subscription plan by ID
   */
  async getSubscriptionById(id: string): Promise<SubscriptionPlan> {
    try {
      const url = `${this.baseUrl}/plans/detail/${id}`;
      logger.debug('[SubscriptionService] Fetching subscription plan:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: SubscriptionPlan;
        plan?: SubscriptionPlan;
      }>(response);

      return data.data || data.plan!;
    } catch (error) {
      logger.error('[SubscriptionService] Error fetching subscription plan:', error);
      throw error;
    }
  }

  /**
   * POST /subscriptions/plans
   * Create a new subscription plan
   */
  async createSubscription(data: CreatePlan): Promise<SubscriptionPlan> {
    try {
      const url = `${this.baseUrl}/plans`;
      logger.debug('[SubscriptionService] Creating subscription plan:', url, data);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      const result = await this.handleResponse<{
        success?: boolean;
        data?: SubscriptionPlan;
        plan?: SubscriptionPlan;
      }>(response);

      return result.data || result.plan!;
    } catch (error) {
      logger.error('[SubscriptionService] Error creating subscription plan:', error);
      throw error;
    }
  }

  /**
   * PATCH /subscriptions/plans/:id
   * Update a subscription plan
   */
  async updateSubscription(id: string, data: UpdatePlan): Promise<SubscriptionPlan> {
    try {
      const url = `${this.baseUrl}/plans/${id}`;
      logger.debug('[SubscriptionService] Updating subscription plan:', url, data);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      const result = await this.handleResponse<{
        success?: boolean;
        data?: SubscriptionPlan;
        plan?: SubscriptionPlan;
      }>(response);

      return result.data || result.plan!;
    } catch (error) {
      logger.error('[SubscriptionService] Error updating subscription plan:', error);
      throw error;
    }
  }

  /**
   * DELETE /subscriptions/plans/:id
   * Delete a subscription plan
   */
  async deleteSubscription(id: string): Promise<void> {
    try {
      const url = `${this.baseUrl}/plans/${id}`;
      logger.debug('[SubscriptionService] Deleting subscription plan:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      await this.handleResponse<{ success: boolean }>(response);
    } catch (error) {
      logger.error('[SubscriptionService] Error deleting subscription plan:', error);
      throw error;
    }
  }

  // ============================================
  // SUBSCRIPTION MEMBERS
  // ============================================

  /**
   * GET /subscriptions/members/:merchantId
   * Fetch all active members for a merchant
   */
  async getActiveMembers(merchantId: string): Promise<SubscriptionMember[]> {
    try {
      const url = `${this.baseUrl}/members/${merchantId}?status=active`;
      logger.debug('[SubscriptionService] Fetching active members:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: {
          members?: SubscriptionMember[];
          items?: SubscriptionMember[];
        };
        members?: SubscriptionMember[];
        items?: SubscriptionMember[];
      }>(response);

      return data.data?.members || data.data?.items || data.members || data.items || [];
    } catch (error) {
      logger.error('[SubscriptionService] Error fetching active members:', error);
      throw error;
    }
  }

  /**
   * GET /subscriptions/members/detail/:id
   * Fetch a single member by ID
   */
  async getMemberById(id: string): Promise<SubscriptionMember> {
    try {
      const url = `${this.baseUrl}/members/detail/${id}`;
      logger.debug('[SubscriptionService] Fetching member:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: SubscriptionMember;
        member?: SubscriptionMember;
      }>(response);

      return data.data || data.member!;
    } catch (error) {
      logger.error('[SubscriptionService] Error fetching member:', error);
      throw error;
    }
  }

  /**
   * GET /subscriptions/members/phone/:phone
   * Fetch a member by phone number
   */
  async getMemberByPhone(phone: string): Promise<SubscriptionMember> {
    try {
      const url = `${this.baseUrl}/members/phone/${encodeURIComponent(phone)}`;
      logger.debug('[SubscriptionService] Fetching member by phone:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: SubscriptionMember;
        member?: SubscriptionMember;
      }>(response);

      return data.data || data.member!;
    } catch (error) {
      logger.error('[SubscriptionService] Error fetching member by phone:', error);
      throw error;
    }
  }

  /**
   * POST /subscriptions/members
   * Subscribe a new member to a plan
   */
  async subscribeMember(planId: string, data: SubscribeMember): Promise<SubscriptionMember> {
    try {
      const url = `${this.baseUrl}/members`;
      logger.debug('[SubscriptionService] Subscribing member:', url, { planId, ...data });

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ planId, ...data }),
      });

      const result = await this.handleResponse<{
        success?: boolean;
        data?: SubscriptionMember;
        member?: SubscriptionMember;
      }>(response);

      return result.data || result.member!;
    } catch (error) {
      logger.error('[SubscriptionService] Error subscribing member:', error);
      throw error;
    }
  }

  /**
   * DELETE /subscriptions/members/:id
   * Unsubscribe/cancel a member
   */
  async unsubscribeMember(memberId: string): Promise<void> {
    try {
      const url = `${this.baseUrl}/members/${memberId}`;
      logger.debug('[SubscriptionService] Unsubscribing member:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      await this.handleResponse<{ success: boolean }>(response);
    } catch (error) {
      logger.error('[SubscriptionService] Error unsubscribing member:', error);
      throw error;
    }
  }

  // ============================================
  // MEMBER MANAGEMENT
  // ============================================

  /**
   * POST /subscriptions/members/:id/freeze
   * Freeze a subscription for a specified duration
   */
  async freezeSubscription(memberId: string, duration: number): Promise<void> {
    try {
      const url = `${this.baseUrl}/members/${memberId}/freeze`;
      logger.debug('[SubscriptionService] Freezing subscription:', url, { duration });

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ duration }), // duration in days
      });

      await this.handleResponse<{ success: boolean }>(response);
    } catch (error) {
      logger.error('[SubscriptionService] Error freezing subscription:', error);
      throw error;
    }
  }

  /**
   * POST /subscriptions/members/:id/unfreeze
   * Unfreeze a frozen subscription
   */
  async unfreezeSubscription(memberId: string): Promise<void> {
    try {
      const url = `${this.baseUrl}/members/${memberId}/unfreeze`;
      logger.debug('[SubscriptionService] Unfreezing subscription:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      await this.handleResponse<{ success: boolean }>(response);
    } catch (error) {
      logger.error('[SubscriptionService] Error unfreezing subscription:', error);
      throw error;
    }
  }

  /**
   * POST /subscriptions/members/:id/upgrade
   * Upgrade a member to a new plan
   */
  async upgradePlan(memberId: string, newPlanId: string): Promise<SubscriptionMember> {
    try {
      const url = `${this.baseUrl}/members/${memberId}/upgrade`;
      logger.debug('[SubscriptionService] Upgrading plan:', url, { newPlanId });

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ newPlanId }),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: SubscriptionMember;
        member?: SubscriptionMember;
      }>(response);

      return data.data || data.member!;
    } catch (error) {
      logger.error('[SubscriptionService] Error upgrading plan:', error);
      throw error;
    }
  }

  /**
   * POST /subscriptions/members/:id/renew
   * Renew a subscription
   */
  async renewSubscription(memberId: string): Promise<void> {
    try {
      const url = `${this.baseUrl}/members/${memberId}/renew`;
      logger.debug('[SubscriptionService] Renewing subscription:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      await this.handleResponse<{ success: boolean }>(response);
    } catch (error) {
      logger.error('[SubscriptionService] Error renewing subscription:', error);
      throw error;
    }
  }

  // ============================================
  // PAYMENTS
  // ============================================

  /**
   * GET /subscriptions/payments/:memberId
   * Fetch payment history for a member
   */
  async getPaymentHistory(memberId: string): Promise<Payment[]> {
    try {
      const url = `${this.baseUrl}/payments/${memberId}`;
      logger.debug('[SubscriptionService] Fetching payment history:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: {
          payments?: Payment[];
          items?: Payment[];
        };
        payments?: Payment[];
        items?: Payment[];
      }>(response);

      return data.data?.payments || data.data?.items || data.payments || data.items || [];
    } catch (error) {
      logger.error('[SubscriptionService] Error fetching payment history:', error);
      throw error;
    }
  }

  /**
   * POST /subscriptions/payments/initiate/:memberId
   * Initiate a payment for a member
   */
  async initiatePayment(memberId: string, amount: number): Promise<Payment> {
    try {
      const url = `${this.baseUrl}/payments/initiate/${memberId}`;
      logger.debug('[SubscriptionService] Initiating payment:', url, { amount });

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ amount }),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: Payment;
        payment?: Payment;
      }>(response);

      return data.data || data.payment!;
    } catch (error) {
      logger.error('[SubscriptionService] Error initiating payment:', error);
      throw error;
    }
  }

  /**
   * POST /subscriptions/payments/callback/:paymentId
   * Handle payment callback from gateway
   */
  async handlePaymentCallback(paymentId: string, status: PaymentStatus): Promise<void> {
    try {
      const url = `${this.baseUrl}/payments/callback/${paymentId}`;
      logger.debug('[SubscriptionService] Handling payment callback:', url, { status });

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ status }),
      });

      await this.handleResponse<{ success: boolean }>(response);
    } catch (error) {
      logger.error('[SubscriptionService] Error handling payment callback:', error);
      throw error;
    }
  }

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * GET /subscriptions/analytics/:merchantId
   * Get comprehensive subscription analytics
   */
  async getSubscriptionAnalytics(
    merchantId: string,
    dateRange: DateRange
  ): Promise<SubscriptionAnalytics> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('startDate', dateRange.startDate);
      searchParams.append('endDate', dateRange.endDate);

      const url = `${this.baseUrl}/analytics/${merchantId}?${searchParams.toString()}`;
      logger.debug('[SubscriptionService] Fetching subscription analytics:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: SubscriptionAnalytics;
        analytics?: SubscriptionAnalytics;
      }>(response);

      return data.data || data.analytics!;
    } catch (error) {
      logger.error('[SubscriptionService] Error fetching subscription analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate churn rate locally
   * Churn rate = (Lost customers / Total customers at start) * 100
   */
  async getChurnRate(merchantId: string): Promise<number> {
    try {
      const url = `${this.baseUrl}/analytics/${merchantId}/churn`;
      logger.debug('[SubscriptionService] Fetching churn rate:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: {
          churnRate?: number;
        };
        churnRate?: number;
      }>(response);

      return data.data?.churnRate ?? data.churnRate ?? 0;
    } catch (error) {
      logger.error('[SubscriptionService] Error fetching churn rate:', error);
      throw error;
    }
  }

  /**
   * Calculate Monthly Recurring Revenue (MRR) locally
   * MRR = Sum of all active subscription revenue normalized to monthly
   */
  async getMRR(merchantId: string): Promise<number> {
    try {
      const url = `${this.baseUrl}/analytics/${merchantId}/mrr`;
      logger.debug('[SubscriptionService] Fetching MRR:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: {
          mrr?: number;
        };
        mrr?: number;
      }>(response);

      return data.data?.mrr ?? data.mrr ?? 0;
    } catch (error) {
      logger.error('[SubscriptionService] Error fetching MRR:', error);
      throw error;
    }
  }

  // ============================================
  // ADDITIONAL METHODS
  // ============================================

  /**
   * GET /subscriptions/members/:merchantId/all
   * Fetch all members with optional status filter
   */
  async getAllMembers(
    merchantId: string,
    options?: {
      status?: MemberStatus | MemberStatus[];
      planId?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    members: SubscriptionMember[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const searchParams = new URLSearchParams();
      if (options?.status) {
        const statuses = Array.isArray(options.status) ? options.status : [options.status];
        statuses.forEach((s) => searchParams.append('status', s));
      }
      if (options?.planId) searchParams.append('planId', options.planId);
      if (options?.page) searchParams.append('page', options.page.toString());
      if (options?.limit) searchParams.append('limit', options.limit.toString());

      const url = `${this.baseUrl}/members/${merchantId}/all?${searchParams.toString()}`;
      logger.debug('[SubscriptionService] Fetching all members:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: {
          members?: SubscriptionMember[];
          items?: SubscriptionMember[];
          total?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
        };
        members?: SubscriptionMember[];
        items?: SubscriptionMember[];
        pagination?: {
          total?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
        };
      }>(response);

      const members = data.data?.members || data.data?.items || data.members || data.items || [];
      const pagination = data.data || data.pagination || {};

      return {
        members,
        total: pagination.total || members.length,
        page: pagination.page || 1,
        limit: pagination.limit || members.length,
        totalPages: pagination.totalPages || 1,
      };
    } catch (error) {
      logger.error('[SubscriptionService] Error fetching all members:', error);
      throw error;
    }
  }

  /**
   * PATCH /subscriptions/members/:id
   * Update member details
   */
  async updateMember(
    memberId: string,
    updateData: Partial<{
      status: MemberStatus;
      autoRenew: boolean;
      notes: string;
      paymentMethod: string;
    }>
  ): Promise<SubscriptionMember> {
    try {
      const url = `${this.baseUrl}/members/${memberId}`;
      logger.debug('[SubscriptionService] Updating member:', url, updateData);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(updateData),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: SubscriptionMember;
        member?: SubscriptionMember;
      }>(response);

      return data.data || data.member!;
    } catch (error) {
      logger.error('[SubscriptionService] Error updating member:', error);
      throw error;
    }
  }

  /**
   * POST /subscriptions/members/:id/pause
   * Pause a subscription temporarily
   */
  async pauseSubscription(memberId: string): Promise<void> {
    try {
      const url = `${this.baseUrl}/members/${memberId}/pause`;
      logger.debug('[SubscriptionService] Pausing subscription:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      await this.handleResponse<{ success: boolean }>(response);
    } catch (error) {
      logger.error('[SubscriptionService] Error pausing subscription:', error);
      throw error;
    }
  }

  /**
   * POST /subscriptions/members/:id/resume
   * Resume a paused subscription
   */
  async resumeSubscription(memberId: string): Promise<void> {
    try {
      const url = `${this.baseUrl}/members/${memberId}/resume`;
      logger.debug('[SubscriptionService] Resuming subscription:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      await this.handleResponse<{ success: boolean }>(response);
    } catch (error) {
      logger.error('[SubscriptionService] Error resuming subscription:', error);
      throw error;
    }
  }

  /**
   * GET /subscriptions/members/:merchantId/expiring
   * Get members with subscriptions expiring soon
   */
  async getExpiringMembers(
    merchantId: string,
    daysAhead: number = 7
  ): Promise<SubscriptionMember[]> {
    try {
      const url = `${this.baseUrl}/members/${merchantId}/expiring?days=${daysAhead}`;
      logger.debug('[SubscriptionService] Fetching expiring members:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: {
          members?: SubscriptionMember[];
        };
        members?: SubscriptionMember[];
      }>(response);

      return data.data?.members || data.members || [];
    } catch (error) {
      logger.error('[SubscriptionService] Error fetching expiring members:', error);
      throw error;
    }
  }

  /**
   * POST /subscriptions/plans/:id/toggle
   * Toggle plan active status
   */
  async togglePlan(planId: string): Promise<SubscriptionPlan> {
    try {
      const url = `${this.baseUrl}/plans/${planId}/toggle`;
      logger.debug('[SubscriptionService] Toggling plan:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: SubscriptionPlan;
        plan?: SubscriptionPlan;
      }>(response);

      return data.data || data.plan!;
    } catch (error) {
      logger.error('[SubscriptionService] Error toggling plan:', error);
      throw error;
    }
  }

  /**
   * POST /subscriptions/plans/:id/duplicate
   * Duplicate an existing plan
   */
  async duplicatePlan(planId: string, newName?: string): Promise<SubscriptionPlan> {
    try {
      const url = `${this.baseUrl}/plans/${planId}/duplicate`;
      logger.debug('[SubscriptionService] Duplicating plan:', url, { newName });

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ newName }),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: SubscriptionPlan;
        plan?: SubscriptionPlan;
      }>(response);

      return data.data || data.plan!;
    } catch (error) {
      logger.error('[SubscriptionService] Error duplicating plan:', error);
      throw error;
    }
  }

  /**
   * GET /subscriptions/:merchantId/revenue
   * Get revenue breakdown by plan
   */
  async getRevenueByPlan(merchantId: string): Promise<Record<string, number>> {
    try {
      const url = `${this.baseUrl}/${merchantId}/revenue`;
      logger.debug('[SubscriptionService] Fetching revenue by plan:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse<{
        success?: boolean;
        data?: Record<string, number>;
        revenue?: Record<string, number>;
      }>(response);

      return data.data || data.revenue || {};
    } catch (error) {
      logger.error('[SubscriptionService] Error fetching revenue by plan:', error);
      throw error;
    }
  }

  /**
   * Health check for the subscription service
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${SUBSCRIPTION_SERVICE_URL}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return this.handleResponse<{ status: string; timestamp: string }>(response);
    } catch (error) {
      logger.error('[SubscriptionService] Health check failed:', error);
      throw error;
    }
  }
}

// ============================================
// MOCK DATA FOR DEVELOPMENT
// ============================================

export const MOCK_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_001',
    merchantId: 'merchant_001',
    name: 'Basic Membership',
    description: 'Basic tier with essential benefits',
    planType: 'basic',
    price: 9.99,
    billingCycle: 'monthly',
    duration: 30,
    features: ['10% off all orders', 'Free delivery', 'Priority support'],
    benefits: ['Discount on purchases', 'Free delivery'],
    maxUses: null,
    isActive: true,
    isDefault: true,
    color: '#3B82F6',
    icon: 'star',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'plan_002',
    merchantId: 'merchant_001',
    name: 'Premium Membership',
    description: 'Premium tier with exclusive benefits',
    planType: 'premium',
    price: 19.99,
    originalPrice: 29.99,
    billingCycle: 'monthly',
    duration: 30,
    features: ['20% off all orders', 'Free delivery', 'Priority support', 'Exclusive events', 'Birthday bonus'],
    benefits: ['Higher discounts', 'Free delivery', 'Priority support', 'Exclusive access'],
    maxUses: null,
    isActive: true,
    isFeatured: true,
    color: '#8B5CF6',
    icon: 'crown',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'plan_003',
    merchantId: 'merchant_001',
    name: 'VIP Annual',
    description: 'Annual VIP membership with maximum benefits',
    planType: 'enterprise',
    price: 199.99,
    billingCycle: 'yearly',
    duration: 365,
    features: ['30% off all orders', 'Free delivery', '24/7 VIP support', 'Exclusive events', 'Birthday bonus', 'Free items monthly'],
    benefits: ['Maximum discounts', 'Free delivery', 'VIP support', 'Exclusive access', 'Monthly freebies'],
    maxUses: null,
    isActive: true,
    color: '#FFD700',
    icon: 'diamond',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
];

export const MOCK_SUBSCRIPTION_MEMBERS: SubscriptionMember[] = [
  {
    id: 'member_001',
    merchantId: 'merchant_001',
    planId: 'plan_002',
    customerId: 'cust_001',
    customerName: 'John Doe',
    customerPhone: '+1234567890',
    customerEmail: 'john@example.com',
    status: 'active',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2025-01-01T00:00:00Z',
    nextBillingDate: '2024-02-01T00:00:00Z',
    autoRenew: true,
    usesRemaining: null,
    totalUses: 15,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'member_002',
    merchantId: 'merchant_001',
    planId: 'plan_001',
    customerId: 'cust_002',
    customerName: 'Jane Smith',
    customerPhone: '+1234567891',
    customerEmail: 'jane@example.com',
    status: 'active',
    startDate: '2024-02-01T00:00:00Z',
    endDate: '2025-02-01T00:00:00Z',
    nextBillingDate: '2024-03-01T00:00:00Z',
    autoRenew: true,
    usesRemaining: null,
    totalUses: 8,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
  },
  {
    id: 'member_003',
    merchantId: 'merchant_001',
    planId: 'plan_003',
    customerId: 'cust_003',
    customerName: 'Bob Wilson',
    customerPhone: '+1234567892',
    customerEmail: 'bob@example.com',
    status: 'frozen',
    startDate: '2024-01-15T00:00:00Z',
    endDate: '2025-01-15T00:00:00Z',
    freezeStartDate: '2024-02-15T00:00:00Z',
    freezeEndDate: '2024-03-15T00:00:00Z',
    autoRenew: true,
    usesRemaining: null,
    totalUses: 25,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
  },
];

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'payment_001',
    merchantId: 'merchant_001',
    memberId: 'member_001',
    planId: 'plan_002',
    amount: 19.99,
    currency: 'USD',
    status: 'completed',
    paymentMethod: 'card',
    paymentType: 'subscription',
    transactionId: 'txn_001',
    paidAt: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'payment_002',
    merchantId: 'merchant_001',
    memberId: 'member_002',
    planId: 'plan_001',
    amount: 9.99,
    currency: 'USD',
    status: 'completed',
    paymentMethod: 'upi',
    paymentType: 'subscription',
    transactionId: 'txn_002',
    paidAt: '2024-02-01T00:00:00Z',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
];

// ============================================
// EXPORTS
// ============================================

export const subscriptionService = new SubscriptionService();
export default subscriptionService;

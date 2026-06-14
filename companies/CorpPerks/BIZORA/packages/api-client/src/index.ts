/**
 * BIZORA API Client
 * Unified client for all BIZORA services
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';

// ============================================================================
// Configuration
// ============================================================================

export interface BizoraConfig {
  baseUrl: string;
  apiKey?: string;
  authToken?: string;
  timeout?: number;
  retryAttempts?: number;
}

export const DEFAULT_CONFIG: Partial<BizoraConfig> = {
  timeout: 30000,
  retryAttempts: 3,
};

// Service URLs
export const SERVICE_URLS = {
  // Core
  AUTH: process.env.BIZORA_AUTH_URL || 'http://localhost:4001',
  CHAT: process.env.BIZORA_CHAT_URL || 'http://localhost:4002',
  MARKETPLACE: process.env.BIZORA_MARKETPLACE_URL || 'http://localhost:4003',
  TAXFLOW: process.env.BIZORA_TAX_URL || 'http://localhost:4004',
  INVOICEFLOW: process.env.BIZORA_INVOICE_URL || 'http://localhost:4005',
  COMPLIANCE: process.env.BIZORA_COMPLIANCE_URL || 'http://localhost:4006',

  // Vertical SaaS
  RESTAURANT_OS: process.env.BIZORA_RESTAURANT_URL || 'http://localhost:4010',
  SALON_OS: process.env.BIZORA_SALON_URL || 'http://localhost:4011',
  HOTEL_OS: process.env.BIZORA_HOTEL_URL || 'http://localhost:4012',

  // AI
  VENDOR_MATCH: process.env.BIZORA_VENDOR_URL || 'http://localhost:4020',
  ADVISOR: process.env.BIZORA_ADVISOR_URL || 'http://localhost:4021',

  // BusinessOS
  BUSINESS_OS: process.env.BIZORA_BUSINESSOS_URL || 'http://localhost:4030',
};

// ============================================================================
// HTTP Client
// ============================================================================

class HTTPClient {
  private client: AxiosInstance;

  constructor(config: BizoraConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'X-API-Key': config.apiKey }),
        ...(config.authToken && { 'Authorization': `Bearer ${config.authToken}` }),
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          logger.error('[BIZORA Client] Unauthorized - redirect to login');
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.get(path, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async post<T>(path: string, data?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.post(path, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async put<T>(path: string, data?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.put(path, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async patch<T>(path: string, data?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.patch(path, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  async delete<T>(path: string): Promise<T> {
    try {
      const response = await this.client.delete(path);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  setAuthToken(token: string): void {
    this.client.defaults.headers['Authorization'] = `Bearer ${token}`;
  }

  private handleError(error: AxiosError): Error {
    const message = error.response?.data
      ? JSON.stringify(error.response.data)
      : error.message;
    return new Error(`API Error: ${message}`);
  }
}

// ============================================================================
// Auth Service Client
// ============================================================================

export class AuthServiceClient {
  private client: HTTPClient;

  constructor(config: BizoraConfig) {
    this.client = new HTTPClient({ ...config, baseUrl: SERVICE_URLS.AUTH });
  }

  async register(params: {
    email: string;
    password: string;
    name: string;
    phone: string;
    type: 'business_owner' | 'agency';
  }): Promise<{ user: User; token: string }> {
    return this.client.post('/api/auth/register', params);
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    return this.client.post('/api/auth/login', { email, password });
  }

  async sendOTP(phone: string): Promise<{ sent: boolean }> {
    return this.client.post('/api/auth/send-otp', { phone });
  }

  async verifyOTP(phone: string, otp: string): Promise<{ user: User; token: string }> {
    return this.client.post('/api/auth/verify-otp', { phone, otp });
  }

  async verifyToken(token: string): Promise<User> {
    return this.client.post('/api/auth/verify', { token });
  }

  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    return this.client.post('/api/auth/refresh', { refreshToken });
  }

  async logout(): Promise<void> {
    await this.client.post('/api/auth/logout');
  }

  async forgotPassword(email: string): Promise<void> {
    await this.client.post('/api/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await this.client.post('/api/auth/reset-password', { token, password });
  }
}

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  type: string;
}

// ============================================================================
// Chat Service Client
// ============================================================================

export class ChatServiceClient {
  private client: HTTPClient;

  constructor(config: BizoraConfig) {
    this.client = new HTTPClient({ ...config, baseUrl: SERVICE_URLS.CHAT });
  }

  async sendMessage(params: {
    conversationId?: string;
    message: string;
    channel?: 'web' | 'whatsapp' | 'mobile';
    userId?: string;
  }): Promise<ChatResponse> {
    return this.client.post('/api/chat/message', params);
  }

  async createConversation(userId: string): Promise<Conversation> {
    return this.client.post('/api/chat/conversations', { userId });
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    return this.client.get('/api/chat/conversations', { userId });
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return this.client.get(`/api/chat/conversations/${conversationId}/messages`);
  }
}

export interface ChatResponse {
  conversationId: string;
  message: string;
  intent: {
    category: string;
    subcategory?: string;
    confidence: number;
  };
  actions?: {
    type: 'suggestion' | 'action' | 'recommendation';
    items: Array<{
      id: string;
      title: string;
      description: string;
      price?: number;
      action: string;
    }>;
  };
}

interface Conversation {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
}

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

// ============================================================================
// Marketplace Service Client
// ============================================================================

export class MarketplaceServiceClient {
  private client: HTTPClient;

  constructor(config: BizoraConfig) {
    this.client = new HTTPClient({ ...config, baseUrl: SERVICE_URLS.MARKETPLACE });
  }

  // Agencies
  async registerAgency(params: {
    name: string;
    email: string;
    phone: string;
    description: string;
    categories: string[];
    subcategories: string[];
  }): Promise<Agency> {
    return this.client.post('/api/agencies', params);
  }

  async getAgency(agencyId: string): Promise<Agency> {
    return this.client.get(`/api/agencies/${agencyId}`);
  }

  async updateAgency(agencyId: string, updates: Partial<Agency>): Promise<Agency> {
    return this.client.patch(`/api/agencies/${agencyId}`, updates);
  }

  async verifyAgency(agencyId: string, documents: string[]): Promise<void> {
    await this.client.post(`/api/agencies/${agencyId}/verify`, { documents });
  }

  // Services
  async createService(params: ServiceParams): Promise<Service> {
    return this.client.post('/api/services', params);
  }

  async getServices(params?: {
    category?: string;
    agencyId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ServiceListResponse> {
    return this.client.get('/api/services', params as Record<string, unknown>);
  }

  async getService(serviceId: string): Promise<Service> {
    return this.client.get(`/api/services/${serviceId}`);
  }

  // Orders
  async createOrder(params: {
    serviceId: string;
    packageId?: string;
    customerDetails: {
      name: string;
      email?: string;
      phone: string;
      notes?: string;
    };
  }): Promise<Order> {
    return this.client.post('/api/orders', params);
  }

  async getOrder(orderId: string): Promise<Order> {
    return this.client.get(`/api/orders/${orderId}`);
  }

  async getOrders(params?: {
    customerId?: string;
    agencyId?: string;
    status?: string;
  }): Promise<OrderListResponse> {
    return this.client.get('/api/orders', params as Record<string, unknown>);
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    return this.client.patch(`/api/orders/${orderId}/status`, { status });
  }

  // Reviews
  async submitReview(orderId: string, review: {
    score: number;
    review?: string;
  }): Promise<void> {
    await this.client.post(`/api/orders/${orderId}/review`, review);
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return this.client.get('/api/categories');
  }
}

interface ServiceParams {
  agencyId: string;
  category: string;
  subcategory: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  deliverables: string[];
}

interface Agency {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
}

interface Service {
  id: string;
  name: string;
  price: number;
  agency: Agency;
}

interface ServiceListResponse {
  services: Service[];
  total: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
}

interface OrderListResponse {
  orders: Order[];
  total: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
}

// ============================================================================
// TaxFlow Service Client
// ============================================================================

export class TaxFlowServiceClient {
  private client: HTTPClient;

  constructor(config: BizoraConfig) {
    this.client = new HTTPClient({ ...config, baseUrl: SERVICE_URLS.TAXFLOW });
  }

  // Business Profile
  async createBusinessProfile(params: {
    businessName: string;
    businessType: string;
    gstin: string;
    pan: string;
  }): Promise<BusinessProfile> {
    return this.client.post('/api/businesses', params);
  }

  async getBusinessProfile(businessId: string): Promise<BusinessProfile> {
    return this.client.get(`/api/businesses/${businessId}`);
  }

  async updateBusinessProfile(businessId: string, updates: Partial<BusinessProfile>): Promise<BusinessProfile> {
    return this.client.patch(`/api/businesses/${businessId}`, updates);
  }

  // Filings
  async createFiling(params: {
    businessId: string;
    filingType: 'GSTR-1' | 'GSTR-3B' | 'GSTR-9' | 'TDS';
    period: string;
  }): Promise<Filing> {
    return this.client.post('/api/filings', params);
  }

  async getFilings(businessId: string, params?: {
    status?: string;
    filingType?: string;
  }): Promise<FilingListResponse> {
    return this.client.get(`/api/businesses/${businessId}/filings`, params as Record<string, unknown>);
  }

  async getFiling(filingId: string): Promise<Filing> {
    return this.client.get(`/api/filings/${filingId}`);
  }

  async updateFiling(filingId: string, data: Partial<Filing>): Promise<Filing> {
    return this.client.patch(`/api/filings/${filingId}`, data);
  }

  async calculateFiling(filingId: string): Promise<FilingSummary> {
    return this.client.post(`/api/filings/${filingId}/calculate`);
  }

  async submitFiling(filingId: string): Promise<Filing> {
    return this.client.post(`/api/filings/${filingId}/submit`);
  }

  // Reminders
  async getUpcomingDeadlines(businessId: string): Promise<Reminder[]> {
    return this.client.get(`/api/businesses/${businessId}/reminders`);
  }

  async snoozeReminder(reminderId: string, newDate: string): Promise<void> {
    await this.client.patch(`/api/reminders/${reminderId}`, { snoozedUntil: newDate });
  }
}

interface BusinessProfile {
  id: string;
  businessName: string;
  gstin: string;
  status: string;
}

interface Filing {
  id: string;
  filingType: string;
  period: string;
  status: string;
  dueDate: string;
  summary: {
    totalTaxableValue: number;
    totalTaxPayable: number;
  };
}

interface FilingListResponse {
  filings: Filing[];
  total: number;
}

interface FilingSummary {
  totalTaxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalCess: number;
  totalTaxPayable: number;
}

interface Reminder {
  id: string;
  type: string;
  title: string;
  dueDate: string;
  priority: string;
}

// ============================================================================
// InvoiceFlow Service Client
// ============================================================================

export class InvoiceFlowServiceClient {
  private client: HTTPClient;

  constructor(config: BizoraConfig) {
    this.client = new HTTPClient({ ...config, baseUrl: SERVICE_URLS.INVOICEFLOW });
  }

  async createInvoice(params: CreateInvoiceParams): Promise<Invoice> {
    return this.client.post('/api/invoices', params);
  }

  async getInvoices(businessId: string, params?: {
    status?: string;
    customerId?: string;
    from?: string;
    to?: string;
  }): Promise<InvoiceListResponse> {
    return this.client.get(`/api/businesses/${businessId}/invoices`, params as Record<string, unknown>);
  }

  async getInvoice(invoiceId: string): Promise<Invoice> {
    return this.client.get(`/api/invoices/${invoiceId}`);
  }

  async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<Invoice> {
    return this.client.patch(`/api/invoices/${invoiceId}`, updates);
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    await this.client.delete(`/api/invoices/${invoiceId}`);
  }

  async sendInvoice(invoiceId: string, params: {
    email?: string;
    phone?: string;
    channel: 'email' | 'whatsapp' | 'sms';
  }): Promise<void> {
    await this.client.post(`/api/invoices/${invoiceId}/send`, params);
  }

  async recordPayment(invoiceId: string, amount: number, method: string): Promise<Invoice> {
    return this.client.post(`/api/invoices/${invoiceId}/payment`, { amount, method });
  }

  async generatePDF(invoiceId: string): Promise<string> {
    const response = await this.client.get(`/api/invoices/${invoiceId}/pdf`);
    return response.url;
  }
}

interface CreateInvoiceParams {
  businessId: string;
  customer: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstin?: string;
    email?: string;
    phone?: string;
  };
  items: Array<{
    description: string;
    hsnCode?: string;
    quantity: number;
    unit?: string;
    rate: number;
    discount?: number;
    taxRate: number;
  }>;
  invoiceDate: string;
  dueDate: string;
  notes?: string;
  terms?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  customer: { name: string };
  invoiceDate: string;
  dueDate: string;
}

interface InvoiceListResponse {
  invoices: Invoice[];
  total: number;
}

// ============================================================================
// Unified BIZORA Client
// ============================================================================

export class BizoraClient {
  public auth: AuthServiceClient;
  public chat: ChatServiceClient;
  public marketplace: MarketplaceServiceClient;
  public taxflow: TaxFlowServiceClient;
  public invoiceflow: InvoiceFlowServiceClient;

  private config: BizoraConfig;

  constructor(config: Partial<BizoraConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || SERVICE_URLS.MARKETPLACE,
      apiKey: config.apiKey,
      timeout: config.timeout || 30000,
      ...config,
    };

    this.auth = new AuthServiceClient(this.config);
    this.chat = new ChatServiceClient(this.config);
    this.marketplace = new MarketplaceServiceClient(this.config);
    this.taxflow = new TaxFlowServiceClient(this.config);
    this.invoiceflow = new InvoiceFlowServiceClient(this.config);
  }

  setAuthToken(token: string): void {
    this.config.authToken = token;
    this.auth = new AuthServiceClient(this.config);
    this.chat = new ChatServiceClient(this.config);
    this.marketplace = new MarketplaceServiceClient(this.config);
    this.taxflow = new TaxFlowServiceClient(this.config);
    this.invoiceflow = new InvoiceFlowServiceClient(this.config);
  }
}

// ============================================================================
// Exports
// ============================================================================

export { BizoraClient as default, SERVICE_URLS, type BizoraConfig };

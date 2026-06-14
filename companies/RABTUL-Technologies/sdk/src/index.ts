/**
 * REZ SDK - Official SDK for REZ Platform
 *
 * This SDK provides easy access to all REZ services:
 * - Authentication (Auth, MFA, OTP)
 * - Payments (Razorpay, UPI, Wallets)
 * - Wallet (Coins, Cashback, Rewards)
 * - Orders (Create, Track, Cancel)
 * - Catalog (Products, Categories)
 * - Search (Full-text, Autocomplete)
 * - Notifications (Email, SMS, Push, WhatsApp)
 * - Profile (User, Addresses)
 * - QR Cloud (Merchants, Menu, Orders)
 * - Booking (Hotels, Restaurants)
 * - Loyalty (Points, Rewards, Tiers)
 *
 * @example
 * ```typescript
 * import { REZ } from '@rez/sdk';
 *
 * const client = new REZ({
 *   apiKey: 'your-api-key',
 *   environment: 'production'
 * });
 *
 * // Use services
 * const user = await client.auth.register({ email, phone });
 * const payment = await client.payments.initiate({ amount: 1000, orderId: 'order_123' });
 * ```
 */

import axios, { AxiosInstance } from 'axios';

// ============================================
// Configuration
// ============================================

export interface REZConfig {
  apiKey: string;
  apiSecret?: string;
  environment?: 'development' | 'production' | 'staging';
  timeout?: number;
  retries?: number;
}

export interface SDKResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

const ENVIRONMENTS = {
  development: 'http://localhost:4000',
  staging: 'https://rez-api-staging.onrender.com',
  production: 'https://rez-api-gateway.onrender.com'
};

// ============================================
// Auth Service
// ============================================

export class AuthService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async register(data: { email?: string; phone?: string; name?: string; password?: string }): Promise<SDKResponse> {
    return this.client.post('/api/v1/auth/register', data);
  }

  async login(data: { email?: string; phone?: string; password?: string }): Promise<SDKResponse> {
    return this.client.post('/api/v1/auth/login', data);
  }

  async sendOTP(phone: string): Promise<SDKResponse> {
    return this.client.post('/api/v1/auth/otp/send', { phone });
  }

  async verifyOTP(phone: string, otp: string): Promise<SDKResponse> {
    return this.client.post('/api/v1/auth/otp/verify', { phone, otp });
  }

  async refreshToken(token: string): Promise<SDKResponse> {
    return this.client.post('/api/v1/auth/refresh', { refresh_token: token });
  }

  async logout(token: string): Promise<SDKResponse> {
    return this.client.post('/api/v1/auth/logout', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async verify(token: string): Promise<SDKResponse> {
    return this.client.post('/api/v1/auth/verify', { token });
  }

  async me(token: string): Promise<SDKResponse> {
    return this.client.get('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async enableMFA(token: string): Promise<SDKResponse> {
    return this.client.post('/api/v1/auth/mfa/enable', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async verifyMFA(token: string, code: string): Promise<SDKResponse> {
    return this.client.post('/api/v1/auth/mfa/verify', { code }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async deleteAccount(token: string): Promise<SDKResponse> {
    return this.client.delete('/api/v1/auth/account', {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}

// ============================================
// Payment Service
// ============================================

export class PaymentService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async initiate(data: {
    amount: number;
    currency?: string;
    order_id: string;
    customer_email?: string;
    customer_phone?: string;
    description?: string;
    method?: 'upi' | 'card' | 'netbanking' | 'wallet';
  }): Promise<SDKResponse> {
    return this.client.post('/api/v1/payments/initiate', data);
  }

  async verify(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<SDKResponse> {
    return this.client.post('/api/v1/payments/verify', data);
  }

  async get(paymentId: string): Promise<SDKResponse> {
    return this.client.get(`/api/v1/payments/${paymentId}`);
  }

  async refund(paymentId: string, amount?: number, reason?: string): Promise<SDKResponse> {
    return this.client.post(`/api/v1/payments/${paymentId}/refund`, { amount, reason });
  }

  async list(params?: {
    page?: number;
    limit?: number;
    status?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<SDKResponse> {
    return this.client.get('/api/v1/payments', { params });
  }

  verifyWebhookSignature(signature: string, payload: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return signature === expectedSignature;
  }
}

// ============================================
// Wallet Service
// ============================================

export class WalletService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async getBalance(userId: string): Promise<SDKResponse> {
    return this.client.post('/api/v1/wallet/balance', { user_id: userId });
  }

  async credit(data: { user_id: string; amount: number; source: string; reference_id?: string; description?: string }): Promise<SDKResponse> {
    return this.client.post('/api/v1/wallet/credit', data);
  }

  async debit(data: { user_id: string; amount: number; source: string; reference_id?: string; description?: string }): Promise<SDKResponse> {
    return this.client.post('/api/v1/wallet/debit', data);
  }

  async getTransactions(userId: string, params?: {
    page?: number;
    limit?: number;
    type?: 'credit' | 'debit' | 'all';
  }): Promise<SDKResponse> {
    return this.client.post(`/api/v1/wallet/transactions`, {
      user_id: userId,
      ...params
    });
  }

  async addCoins(userId: string, coins: number, source: string, referenceId?: string): Promise<SDKResponse> {
    return this.client.post(`/api/v1/wallet/coins/add`, {
      user_id: userId,
      coins,
      source,
      reference_id: referenceId
    });
  }

  async redeemCoins(userId: string, coins: number, reason: string): Promise<SDKResponse> {
    return this.client.post(`/api/v1/wallet/coins/redeem`, {
      user_id: userId,
      coins,
      reason
    });
  }

  async getBonusBalance(userId: string): Promise<SDKResponse> {
    return this.client.post('/api/v1/wallet/bonus', { user_id: userId });
  }
}

// ============================================
// Order Service
// ============================================

export class OrderService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async create(data: {
    user_id: string;
    items: Array<{
      product_id: string;
      variant_id?: string;
      quantity: number;
      price: number;
    }>;
    delivery_address?: {
      name: string;
      phone?: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
    };
    payment_method: 'wallet' | 'upi' | 'card' | 'cod';
    coupon_code?: string;
  }): Promise<SDKResponse> {
    return this.client.post('/api/v1/orders', data);
  }

  async get(orderId: string): Promise<SDKResponse> {
    return this.client.get(`/api/v1/orders/${orderId}`);
  }

  async updateStatus(orderId: string, status: string): Promise<SDKResponse> {
    return this.client.patch(`/api/v1/orders/${orderId}/status`, { status });
  }

  async cancel(orderId: string, reason?: string): Promise<SDKResponse> {
    return this.client.post(`/api/v1/orders/${orderId}/cancel`, { reason });
  }

  async getByUser(userId: string, params?: { page?: number; limit?: number }): Promise<SDKResponse> {
    return this.client.post(`/api/v1/orders/user/${userId}`, params || {});
  }

  async track(orderId: string): Promise<SDKResponse> {
    return this.client.get(`/api/v1/orders/${orderId}/track`);
  }

  async addToCart(data: {
    user_id: string;
    product_id: string;
    variant_id?: string;
    quantity: number;
  }): Promise<SDKResponse> {
    return this.client.post('/api/v1/cart/add', data);
  }

  async getCart(userId: string): Promise<SDKResponse> {
    return this.client.post('/api/v1/cart', { user_id: userId });
  }

  async clearCart(userId: string): Promise<SDKResponse> {
    return this.client.post('/api/v1/cart/clear', { user_id: userId });
  }
}

// ============================================
// Catalog Service
// ============================================

export class CatalogService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async getProducts(params?: {
    category_id?: string;
    page?: number;
    limit?: number;
    sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
    min_price?: number;
    max_price?: number;
  }): Promise<SDKResponse> {
    return this.client.get('/api/v1/products', { params });
  }

  async getProduct(productId: string): Promise<SDKResponse> {
    return this.client.get(`/api/v1/products/${productId}`);
  }

  async createProduct(data: {
    name: string;
    description?: string;
    price: number;
    category_id?: string;
    images?: string[];
    inventory?: number;
  }): Promise<SDKResponse> {
    return this.client.post('/api/v1/products', data);
  }

  async updateProduct(productId: string, data: Partial<{
    name: string;
    description: string;
    price: number;
    images: string[];
    inventory: number;
    status: 'active' | 'draft' | 'archived';
  }>): Promise<SDKResponse> {
    return this.client.patch(`/api/v1/products/${productId}`, data);
  }

  async deleteProduct(productId: string): Promise<SDKResponse> {
    return this.client.delete(`/api/v1/products/${productId}`);
  }

  async getCategories(): Promise<SDKResponse> {
    return this.client.get('/api/v1/categories');
  }

  async getCategory(categoryId: string): Promise<SDKResponse> {
    return this.client.get(`/api/v1/categories/${categoryId}`);
  }

  async search(query: string, params?: { limit?: number }): Promise<SDKResponse> {
    return this.client.get('/api/v1/products/search', { params: { q: query, ...params } });
  }
}

// ============================================
// Search Service
// ============================================

export class SearchService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async query(params: {
    q: string;
    type?: 'product' | 'store' | 'all';
    location?: { lat: number; lng: number; radius?: number };
    category?: string;
    min_price?: number;
    max_price?: number;
    sort?: string;
    limit?: number;
  }): Promise<SDKResponse> {
    return this.client.post('/api/v1/search/query', params);
  }

  async autocomplete(query: string, limit = 10): Promise<SDKResponse> {
    return this.client.post('/api/v1/search/autocomplete', { q: query, limit });
  }

  async getRecommendations(userId: string, limit = 10): Promise<SDKResponse> {
    return this.client.get(`/api/v1/recommendations/${userId}`, { params: { limit } });
  }

  async getTrending(limit = 10): Promise<SDKResponse> {
    return this.client.get('/api/v1/search/trending', { params: { limit } });
  }
}

// ============================================
// Notification Service
// ============================================

export class NotificationService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async send(data: {
    user_id: string;
    channel: 'push' | 'sms' | 'email' | 'whatsapp';
    title: string;
    body: string;
    data?: Record<string, unknown>;
    template_id?: string;
  }): Promise<SDKResponse> {
    return this.client.post('/api/v1/notifications/send', data);
  }

  async sendTemplate(data: {
    user_id: string;
    template_id: string;
    variables: Record<string, string>;
  }): Promise<SDKResponse> {
    return this.client.post('/api/v1/notifications/template', data);
  }

  async getByUser(userId: string, params?: { limit?: number; unread_only?: boolean }): Promise<SDKResponse> {
    return this.client.get(`/api/v1/notifications/user/${userId}`, { params });
  }

  async markAsRead(notificationId: string): Promise<SDKResponse> {
    return this.client.patch(`/api/v1/notifications/${notificationId}/read`);
  }

  async markAllAsRead(userId: string): Promise<SDKResponse> {
    return this.client.post(`/api/v1/notifications/user/${userId}/read-all`);
  }

  async sendBulk(data: {
    user_ids: string[];
    channel: 'push' | 'sms' | 'email' | 'whatsapp';
    title: string;
    body: string;
  }): Promise<SDKResponse> {
    return this.client.post('/api/v1/notifications/send-bulk', data);
  }
}

// ============================================
// Profile Service
// ============================================

export class ProfileService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async get(userId: string): Promise<SDKResponse> {
    return this.client.get(`/api/v1/profiles/${userId}`);
  }

  async update(userId: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
  }): Promise<SDKResponse> {
    return this.client.patch(`/api/v1/profiles/${userId}`, data);
  }

  async addAddress(userId: string, address: {
    type: 'home' | 'work' | 'other';
    name: string;
    phone?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    is_default?: boolean;
  }): Promise<SDKResponse> {
    return this.client.post(`/api/v1/profiles/${userId}/addresses`, address);
  }

  async getAddresses(userId: string): Promise<SDKResponse> {
    return this.client.get(`/api/v1/profiles/${userId}/addresses`);
  }

  async updateAddress(userId: string, addressId: string, data: Partial<{
    type: 'home' | 'work' | 'other';
    name: string;
    phone: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
    landmark: string;
    is_default: boolean;
  }>): Promise<SDKResponse> {
    return this.client.patch(`/api/v1/profiles/${userId}/addresses/${addressId}`, data);
  }

  async deleteAddress(userId: string, addressId: string): Promise<SDKResponse> {
    return this.client.delete(`/api/v1/profiles/${userId}/addresses/${addressId}`);
  }
}

// ============================================
// QR Cloud Service
// ============================================

export class QRService {
  private client: AxiosInstance;
  private qrCloudURL: string;

  constructor(client: AxiosInstance, qrCloudURL: string) {
    this.client = client;
    this.qrCloudURL = qrCloudURL;
  }

  // Merchant
  async createMerchant(data: {
    name: string;
    slug: string;
    type: 'restaurant' | 'hotel' | 'retail' | 'salon' | 'other';
    phone: string;
    email?: string;
    address?: string;
  }): Promise<SDKResponse> {
    return this.client.post(`${this.qrCloudURL}/api/merchants`, data);
  }

  async getMerchant(idOrSlug: string): Promise<SDKResponse> {
    return this.client.get(`${this.qrCloudURL}/api/merchants/${idOrSlug}`);
  }

  async updateMerchant(id: string, data: Partial<{
    name: string;
    logo: string;
    description: string;
    phone: string;
    email: string;
    address: string;
  }>): Promise<SDKResponse> {
    return this.client.patch(`${this.qrCloudURL}/api/merchants/${id}`, data);
  }

  // QR Codes
  async createQR(data: {
    merchant_id: string;
    type: 'menu' | 'payment' | 'info' | 'verify' | 'creator' | 'ads' | 'table';
    name: string;
    target_id?: string;
    metadata?: Record<string, unknown>;
  }): Promise<SDKResponse> {
    return this.client.post(`${this.qrCloudURL}/api/qr`, data);
  }

  async getQR(idOrCode: string): Promise<SDKResponse> {
    return this.client.get(`${this.qrCloudURL}/api/qr/${idOrCode}`);
  }

  async listQRCodes(merchantId: string): Promise<SDKResponse> {
    return this.client.get(`${this.qrCloudURL}/api/merchants/${merchantId}/qr`);
  }

  async deleteQR(id: string): Promise<SDKResponse> {
    return this.client.delete(`${this.qrCloudURL}/api/qr/${id}`);
  }

  async toggleQR(id: string, isActive: boolean): Promise<SDKResponse> {
    return this.client.patch(`${this.qrCloudURL}/api/qr/${id}/toggle`, { isActive });
  }

  // Menu
  async getMenu(merchantId: string): Promise<SDKResponse> {
    return this.client.get(`${this.qrCloudURL}/api/merchants/${merchantId}/menu`);
  }

  async createCategory(merchantId: string, data: { name: string; description?: string }): Promise<SDKResponse> {
    return this.client.post(`${this.qrCloudURL}/api/merchants/${merchantId}/categories`, data);
  }

  async createMenuItem(merchantId: string, data: {
    name: string;
    description?: string;
    price: number;
    category_id?: string;
    image?: string;
    available?: boolean;
  }): Promise<SDKResponse> {
    return this.client.post(`${this.qrCloudURL}/api/merchants/${merchantId}/items`, data);
  }

  async updateMenuItem(id: string, data: Partial<{
    name: string;
    description: string;
    price: number;
    image: string;
    available: boolean;
  }>): Promise<SDKResponse> {
    return this.client.patch(`${this.qrCloudURL}/api/items/${id}`, data);
  }

  // Orders
  async createOrder(data: {
    merchant_id: string;
    customer_phone: string;
    customer_name?: string;
    type: 'dine_in' | 'takeaway' | 'delivery';
    table_number?: string;
    qr_id?: string;
    items: Array<{
      item_id: string;
      name: string;
      quantity: number;
      price: number;
      options?: unknown[];
      addons?: unknown[];
      notes?: string;
    }>;
  }): Promise<SDKResponse> {
    return this.client.post(`${this.qrCloudURL}/api/orders`, data);
  }

  async getOrder(id: string): Promise<SDKResponse> {
    return this.client.get(`${this.qrCloudURL}/api/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string): Promise<SDKResponse> {
    return this.client.patch(`${this.qrCloudURL}/api/orders/${id}/status`, { status });
  }

  async listOrders(merchantId: string, params?: { status?: string; limit?: number }): Promise<SDKResponse> {
    return this.client.get(`${this.qrCloudURL}/api/merchants/${merchantId}/orders`, { params });
  }

  // Analytics
  async getAnalytics(merchantId: string): Promise<SDKResponse> {
    return this.client.get(`${this.qrCloudURL}/api/merchants/${merchantId}/analytics`);
  }

  async getQRAnalytics(qrId: string): Promise<SDKResponse> {
    return this.client.get(`${this.qrCloudURL}/api/qr/${qrId}/analytics`);
  }

  // Scan
  async trackScan(qrId: string, customerId?: string, deviceId?: string): Promise<SDKResponse> {
    return this.client.post(`${this.qrCloudURL}/api/scan/${qrId}`, { customer_id: customerId, device_id: deviceId });
  }

  async resolveQR(code: string): Promise<SDKResponse> {
    return this.client.get(`${this.qrCloudURL}/api/resolve/${code}`);
  }
}

// ============================================
// Booking Service
// ============================================

export class BookingService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async createBooking(data: {
    user_id: string;
    type: 'hotel' | 'restaurant' | 'salon' | 'event';
    resource_id: string;
    date: string;
    time?: string;
    guests?: number;
    details?: Record<string, unknown>;
  }): Promise<SDKResponse> {
    return this.client.post('/api/v1/bookings', data);
  }

  async getBooking(bookingId: string): Promise<SDKResponse> {
    return this.client.get(`/api/v1/bookings/${bookingId}`);
  }

  async updateBooking(bookingId: string, data: Partial<{
    date: string;
    time: string;
    guests: number;
    details: Record<string, unknown>;
  }>): Promise<SDKResponse> {
    return this.client.patch(`/api/v1/bookings/${bookingId}`, data);
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<SDKResponse> {
    return this.client.post(`/api/v1/bookings/${bookingId}/cancel`, { reason });
  }

  async getUserBookings(userId: string, params?: { type?: string; status?: string }): Promise<SDKResponse> {
    return this.client.get(`/api/v1/bookings/user/${userId}`, { params });
  }

  async getAvailability(resourceId: string, date: string, params?: { time?: string }): Promise<SDKResponse> {
    return this.client.get(`/api/v1/bookings/availability/${resourceId}`, { params: { date, ...params } });
  }
}

// ============================================
// Loyalty Service
// ============================================

export class LoyaltyService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async getPoints(userId: string): Promise<SDKResponse> {
    return this.client.get(`/api/v1/loyalty/points/${userId}`);
  }

  async getTier(userId: string): Promise<SDKResponse> {
    return this.client.get(`/api/v1/loyalty/tier/${userId}`);
  }

  async getHistory(userId: string, params?: { limit?: number }): Promise<SDKResponse> {
    return this.client.get(`/api/v1/loyalty/history/${userId}`, { params });
  }

  async redeem(data: {
    user_id: string;
    reward_id: string;
    points: number;
  }): Promise<SDKResponse> {
    return this.client.post('/api/v1/loyalty/redeem', data);
  }

  async getRewards(params?: { category?: string; limit?: number }): Promise<SDKResponse> {
    return this.client.get('/api/v1/loyalty/rewards', { params });
  }

  async getReward(rewardId: string): Promise<SDKResponse> {
    return this.client.get(`/api/v1/loyalty/rewards/${rewardId}`);
  }
}

// ============================================
// Main REZ Client
// ============================================

export class REZ {
  public auth: AuthService;
  public payments: PaymentService;
  public wallet: WalletService;
  public orders: OrderService;
  public catalog: CatalogService;
  public search: SearchService;
  public notifications: NotificationService;
  public profiles: ProfileService;
  public qr: QRService;
  public bookings: BookingService;
  public loyalty: LoyaltyService;

  private client: AxiosInstance;
  private config: REZConfig;

  constructor(config: REZConfig) {
    this.config = config;
    const baseURL = ENVIRONMENTS[config.environment || 'production'];
    const qrCloudURL = process.env.QR_CLOUD_URL || 'https://rez-qr-cloud.onrender.com';

    this.client = axios.create({
      baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling and retries
    this.client.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        if (
          error.response?.status === 429 &&
          originalRequest &&
          (this.config.retries || 0) > 0
        ) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.client(originalRequest);
        }
        throw error;
      }
    );

    // Initialize all services
    this.auth = new AuthService(this.client);
    this.payments = new PaymentService(this.client);
    this.wallet = new WalletService(this.client);
    this.orders = new OrderService(this.client);
    this.catalog = new CatalogService(this.client);
    this.search = new SearchService(this.client);
    this.notifications = new NotificationService(this.client);
    this.profiles = new ProfileService(this.client);
    this.qr = new QRService(this.client, qrCloudURL);
    this.bookings = new BookingService(this.client);
    this.loyalty = new LoyaltyService(this.client);
  }

  getBaseURL(): string {
    return ENVIRONMENTS[this.config.environment || 'production'];
  }
}



// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sdk',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});

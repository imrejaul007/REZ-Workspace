/**
 * REZ Ecosystem Integrator
 * Connects services to RABTUL, HOJAI, and REZ-Intelligence
 *
 * Usage in any service:
 * ```typescript
 * import { createEcosystemClient } from './ecosystem-integrator';
 *
 * const eco = createEcosystemClient({
 *   serviceName: 'rez-spa-service',
 *   internalToken: process.env.INTERNAL_SERVICE_TOKEN!
 * });
 *
 * // Send notification
 * await eco.notify.sendPush(userId, 'Booking Confirmed', { bookingId });
 *
 * // Get customer insights
 * const insights = await eco.intelligence.getCustomerInsights(customerId);
 *
 * // Process payment
 * await eco.payments.createOrder(amount, 'INR', metadata);
 * ```
 */

import axios, { AxiosInstance } from 'axios';

// ============================================
// TYPES
// ============================================

export interface EcosystemConfig {
  serviceName: string;
  internalToken: string;
  // Override URLs if needed
  authUrl?: string;
  walletUrl?: string;
  paymentUrl?: string;
  notificationUrl?: string;
  intelligenceUrl?: string;
  hojaiUrl?: string;
}

export interface HealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}

export interface CustomerInsights {
  churnRisk: number;
  lifetimeValue: number;
  engagement: 'low' | 'medium' | 'high';
  lastActive: string;
  preferences: Record<string, any>;
}

// ============================================
// HTTP CLIENT
// ============================================

class ServiceClient {
  private client: AxiosInstance;
  public name: string;

  constructor(baseUrl: string, token: string, serviceName: string) {
    this.name = serviceName;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': token,
        'X-Service-Name': serviceName,
      },
    });

    // Add logging interceptor
    this.client.interceptors.request.use((config) => {
      console.log(`[${serviceName}] → ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error(`[${serviceName}] ← Error:`, error.message);
        return Promise.reject(error);
      }
    );
  }

  async get<T>(path: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(path, { params });
    return response.data;
  }

  async post<T>(path: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(path, data);
    return response.data;
  }

  async patch<T>(path: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(path, data);
    return response.data;
  }

  async delete<T>(path: string): Promise<T> {
    const response = await this.client.delete<T>(path);
    return response.data;
  }
}

// ============================================
// NOTIFICATION CLIENT
// ============================================

class NotificationClient {
  private http: ServiceClient;

  constructor(http: ServiceClient) {
    this.http = http;
  }

  async sendPush(userId: string, title: string, body: string, data?: Record<string, any>) {
    return this.http.post('/api/push/send', {
      userId,
      title,
      body,
      data,
    });
  }

  async sendSMS(phone: string, message: string) {
    return this.http.post('/api/sms/send', { phone, message });
  }

  async sendEmail(to: string, subject: string, body: string) {
    return this.http.post('/api/email/send', { to, subject, body });
  }

  async sendWhatsApp(phone: string, template: string, variables?: Record<string, string>) {
    return this.http.post('/api/whatsapp/send', { phone, template, variables });
  }
}

// ============================================
// AUTH CLIENT
// ============================================

class AuthClient {
  private http: ServiceClient;

  constructor(http: ServiceClient) {
    this.http = http;
  }

  async sendOTP(phone: string) {
    return this.http.post('/api/v1/auth/send-otp', { phone });
  }

  async verifyOTP(phone: string, otp: string) {
    return this.http.post('/api/v1/auth/verify-otp', { phone, otp });
  }

  async validateToken(token: string) {
    return this.http.post('/api/auth/validate', { token });
  }

  async getUserById(userId: string) {
    return this.http.get(`/api/users/${userId}`);
  }
}

// ============================================
// WALLET CLIENT
// ============================================

class WalletClient {
  private http: ServiceClient;

  constructor(http: ServiceClient) {
    this.http = http;
  }

  async getBalance(userId: string) {
    return this.http.get(`/api/wallets/${userId}/balance`);
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    return this.http.get(`/api/wallets/${userId}/transactions`, { page, limit });
  }

  async credit(userId: string, amount: number, description: string) {
    return this.http.post('/api/wallets/credit', { userId, amount, description });
  }

  async debit(userId: string, amount: number, description: string) {
    return this.http.post('/api/wallets/debit', { userId, amount, description });
  }

  async transfer(fromUserId: string, toUserId: string, amount: number) {
    return this.http.post('/api/wallets/transfer', { fromUserId, toUserId, amount });
  }
}

// ============================================
// PAYMENT CLIENT
// ============================================

class PaymentClient {
  private http: ServiceClient;

  constructor(http: ServiceClient) {
    this.http = http;
  }

  async createOrder(amount: number, currency = 'INR', metadata?: Record<string, any>) {
    return this.http.post('/api/v1/orders', { amount, currency, metadata });
  }

  async verifyPayment(orderId: string) {
    return this.http.get(`/api/v1/orders/${orderId}/verify`);
  }

  async refund(paymentId: string, amount?: number) {
    return this.http.post('/api/v1/refunds', { paymentId, amount });
  }

  async getPaymentMethods(userId: string) {
    return this.http.get(`/api/v1/users/${userId}/payment-methods`);
  }

  async addPaymentMethod(userId: string, method: 'upi' | 'card' | 'wallet', details: any) {
    return this.http.post(`/api/v1/users/${userId}/payment-methods`, { method, details });
  }
}

// ============================================
// INTELLIGENCE CLIENT
// ============================================

class IntelligenceClient {
  private http: ServiceClient;

  constructor(http: ServiceClient) {
    this.http = http;
  }

  async getCustomerInsights(customerId: string): Promise<CustomerInsights> {
    return this.http.get(`/api/v1/internal/customers/${customerId}/insights`);
  }

  async getIntent(customerId: string) {
    return this.http.get(`/api/v1/internal/customers/${customerId}/intent`);
  }

  async recordEvent(customerId: string, event: string, properties?: Record<string, any>) {
    return this.http.post('/api/v1/internal/events', {
      customerId,
      event,
      properties,
      timestamp: new Date().toISOString(),
    });
  }

  async getRecommendations(customerId: string, context: string) {
    return this.http.get('/api/v1/internal/recommendations', {
      customerId,
      context,
    });
  }

  async getChurnRisk(customerId: string) {
    return this.http.get(`/api/v1/internal/customers/${customerId}/churn-risk`);
  }

  async getLTV(customerId: string) {
    return this.http.get(`/api/v1/internal/customers/${customerId}/ltv`);
  }
}

// ============================================
// HOJAI CLIENT
// ============================================

class HojaiClient {
  private http: ServiceClient;

  constructor(http: ServiceClient) {
    this.http = http;
  }

  async sendCommand(command: string, context?: Record<string, any>) {
    return this.http.post('/api/brain/command', { command, context });
  }

  async getEntity(entityId: string) {
    return this.http.get(`/api/entities/${entityId}`);
  }

  async searchEntities(query: string) {
    return this.http.get('/api/entities', { query });
  }

  async getDashboard() {
    return this.http.get('/api/dashboard/overview');
  }

  async logMetric(metric: string, value: number, tags?: Record<string, string>) {
    return this.http.post('/api/metrics', { metric, value, tags });
  }
}

// ============================================
// ECOSYSTEM CLIENT
// ============================================

export interface EcosystemClient {
  auth: AuthClient;
  wallet: WalletClient;
  payments: PaymentClient;
  notify: NotificationClient;
  intelligence: IntelligenceClient;
  hojai: HojaiClient;
  health: () => Promise<HealthStatus[]>;
}

export function createEcosystemClient(config: EcosystemConfig): EcosystemClient {
  const {
    serviceName,
    internalToken,
    authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
    walletUrl = process.env.WALLET_SERVICE_URL || 'http://localhost:4003',
    paymentUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4001',
    notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011',
    intelligenceUrl = process.env.INTELLIGENCE_URL || 'http://localhost:4100',
    hojaiUrl = process.env.HOJAI_URL || 'http://localhost:4600',
  } = config;

  // Create HTTP clients for each service
  const authHttp = new ServiceClient(authUrl, internalToken, `${serviceName}-auth`);
  const walletHttp = new ServiceClient(walletUrl, internalToken, `${serviceName}-wallet`);
  const paymentHttp = new ServiceClient(paymentUrl, internalToken, `${serviceName}-payment`);
  const notificationHttp = new ServiceClient(notificationUrl, internalToken, `${serviceName}-notify`);
  const intelligenceHttp = new ServiceClient(intelligenceUrl, internalToken, `${serviceName}-intel`);
  const hojaiHttp = new ServiceClient(hojaiUrl, internalToken, `${serviceName}-hojai`);

  // Create service clients
  const auth = new AuthClient(authHttp);
  const wallet = new WalletClient(walletHttp);
  const payments = new PaymentClient(paymentHttp);
  const notify = new NotificationClient(notificationHttp);
  const intelligence = new IntelligenceClient(intelligenceHttp);
  const hojai = new HojaiClient(hojaiHttp);

  // Health check function
  const health = async (): Promise<HealthStatus[]> => {
    const services = [
      { name: 'auth', http: authHttp },
      { name: 'wallet', http: walletHttp },
      { name: 'payments', http: paymentHttp },
      { name: 'notifications', http: notificationHttp },
      { name: 'intelligence', http: intelligenceHttp },
      { name: 'hojai', http: hojaiHttp },
    ];

    const results: HealthStatus[] = await Promise.all(
      services.map(async ({ name, http }) => {
        const start = Date.now();
        try {
          await http.get('/health');
          return {
            service: name,
            status: 'healthy' as const,
            latency: Date.now() - start,
          };
        } catch (error: any) {
          return {
            service: name,
            status: 'unhealthy' as const,
            error: error.message,
          };
        }
      })
    );

    return results;
  };

  return {
    auth,
    wallet,
    payments,
    notify,
    intelligence,
    hojai,
    health,
  };
}

export default { createEcosystemClient };

/**
 * REZ Merchant Hub Client
 * Merchant Platform - POS, KDS, QR Cloud, Loyalty
 * Port: 4100
 */

import axios, { AxiosInstance } from 'axios';

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-token';
const UNIFIED_HUB = process.env.UNIFIED_HUB_URL || 'http://localhost:4600';

const SERVICES = {
  AUTH: process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com',
  WALLET: process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service.onrender.com',
  ORDER: process.env.ORDER_SERVICE_URL || 'https://rez-order-service.onrender.com',
  CATALOG: process.env.CATALOG_SERVICE_URL || 'https://rez-catalog-service.onrender.com',
  PAYMENT: process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com',
  HOJAI_MEMORY: process.env.HOJAI_MEMORY || 'http://localhost:4520',
  HOJAI_INTELLIGENCE: process.env.HOJAI_INTELLIGENCE || 'http://localhost:4530',
  HOJAI_AGENTS: process.env.HOJAI_AGENTS || 'http://localhost:4550',
  MERCHANT_AI: process.env.MERCHANT_AI || 'http://localhost:4751',
  SUTAR_TWIN_OS: process.env.SUTAR_TWIN_OS || 'http://localhost:4142',
  POS: process.env.POS_URL || 'http://localhost:4101',
  KDS: process.env.KDS_URL || 'http://localhost:4102',
  QR_CLOUD: process.env.QR_CLOUD_URL || 'http://localhost:4103',
};

class REZMerchantHubClient {
  private clients: Map<string, AxiosInstance> = new Map();
  private hubClient: AxiosInstance;

  constructor() {
    this.hubClient = axios.create({
      baseURL: UNIFIED_HUB,
      headers: { 'X-Internal-Token': INTERNAL_KEY, 'X-Service-Name': 'REZ-Merchant' },
    });

    Object.keys(SERVICES).forEach((service) => {
      this.clients.set(service, axios.create({
        baseURL: SERVICES[service as keyof typeof SERVICES],
        headers: { 'X-Internal-Token': INTERNAL_KEY, 'X-Service-Name': 'REZ-Merchant' },
      }));
    });
  }

  async callViaHub(service: string, endpoint: string, method = 'POST', data?: unknown) {
    try {
      return (await this.hubClient.request({ method, url: `/api/${service}${endpoint}`, data })).data;
    } catch (error) {
      console.error(`[REZ-Merchant] ${service}${endpoint} failed:`, error);
      return null;
    }
  }

  async callDirect(service: string, endpoint: string, method = 'POST', data?: unknown) {
    const client = this.clients.get(service);
    if (!client) return null;
    try {
      return (await client.request({ method, url: endpoint, data })).data;
    } catch (error) {
      console.error(`[REZ-Merchant] Direct ${service}${endpoint} failed:`, error);
      return null;
    }
  }

  // RABTUL
  async authenticateMerchant(phone: string, businessName: string) {
    return this.callViaHub('auth', '/merchant/create', 'POST', { phone, business_name: businessName });
  }

  async getWalletBalance(merchantId: string) {
    return this.callViaHub('wallet', '/balance', 'POST', { user_id: merchantId });
  }

  async createOrder(orderData: unknown) {
    return this.callViaHub('order', '/create', 'POST', orderData);
  }

  async processPayment(merchantId: string, amount: number, method: string) {
    return this.callViaHub('payment', '/settle', 'POST', { merchant_id: merchantId, amount, method });
  }

  // HOJAI AI
  async getMerchantTwin(merchantId: string) {
    return this.callDirect('SUTAR_TWIN_OS', '/api/v1/twins/retrieve', 'POST', { entity_id: merchantId, type: 'merchant' });
  }

  async createMerchantTwin(merchantId: string, data: unknown) {
    return this.callDirect('SUTAR_TWIN_OS', '/api/v1/twins', 'POST', { entity_id: merchantId, type: 'merchant', data });
  }

  async getSalesInsights(merchantId: string) {
    return this.callDirect('MERCHANT_AI', '/api/v1/insights/sales', 'POST', { merchant_id: merchantId });
  }

  async getInventoryRecommendations(merchantId: string) {
    return this.callDirect('MERCHANT_AI', '/api/v1/inventory/recommend', 'POST', { merchant_id: merchantId });
  }

  async chatWithAssistant(merchantId: string, message: string) {
    return this.callDirect('HOJAI_AGENTS', '/api/v1/agents/merchant/query', 'POST', { merchant_id: merchantId, message, context: 'merchant' });
  }

  async storeMerchantMemory(merchantId: string, memory: string) {
    return this.callDirect('HOJAI_MEMORY', '/api/v1/memory/store', 'POST', { user_id: merchantId, type: 'merchant_experience', data: memory });
  }

  // Services
  async createPOSOrder(posData: unknown) {
    return this.callDirect('POS', '/api/v1/orders', 'POST', posData);
  }

  async getKitchenDisplay(kitchenId: string) {
    return this.callDirect('KDS', `/api/v1/display/${kitchenId}`, 'GET');
  }

  async updateKDSOrder(orderId: string, updates: unknown) {
    return this.callDirect('KDS', `/api/v1/orders/${orderId}`, 'PATCH', updates);
  }

  async getQRMenu(restaurantId: string) {
    return this.callDirect('QR_CLOUD', `/api/v1/menus/restaurant/${restaurantId}`, 'GET');
  }

  async createQRMenu(menuData: unknown) {
    return this.callDirect('QR_CLOUD', '/api/v1/menus', 'POST', menuData);
  }

  // Loyalty
  async awardPoints(merchantId: string, customerId: string, points: number) {
    return this.callViaHub('karma', '/award', 'POST', { user_id: customerId, points, action: 'purchase', source: 'REZ-Merchant' });
  }

  async trackEvent(merchantId: string, event: string, data?: unknown) {
    return this.callViaHub('signal', '/collect', 'POST', { service: 'REZ-Merchant', event, user_id: merchantId, data });
  }

  async getRecommendations(merchantId: string) {
    return this.callDirect('HOJAI_INTELLIGENCE', '/api/v1/recommend/merchant', 'POST', { merchant_id: merchantId });
  }
}

export const rezMerchantHub = new REZMerchantHubClient();
export default rezMerchantHub;
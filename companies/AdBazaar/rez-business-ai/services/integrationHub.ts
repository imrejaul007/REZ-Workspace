/**
 * REZ Business AI - Integration Hub
 * Connects to: REZ-Merchant, REZ-Intelligence, REZ-Media, RABTUL, REZ-Consumer
 */

const SERVICES = {
  MERCHANT_SERVICE: process.env.MERCHANT_SERVICE_URL || 'http://localhost:3001',
  MERCHANT_INTELLIGENCE: process.env.MERCHANT_INTELLIGENCE_URL || 'http://localhost:4041',
  AD_AI: process.env.AD_AI_URL || 'http://localhost:4021',
  ENGAGEMENT_PLATFORM: process.env.ENGAGEMENT_URL || 'http://localhost:4017',
  NOTIFICATION_SERVICE: process.env.NOTIFICATION_SERVICE_URL || 'https://rez-notifications-service.onrender.com',
  WALLET_SERVICE: process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service.onrender.com',
};

export class IntegrationHub {
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
    };
  }

  // REZ-Merchant
  async getMerchantData(merchantId: string) {
    try {
      const res = await fetch(`${SERVICES.MERCHANT_SERVICE}/api/v1/merchant/${merchantId}`, { headers: this.getHeaders() });
      return { success: true, data: await res.json() };
    } catch (e) { return { success: false, error: (e as Error).message }; }
  }

  async getMerchantProducts(merchantId: string) {
    try {
      const res = await fetch(`${SERVICES.MERCHANT_SERVICE}/api/v1/products?merchantId=${merchantId}`, { headers: this.getHeaders() });
      return { success: true, data: await res.json() };
    } catch (e) { return { success: false, error: (e as Error).message }; }
  }

  async getMerchantOrders(merchantId: string, period: { start: Date; end: Date }) {
    try {
      const res = await fetch(`${SERVICES.MERCHANT_SERVICE}/api/v1/orders?merchantId=${merchantId}`, { headers: this.getHeaders() });
      return { success: true, data: await res.json() };
    } catch (e) { return { success: false, error: (e as Error).message }; }
  }

  async getMerchantCustomers(merchantId: string) {
    try {
      const res = await fetch(`${SERVICES.MERCHANT_SERVICE}/api/v1/customers?merchantId=${merchantId}`, { headers: this.getHeaders() });
      return { success: true, data: await res.json() };
    } catch (e) { return { success: false, error: (e as Error).message }; }
  }

  // REZ-Intelligence
  async getDemandSignals(merchantId: string) {
    try {
      const res = await fetch(`${SERVICES.MERCHANT_INTELLIGENCE}/api/v1/demand-signals?merchantId=${merchantId}`, { headers: this.getHeaders() });
      return { success: true, data: await res.json() };
    } catch (e) { return { success: false, error: (e as Error).message }; }
  }

  async getCompetitorIntel(merchantId: string) {
    try {
      const res = await fetch(`${SERVICES.MERCHANT_INTELLIGENCE}/api/v1/competitors?merchantId=${merchantId}`, { headers: this.getHeaders() });
      return { success: true, data: await res.json() };
    } catch (e) { return { success: false, error: (e as Error).message }; }
  }

  async getBenchmarks(merchantId: string) {
    try {
      const res = await fetch(`${SERVICES.MERCHANT_INTELLIGENCE}/api/v1/benchmarks?merchantId=${merchantId}`, { headers: this.getHeaders() });
      return { success: true, data: await res.json() };
    } catch (e) { return { success: false, error: (e as Error).message }; }
  }

  async getEventsIntel(merchantId: string) {
    try {
      const res = await fetch(`${SERVICES.MERCHANT_INTELLIGENCE}/api/v1/events?merchantId=${merchantId}`, { headers: this.getHeaders() });
      return { success: true, data: await res.json() };
    } catch (e) { return { success: false, error: (e as Error).message }; }
  }

  async getWeatherImpact(merchantId: string) {
    try {
      const res = await fetch(`${SERVICES.MERCHANT_INTELLIGENCE}/api/v1/weather?merchantId=${merchantId}`, { headers: this.getHeaders() });
      return { success: true, data: await res.json() };
    } catch (e) { return { success: false, error: (e as Error).message }; }
  }

  // REZ-Media
  async createCampaign(campaign) {
    try {
      const res = await fetch(`${SERVICES.ENGAGEMENT_PLATFORM}/api/v1/campaigns`, {
        method: 'POST', headers: this.getHeaders(), body: JSON.stringify(campaign),
      });
      return { success: true, data: await res.json() };
    } catch (e) { return { success: false, error: (e as Error).message }; }
  }

  async createAd(adData) {
    try {
      const res = await fetch(`${SERVICES.AD_AI}/api/v1/ads`, {
        method: 'POST', headers: this.getHeaders(), body: JSON.stringify(adData),
      });
      return { success: true, data: await res.json() };
    } catch (e) { return { success: false, error: (e as Error).message }; }
  }

  // RABTUL Services
  async sendNotification(notification) {
    try {
      const res = await fetch(`${SERVICES.NOTIFICATION_SERVICE}/api/notifications/send`, {
        method: 'POST', headers: this.getHeaders(), body: JSON.stringify(notification),
      });
      return { success: true, data: await res.json() };
    } catch (e) { return { success: false, error: (e as Error).message }; }
  }

  async sendBulkNotifications(notifications) {
    try {
      const res = await fetch(`${SERVICES.NOTIFICATION_SERVICE}/api/notifications/bulk`, {
        method: 'POST', headers: this.getHeaders(), body: JSON.stringify(notifications),
      });
      return { success: true, data: await res.json() };
    } catch (e) { return { success: false, error: (e as Error).message }; }
  }

  async addLoyaltyPoints(customerId: string, points: number, reason: string) {
    try {
      const res = await fetch(`${SERVICES.ENGAGEMENT_PLATFORM}/api/v1/loyalty/points/add`, {
        method: 'POST', headers: this.getHeaders(), body: JSON.stringify({ customerId, points, reason }),
      });
      return { success: true, data: await res.json() };
    } catch (e) { return { success: false, error: (e as Error).message }; }
  }

  async createCashbackOffer(offer) {
    try {
      const res = await fetch(`${SERVICES.ENGAGEMENT_PLATFORM}/api/v1/cashback/create`, {
        method: 'POST', headers: this.getHeaders(), body: JSON.stringify(offer),
      });
      return { success: true, data: await res.json() };
    } catch (e) { return { success: false, error: (e as Error).message }; }
  }

  async pushOffer(offer) {
    try {
      const res = await fetch(`${SERVICES.ENGAGEMENT_PLATFORM}/api/v1/offers/push`, {
        method: 'POST', headers: this.getHeaders(), body: JSON.stringify(offer),
      });
      return { success: true, data: await res.json() };
    } catch (e) { return { success: false, error: (e as Error).message }; }
  }
}

export const integrationHub = new IntegrationHub();

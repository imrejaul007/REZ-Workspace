/**
 * REZ Ecosystem Integrations for NexTaBizz (Merchant OS)
 *
 * Connects NexTaBizz to:
 * - RABTUL Platform (Payment, Analytics, Notifications)
 * - REZ Intelligence (Expert Services, Demand Forecast, Merchant Intelligence)
 * - REZ Media (Ad Targeting)
 */

import axios from 'axios';

// Configuration
const PAYMENT_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4001';
const ANALYTICS_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:4016';
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';
const INTELLIGENCE_URL = process.env.REZ_INTELLIGENCE_URL || 'http://localhost:4018';

// Expert Services
const EXPERT_SERVICES = {
  restaurant: process.env.CULINARY_EXPERT_URL || 'http://localhost:3005',
  salon: process.env.SALON_EXPERT_URL || 'http://localhost:3003',
  retail: process.env.RETAIL_EXPERT_URL || 'http://localhost:3004',
  fitness: process.env.FITNESS_EXPERT_URL || 'http://localhost:3010',
  health: process.env.HEALTH_EXPERT_URL || 'http://localhost:3011',
  travel: process.env.TRAVEL_EXPERT_URL || 'http://localhost:3001',
  education: process.env.EDUCATION_EXPERT_URL || 'http://localhost:3006',
};

// Types
interface Merchant {
  merchantId: string;
  name: string;
  industry: string;
  location: { lat: number; lng: number };
}

interface SalesMetrics {
  totalSales: number;
  orders: number;
  avgOrderValue: number;
  growth: number;
}

interface ExpertRecommendation {
  type: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
  reason: string;
}

class NexTaBizzIntegrations {
  /**
   * Get demand forecast from REZ Intelligence
   */
  async getDemandForecast(merchantId: string, days = 7): Promise<{
    forecast: { date: string; predicted: number; confidence: number }[];
    insights: string[];
  }> {
    try {
      const response = await axios.post(
        `${INTELLIGENCE_URL}/api/predict/demand`,
        {
          storeId: merchantId,
          period: { days },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Demand forecast failed:', error);
      return { forecast: [], insights: [] };
    }
  }

  /**
   * Get industry expert recommendations
   */
  async getExpertRecommendations(merchant: Merchant): Promise<ExpertRecommendation[]> {
    const expertUrl = EXPERT_SERVICES[merchant.industry as keyof typeof EXPERT_SERVICES];

    if (!expertUrl) {
      return [];
    }

    try {
      const response = await axios.post(
        `${expertUrl}/api/expert/recommendations`,
        {
          merchantId: merchant.merchantId,
          industry: merchant.industry,
          location: merchant.location,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '',
          },
        }
      );
      return response.data.recommendations || [];
    } catch (error) {
      console.error('Expert recommendations failed:', error);
      return [];
    }
  }

  /**
   * Get merchant intelligence insights
   */
  async getMerchantIntelligence(merchantId: string): Promise<{
    performanceScore: number;
    competitors: { merchantId: string; name: string; score: number }[];
    opportunities: string[];
    threats: string[];
  }> {
    try {
      const response = await axios.post(
        `${INTELLIGENCE_URL}/api/merchant/intelligence`,
        { merchantId },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Merchant intelligence failed:', error);
      return {
        performanceScore: 0,
        competitors: [],
        opportunities: [],
        threats: [],
      };
    }
  }

  /**
   * Process merchant payment with analytics
   */
  async processPayment(
    merchantId: string,
    orderId: string,
    amount: number
  ): Promise<{ transactionId: string; status: string }> {
    const headers = {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
    };

    // Process payment via RABTUL
    const payment = await axios.post(
      `${PAYMENT_URL}/api/payment/create-order`,
      {
        amount,
        userId: merchantId,
        metadata: { orderId, type: 'merchant_sale' },
      },
      { headers }
    );

    // Track analytics
    await axios.post(
      `${ANALYTICS_URL}/api/events`,
      {
        event: 'merchant_payment_received',
        userId: merchantId,
        properties: {
          orderId,
          amount,
          timestamp: new Date().toISOString(),
        },
      },
      { headers }
    );

    return payment.data;
  }

  /**
   * Send notification to merchant
   */
  async notifyMerchant(
    merchantId: string,
    type: 'order' | 'alert' | 'insight',
    title: string,
    message: string
  ): Promise<void> {
    const headers = {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
    };

    await axios.post(
      `${NOTIFICATION_URL}/api/notifications/send`,
      {
        userId: merchantId,
        type: 'push',
        title,
        message,
        data: { type, merchantId },
      },
      { headers }
    );
  }

  /**
   * Get ad targeting parameters for merchant
   */
  async getAdTargetingParams(merchant: Merchant): Promise<{
    audience: string[];
    category: string;
    budget: { min: number; max: number };
    optimalBid: number;
  }> {
    try {
      // Get merchant segments
      const segmentsResponse = await axios.post(
        `${INTELLIGENCE_URL}/api/segments/merchant`,
        { merchantId: merchant.merchantId },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '',
          },
        }
      );

      // Get optimal bid prediction
      const bidResponse = await axios.post(
        `${INTELLIGENCE_URL}/api/predict/merchant-bid`,
        { merchantId: merchant.merchantId },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '',
          },
        }
      );

      return {
        audience: segmentsResponse.data.audience || [],
        category: merchant.industry,
        budget: { min: 100, max: 10000 },
        optimalBid: bidResponse.data.optimalBid || 5,
      };
    } catch (error) {
      console.error('Ad targeting failed:', error);
      return {
        audience: [],
        category: merchant.industry,
        budget: { min: 100, max: 1000 },
        optimalBid: 5,
      };
    }
  }

  /**
   * Get pricing optimization
   */
  async getPricingOptimization(merchantId: string, productId: string): Promise<{
    currentPrice: number;
    optimalPrice: number;
    expectedLift: number;
    reason: string;
  }> {
    try {
      const response = await axios.post(
        `${INTELLIGENCE_URL}/api/optimize/pricing`,
        { merchantId, productId },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Pricing optimization failed:', error);
      return {
        currentPrice: 0,
        optimalPrice: 0,
        expectedLift: 0,
        reason: 'Optimization unavailable',
      };
    }
  }

  /**
   * Get inventory optimization
   */
  async getInventoryOptimization(merchantId: string): Promise<{
    recommendations: { productId: string; action: 'restock' | 'reduce' | 'maintain'; quantity: number }[];
    insights: string[];
  }> {
    try {
      const response = await axios.post(
        `${INTELLIGENCE_URL}/api/optimize/inventory`,
        { merchantId },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Inventory optimization failed:', error);
      return { recommendations: [], insights: [] };
    }
  }

  /**
   * Alert merchant of critical issues
   */
  async sendAlert(merchantId: string, alertType: string, details: string): Promise<void> {
    const titles: Record<string, string> = {
      low_stock: 'Low Stock Alert',
      payment_failed: 'Payment Failed',
      negative_review: 'Negative Review',
      demand_spike: 'Demand Spike',
      competitor_activity: 'Competitor Activity',
    };

    await this.notifyMerchant(
      merchantId,
      'alert',
      titles[alertType] || 'Alert',
      details
    );
  }

  /**
   * Get churn prediction for merchant's customers
   */
  async getCustomerChurnRisks(merchantId: string): Promise<{
    customers: { userId: string; riskLevel: string; probability: number }[];
    summary: { high: number; medium: number; low: number };
  }> {
    try {
      const response = await axios.post(
        `${INTELLIGENCE_URL}/api/predict/merchant-churn`,
        { merchantId },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.REZ_INTELLIGENCE_API_KEY || '',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Churn prediction failed:', error);
      return { customers: [], summary: { high: 0, medium: 0, low: 0 } };
    }
  }
}

export const merchantIntegrations = new NexTaBizzIntegrations();
export default merchantIntegrations;

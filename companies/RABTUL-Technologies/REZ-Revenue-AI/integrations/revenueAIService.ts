/**
 * REZ Revenue AI - Complete Revenue Flow Service
 *
 * Integrates REZ Revenue AI with RABTUL services for:
 * - Dynamic pricing at checkout
 * - Cashback crediting
 * - Campaign notifications
 * - Payment processing
 */

import axios from 'axios';
import { logger } from '../config/logger';

// REZ Revenue AI URLs
const REVENUE_AI_URL = process.env.REVENUE_AI_URL || 'http://localhost:4301';
const REVENUE_AGENT_URL = process.env.REVENUE_AGENT_URL || 'http://localhost:4330';

// RABTUL URLs
const RABTUL = {
  auth: process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com',
  wallet: process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service-36vo.onrender.com',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'https://rez-notifications-service.onrender.com',
  payment: process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com',
};

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token';

export interface OrderItem {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  cost: number;
  quantity: number;
}

export interface PricingResult {
  itemId: string;
  originalPrice: number;
  dynamicPrice: number;
  adjustment: number;
  adjustmentType: string;
  factors: Array<{ name: string; reason: string; contribution: number }>;
}

export interface OrderPricing {
  items: Array<{
    item: OrderItem;
    pricing: PricingResult;
    lineTotal: number;
  }>;
  subtotal: number;
  totalAdjustment: number;
  grandTotal: number;
  cashback: {
    amount: number;
    rate: number;
    reason: string;
  };
}

export interface RevenueFlowResult {
  success: boolean;
  orderId?: string;
  pricing: OrderPricing;
  cashbackCredited?: {
    transactionId: string;
    amount: number;
  };
  notificationSent?: boolean;
  error?: string;
}

// ============================================================
// REVENUE FLOW SERVICE
// ============================================================

export class RevenueFlowService {
  /**
   * Execute complete revenue flow:
   * 1. Calculate dynamic prices
   * 2. Calculate optimal cashback
   * 3. Process cashback to wallet
   * 4. Send notification
   */
  async executeCompleteFlow(params: {
    orderId: string;
    merchantId: string;
    userId: string;
    phone?: string;
    items: OrderItem[];
    time: Date;
    customerSegment?: 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant';
    creditCashback?: boolean;
    sendNotification?: boolean;
  }): Promise<RevenueFlowResult> {
    try {
      // Step 1: Calculate dynamic prices
      logger.info('[RevenueFlow] Calculating dynamic prices', { orderId: params.orderId });
      const pricing = await this.calculateOrderPricing(params);

      // Step 2: Execute cashback flow if requested
      let cashbackCredited: RevenueFlowResult['cashbackCredited'];
      if (params.creditCashback && params.userId) {
        logger.info('[RevenueFlow] Crediting cashback', { orderId: params.orderId });
        cashbackCredited = await this.creditCashback({
          userId: params.userId,
          amount: pricing.cashback.amount,
          reason: `Order ${params.orderId} - ${pricing.cashback.reason}`,
          merchantId: params.merchantId,
          orderId: params.orderId,
        });
      }

      // Step 3: Send notification if requested
      let notificationSent = false;
      if (params.sendNotification && params.phone && cashbackCredited) {
        logger.info('[RevenueFlow] Sending notification', { orderId: params.orderId });
        notificationSent = await this.sendCashbackNotification({
          phone: params.phone,
          amount: cashbackCredited.amount,
          orderId: params.orderId,
        });
      }

      return {
        success: true,
        orderId: params.orderId,
        pricing,
        cashbackCredited,
        notificationSent,
      };
    } catch (error) {
      logger.error('[RevenueFlow] Flow execution failed', { orderId: params.orderId, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        pricing: await this.calculateOrderPricing(params),
      };
    }
  }

  /**
   * Calculate dynamic prices for all items
   */
  async calculateOrderPricing(params: {
    merchantId: string;
    items: OrderItem[];
    time: Date;
    customerSegment?: string;
  }): Promise<OrderPricing> {
    const pricedItems = [];
    let subtotal = 0;
    let totalAdjustment = 0;

    for (const item of params.items) {
      // Get dynamic price
      const pricing = await this.getDynamicPrice({
        entityId: item.id,
        entityName: item.name,
        category: item.category,
        basePrice: item.basePrice,
        cost: item.cost,
        time: params.time,
      });

      const lineTotal = pricing.dynamicPrice * item.quantity;
      pricedItems.push({ item, pricing, lineTotal });
      subtotal += lineTotal;
      totalAdjustment += pricing.adjustment;
    }

    // Calculate cashback
    const cashback = await this.calculateCashback({
      userId: 'unknown', // Will be set in complete flow
      orderValue: subtotal,
      segment: params.customerSegment || 'regular',
    });

    return {
      items: pricedItems,
      subtotal,
      totalAdjustment,
      grandTotal: Math.round(subtotal),
      cashback,
    };
  }

  /**
   * Get dynamic price from REZ Revenue AI
   */
  async getDynamicPrice(params: {
    entityId: string;
    entityName: string;
    category: string;
    basePrice: number;
    cost: number;
    time: Date;
  }): Promise<PricingResult> {
    try {
      const response = await axios.post(
        `${REVENUE_AI_URL}/api/v1/pricing/calculate`,
        {
          context: {
            entity: {
              id: params.entityId,
              type: 'product',
              category: params.category,
              vertical: 'restaurant',
              name: params.entityName,
              basePrice: params.basePrice,
              cost: params.cost,
            },
            time: {
              dayOfWeek: params.time.getDay(),
              hourOfDay: params.time.getHours(),
              isPeakHour: this.isPeakHour(params.time),
              isWeekend: params.time.getDay() === 0 || params.time.getDay() === 6,
            },
          },
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      );

      if (response.data.success) {
        const data = response.data.data;
        return {
          itemId: data.entityId,
          originalPrice: params.basePrice,
          dynamicPrice: data.finalPrice,
          adjustment: data.adjustment,
          adjustmentType: data.adjustmentType,
          factors: data.factors || [],
        };
      }
    } catch (error) {
      logger.warn('[RevenueFlow] Dynamic pricing failed, using base price');
    }

    // Fallback
    return {
      itemId: params.entityId,
      originalPrice: params.basePrice,
      dynamicPrice: params.basePrice,
      adjustment: 0,
      adjustmentType: 'none',
      factors: [],
    };
  }

  /**
   * Calculate optimal cashback
   */
  async calculateCashback(params: {
    userId: string;
    orderValue: number;
    segment: string;
  }): Promise<{ amount: number; rate: number; reason: string }> {
    const rates: Record<string, number> = {
      new: 0.15,
      regular: 0.05,
      vip: 0.03,
      at_risk: 0.15,
      dormant: 0.10,
    };

    const rate = rates[params.segment] || 0.05;
    const amount = Math.round(params.orderValue * rate);

    return {
      amount,
      rate,
      reason: this.getCashbackReason(params.segment),
    };
  }

  /**
   * Credit cashback to wallet
   */
  async creditCashback(params: {
    userId: string;
    amount: number;
    reason: string;
    merchantId: string;
    orderId: string;
  }): Promise<{ transactionId: string; amount: number }> {
    try {
      const response = await axios.post(
        `${RABTUL.wallet}/api/wallet/credit`,
        {
          userId: params.userId,
          amount: params.amount,
          type: 'cashback',
          reason: params.reason,
          metadata: {
            merchantId: params.merchantId,
            orderId: params.orderId,
            source: 'revenue_ai',
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        return {
          transactionId: response.data.data.transactionId,
          amount: params.amount,
        };
      }
    } catch (error) {
      logger.error('[RevenueFlow] Cashback credit failed', error);
    }

    // Fallback - return mock
    return {
      transactionId: `TXN_${Date.now()}`,
      amount: params.amount,
    };
  }

  /**
   * Send cashback notification
   */
  async sendCashbackNotification(params: {
    phone: string;
    amount: number;
    orderId: string;
  }): Promise<boolean> {
    try {
      await axios.post(
        `${RABTUL.notification}/api/notifications/sms`,
        {
          phone: params.phone,
          message: `🎉 Cashback credited! ₹${params.amount} added to your wallet for order ${params.orderId}. Thank you!`,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
          timeout: 5000,
        }
      );
      return true;
    } catch (error) {
      logger.warn('[RevenueFlow] Notification failed');
      return false;
    }
  }

  /**
   * Execute campaign flow
   */
  async executeCampaignFlow(params: {
    campaignId: string;
    merchantId: string;
    userIds: string[];
    title: string;
    body: string;
    offer?: { type: string; value: number };
  }): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const userId of params.userIds) {
      try {
        await axios.post(
          `${RABTUL.notification}/api/notifications/push`,
          {
            userId,
            notification: {
              title: params.title,
              body: params.body,
              data: {
                campaignId: params.campaignId,
                offer: JSON.stringify(params.offer),
              },
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Token': INTERNAL_TOKEN,
            },
            timeout: 5000,
          }
        );
        sent++;
      } catch {
        failed++;
      }
    }

    return { sent, failed };
  }

  /**
   * Get AI revenue recommendation
   */
  async getAIRecommendation(merchantId: string, question: string): Promise<string> {
    try {
      const response = await axios.post(
        `${REVENUE_AGENT_URL}/api/v1/agent/chat`,
        {
          merchantId,
          message: question,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      );

      if (response.data.success) {
        return response.data.data.response;
      }
    } catch (error) {
      logger.error('[RevenueFlow] AI recommendation failed', error);
    }

    return 'Unable to generate recommendation at this time.';
  }

  private isPeakHour(time: Date): boolean {
    const hour = time.getHours();
    return (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);
  }

  private getCashbackReason(segment: string): string {
    const reasons: Record<string, string> = {
      new: 'Welcome cashback',
      regular: 'Loyalty reward',
      vip: 'VIP bonus',
      at_risk: 'We miss you! Come back',
      dormant: 'Happy to see you again',
    };
    return reasons[segment] || 'Thank you for your order';
  }
}

// Singleton
let instance: RevenueFlowService | null = null;

export function getRevenueFlowService(): RevenueFlowService {
  if (!instance) {
    instance = new RevenueFlowService();
  }
  return instance;
}

export default RevenueFlowService;

/**
 * REZ Merchant - Unified Hub Integration
 *
 * Connects POS and KDS to:
 * - RABTUL (Auth, Payment, Wallet, Order)
 * - REZ Intelligence (Intent, Fraud, Recommend)
 * - QR Services (Verify QR)
 * - REZ Media (Karma)
 */

import axios from 'axios';

// ============================================
// SERVICE URLs
// ============================================

export const SERVICES = {
  // RABTUL
  AUTH: process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com',
  PAYMENT: process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com',
  WALLET: process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service.onrender.com',
  ORDER: process.env.ORDER_SERVICE_URL || 'https://rez-order-service.onrender.com',
  NOTIFICATIONS: process.env.NOTIFICATIONS_SERVICE_URL || 'https://rez-notifications-service.onrender.com',

  // Intelligence
  FRAUD: process.env.FRAUD_URL || 'https://rez-fraud-agent.onrender.com',
  RECOMMEND: process.env.RECOMMEND_URL || 'https://REZ-recommendation-engine.onrender.com',
  PREDICT: process.env.PREDICT_URL || 'https://REZ-predictive-engine.onrender.com',
  SIGNAL: process.env.SIGNAL_URL || 'https://REZ-signal-aggregator.onrender.com',
  CDP: process.env.CDP_URL || 'https://REZ-cdp-service.onrender.com',

  // QR
  VERIFY_QR: process.env.VERIFY_QR_URL || 'https://verify-qr.onrender.com',

  // Karma
  KARMA: process.env.KARMA_URL || 'https://rez-gamification-service.onrender.com',

  // Event Bus
  EVENT_BUS: process.env.EVENT_BUS_URL || 'https://REZ-event-bus.onrender.com'
};

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-token';

async function call(service: keyof typeof SERVICES, endpoint: string, method = 'POST', data?) {
  const url = `${SERVICES[service]}${endpoint}`;
  try {
    const response = await axios({
      method,
      url,
      data,
      headers: {
        'X-Internal-Token': INTERNAL_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error(`[${service}] ${endpoint} failed:`, error);
    return null;
  }
}

// ============================================
// MERCHANT POS OPERATIONS
// ============================================

export const merchantPOS = {
  /**
   * Process sale with fraud check and loyalty
   */
  async processSale(params: {
    merchant_id: string;
    store_id: string;
    cashier_id: string;
    customer_id?: string;
    customer_phone?: string;
    items: Array<{
      product_id: string;
      name: string;
      quantity: number;
      price: number;
    }>;
    payment_method: 'cash' | 'upi' | 'card' | 'wallet';
    use_karma?: boolean;
    verify_qr_codes?: string[];
  }) {
    const result: unknown = { success: true };

    // 1. Verify QR codes if provided
    if (params.verify_qr_codes?.length) {
      result.verified_products = [];
      for (const qr of params.verify_qr_codes) {
        const verify = await call('VERIFY_QR', '/api/verify', 'POST', {
          serial_number: qr
        });
        result.verified_products.push({
          qr_code: qr,
          verified: verify?.status === 'AUTHENTIC',
          product: verify
        });
      }
    }

    // 2. Fraud check for customer
    if (params.customer_id) {
      const fraudCheck = await call('FRAUD', '/api/score', 'POST', {
        user_id: params.customer_id,
        transaction_type: 'pos_sale',
        amount: params.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      });
      result.fraud_risk = fraudCheck?.risk_level || 'low';
      if (fraudCheck?.risk_level === 'high') {
        result.warning = 'High fraud risk detected';
      }
    }

    // 3. Get recommendations for upsell
    if (params.customer_id) {
      const recs = await call('RECOMMEND', '/api/upsell', 'POST', {
        user_id: params.customer_id,
        items: params.items
      });
      result.recommendations = recs?.items || [];
    }

    // 4. Use karma if requested
    if (params.use_karma && params.customer_id) {
      const karma = await call('KARMA', '/api/redeem', 'POST', {
        user_id: params.customer_id,
        source: 'merchant_pos',
        points: Math.floor(params.items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 0.01)
      });
      result.karma_redeemed = karma?.points_redeemed || 0;
    }

    // 5. Award karma for purchase
    if (params.customer_id) {
      const karmaEarned = Math.floor(params.items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 0.01);
      await call('KARMA', '/api/points/award', 'POST', {
        user_id: params.customer_id,
        merchant_id: params.merchant_id,
        points: karmaEarned,
        action: 'purchase'
      });
      result.karma_earned = karmaEarned;
    }

    // 6. Track signals
    if (params.customer_id) {
      await call('SIGNAL', '/api/collect', 'POST', {
        service: 'merchant_pos',
        event: 'purchase',
        user_id: params.customer_id,
        entities: {
          merchant_id: params.merchant_id,
          store_id: params.store_id,
          total_amount: params.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
          item_count: params.items.length
        }
      });
    }

    // 7. Publish event
    await call('EVENT_BUS', '/events', 'POST', {
      event_type: 'merchant.sale',
      source: 'merchant_pos',
      data: {
        merchant_id: params.merchant_id,
        store_id: params.store_id,
        customer_id: params.customer_id,
        items: params.items,
        total: params.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      }
    });

    return result;
  },

  /**
   * Get customer profile for POS
   */
  async getCustomerProfile(customerId: string) {
    const [cdp, karma, rfm] = await Promise.all([
      call('CDP', '/api/profile', 'POST', { user_id: customerId }),
      call('KARMA', '/api/balance', 'POST', { user_id: customerId }),
      call('CDP', '/api/rfm', 'POST', { user_id: customerId })
    ]);

    return {
      customer_id: customerId,
      name: cdp?.name,
      phone: cdp?.phone,
      karma_points: karma?.points || 0,
      karma_tier: karma?.tier || 'standard',
      rfm_tier: rfm?.tier || 'standard',
      rfm_score: rfm?.score || 0
    };
  },

  /**
   * Get product recommendations for customer
   */
  async getRecommendations(customerId: string, category?: string) {
    const [products, offers] = await Promise.all([
      call('RECOMMEND', '/api/products', 'POST', {
        user_id: customerId,
        context: { category }
      }),
      call('KARMA', '/api/offers', 'POST', {
        user_id: customerId
      })
    ]);

    return {
      recommended_products: products?.items || [],
      available_offers: offers?.items || []
    };
  }
};

// ============================================
// KDS OPERATIONS
// ============================================

export const merchantKDS = {
  /**
   * Create KDS order
   */
  async createOrder(params: {
    store_id: string;
    items: Array<{
      item_id: string;
      name: string;
      quantity: number;
      modifiers?: string[];
      notes?: string;
    }>;
    customer_id?: string;
    order_type: 'dine_in' | 'takeout' | 'delivery';
    table_number?: string;
  }) {
    // Create order in system
    const orderId = `ORD-${Date.now()}`;

    // Track signals
    if (params.customer_id) {
      await call('SIGNAL', '/api/collect', 'POST', {
        service: 'merchant_kds',
        event: 'order_created',
        user_id: params.customer_id,
        entities: {
          order_id: orderId,
          order_type: params.order_type,
          item_count: params.items.length
        }
      });
    }

    // Publish event
    await call('EVENT_BUS', '/events', 'POST', {
      event_type: 'kds.order_created',
      source: 'merchant_kds',
      data: {
        order_id: orderId,
        store_id: params.store_id,
        items: params.items,
        order_type: params.order_type
      }
    });

    return {
      order_id: orderId,
      status: 'received',
      estimated_time: params.order_type === 'dine_in' ? '15 min' : '20 min'
    };
  },

  /**
   * Update order status
   */
  async updateOrderStatus(params: {
    order_id: string;
    status: 'preparing' | 'ready' | 'served' | 'completed';
  }) {
    // Notify customer if ready
    if (params.status === 'ready') {
      await call('NOTIFICATIONS', '/api/push/send', 'POST', {
        title: 'Order Ready!',
        body: `Your order #${params.order_id} is ready`,
        data: { order_id: params.order_id }
      });
    }

    // Publish event
    await call('EVENT_BUS', '/events', 'POST', {
      event_type: `kds.order_${params.status}`,
      source: 'merchant_kds',
      data: {
        order_id: params.order_id,
        status: params.status
      }
    });

    return { success: true };
  }
};

// ============================================
// STORE MANAGEMENT
// ============================================

export const merchantStore = {
  /**
   * Get store analytics
   */
  async getAnalytics(storeId: string) {
    const [signals, predictions] = await Promise.all([
      call('SIGNAL', '/api/aggregate', 'POST', {
        type: 'store',
        id: storeId
      }),
      call('PREDICT', '/api/demand-forecast', 'POST', {
        store_id: storeId,
        days: 7
      })
    ]);

    return {
      store_id: storeId,
      today_orders: signals?.today_orders || 0,
      today_revenue: signals?.today_revenue || 0,
      peak_hours: signals?.peak_hours || [],
      demand_forecast: predictions?.predictions || [],
      recommendations: predictions?.recommendations || []
    };
  },

  /**
   * Get customer segments for store
   */
  async getCustomerSegments(storeId: string) {
    const segments = await call('CDP', '/api/store-segments', 'POST', {
      store_id: storeId
    });

    return {
      store_id: storeId,
      segments: segments?.segments || [],
      vip_customers: segments?.vip_customers || 0
    };
  }
};

// ============================================
// DEFAULT EXPORT
// ============================================

export const merchantHub = {
  pos: merchantPOS,
  kds: merchantKDS,
  store: merchantStore,
  call,
  SERVICES
};

export default merchantHub;

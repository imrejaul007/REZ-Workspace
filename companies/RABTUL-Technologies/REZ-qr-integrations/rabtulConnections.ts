/**
 * REZ QR Services - RABTUL Service Integration Module
 *
 * Central module for all QR services to connect to RABTUL infrastructure
 *
 * Services:
 * - Auth Service (JWT, OTP, MFA)
 * - Payment Service (Razorpay, UPI)
 * - Wallet Service (Coins, Balance, Loyalty)
 * - Notifications Service (Push, SMS, Email)
 * - Agent Service (WhatsApp)
 */

import axios from 'axios';

// ============================================
// RABTUL SERVICE URLs
// ============================================

export const RABTUL_SERVICES = {
  AUTH: process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com',
  PAYMENT: process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com',
  WALLET: process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service.onrender.com',
  NOTIFICATIONS: process.env.NOTIFICATIONS_SERVICE_URL || 'https://rez-notifications-service.onrender.com',
  AGENT: process.env.AGENT_SERVICE_URL || 'https://REZ-agent.onrender.com',
  CARE: process.env.CARE_SERVICE_URL || 'https://REZ-care.onrender.com',
  MIND: process.env.MIND_SERVICE_URL || 'https://REZ-mind.onrender.com',
  INTELLIGENCE: process.env.INTELLIGENCE_SERVICE_URL || 'https://rez-intelligence.onrender.com',
  DELIVERY: process.env.DELIVERY_SERVICE_URL || 'https://rez-delivery-service.onrender.com',
  MERCHANT: process.env.MERCHANT_SERVICE_URL || 'https://rez-merchant.onrender.com',
};

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_TOKEN ?? (() => {
  throw new Error('INTERNAL_SERVICE_TOKEN environment variable is required');
})();

// Helper for internal API calls
async function internalCall(service: keyof typeof RABTUL_SERVICES, endpoint: string, method = 'GET', data?) {
  const url = `${RABTUL_SERVICES[service]}${endpoint}`;
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
    console.error(`${service} call failed:`, error);
    throw error;
  }
}

// ============================================
// AUTH SERVICE
// ============================================

export const authService = {
  /**
   * Verify JWT token
   */
  async verifyToken(token: string) {
    return internalCall('AUTH', '/api/auth/verify', 'POST', { token });
  },

  /**
   * Send OTP for verification
   */
  async sendOTP(phone: string, purpose: 'login' | 'verify' | 'payment' = 'verify') {
    return internalCall('AUTH', '/api/auth/request-otp', 'POST', { phone, purpose });
  },

  /**
   * Verify OTP
   */
  async verifyOTP(phone: string, otp: string, purpose: string = 'verify') {
    return internalCall('AUTH', '/api/auth/verify-otp', 'POST', { phone, otp, purpose });
  },

  /**
   * Get user profile from auth service
   */
  async getProfile(userId: string) {
    return internalCall('AUTH', `/api/users/${userId}`, 'GET');
  },

  /**
   * Register new user
   */
  async registerUser(userData: { phone: string; name?: string; email?: string }) {
    return internalCall('AUTH', '/api/users', 'POST', userData);
  }
};

// ============================================
// PAYMENT SERVICE
// ============================================

export const paymentService = {
  /**
   * Create payment order
   */
  async createOrder(amount: number, userId: string, purpose: string) {
    return internalCall('PAYMENT', '/api/orders/create', 'POST', {
      amount,
      user_id: userId,
      purpose
    });
  },

  /**
   * Verify payment
   */
  async verifyPayment(paymentId: string, orderId: string) {
    return internalCall('PAYMENT', '/api/payments/verify', 'POST', {
      payment_id: paymentId,
      order_id: orderId
    });
  },

  /**
   * Create refund
   */
  async createRefund(paymentId: string, amount: number, reason: string) {
    return internalCall('PAYMENT', '/api/refunds', 'POST', {
      payment_id: paymentId,
      amount,
      reason
    });
  },

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string) {
    return internalCall('PAYMENT', `/api/payments/${paymentId}`, 'GET');
  },

  /**
   * Process webhook
   */
  async processWebhook(webhookData) {
    return internalCall('PAYMENT', '/api/webhooks/process', 'POST', webhookData);
  }
};

// ============================================
// WALLET SERVICE
// ============================================

export const walletService = {
  /**
   * Get user wallet balance
   */
  async getBalance(userId: string) {
    return internalCall('WALLET', `/api/wallet/${userId}/balance`, 'GET');
  },

  /**
   * Add coins/balance
   */
  async credit(userId: string, amount: number, source: string, reference?: string) {
    return internalCall('WALLET', '/api/wallet/credit', 'POST', {
      user_id: userId,
      amount,
      source,
      reference_id: reference
    });
  },

  /**
   * Deduct coins/balance
   */
  async debit(userId: string, amount: number, source: string, reference?: string) {
    return internalCall('WALLET', '/api/wallet/debit', 'POST', {
      user_id: userId,
      amount,
      source,
      reference_id: reference
    });
  },

  /**
   * Get transaction history
   */
  async getTransactions(userId: string, limit = 20) {
    return internalCall('WALLET', `/api/wallet/${userId}/transactions?limit=${limit}`, 'GET');
  },

  /**
   * Award loyalty points
   */
  async awardPoints(userId: string, merchantId: string, points: number, action: string) {
    return internalCall('WALLET', '/api/loyalty/earn', 'POST', {
      user_id: userId,
      merchant_id: merchantId,
      points,
      action
    });
  },

  /**
   * Redeem points
   */
  async redeemPoints(userId: string, points: number, rewardId: string) {
    return internalCall('WALLET', '/api/loyalty/redeem', 'POST', {
      user_id: userId,
      points,
      reward_id: rewardId
    });
  }
};

// ============================================
// NOTIFICATIONS SERVICE
// ============================================

export const notificationsService = {
  /**
   * Send push notification
   */
  async sendPush(userId: string, title: string, body: string, data?) {
    return internalCall('NOTIFICATIONS', '/api/push/send', 'POST', {
      user_id: userId,
      title,
      body,
      data
    });
  },

  /**
   * Send SMS
   */
  async sendSMS(phone: string, message: string) {
    return internalCall('NOTIFICATIONS', '/api/sms/send', 'POST', {
      phone,
      message
    });
  },

  /**
   * Send email
   */
  async sendEmail(to: string, subject: string, body: string, template?: string) {
    return internalCall('NOTIFICATIONS', '/api/email/send', 'POST', {
      to,
      subject,
      body,
      template
    });
  },

  /**
   * Register device for push
   */
  async registerDevice(userId: string, deviceToken: string, platform: 'ios' | 'android' | 'web') {
    return internalCall('NOTIFICATIONS', '/api/devices/register', 'POST', {
      user_id: userId,
      device_token: deviceToken,
      platform
    });
  }
};

// ============================================
// AGENT SERVICE (WhatsApp)
// ============================================

export const agentService = {
  /**
   * Send WhatsApp message
   */
  async sendWhatsApp(phone: string, template: string, params: Record<string, string>, userId?: string) {
    return internalCall('AGENT', '/api/agent/whatsapp/send', 'POST', {
      phone,
      template,
      params,
      user_id: userId
    });
  },

  /**
   * Send template message
   */
  async sendTemplate(phone: string, templateName: string, variables: Record<string, string>) {
    return internalCall('AGENT', '/api/agent/template/send', 'POST', {
      phone,
      template_name: templateName,
      variables
    });
  },

  /**
   * Get message status
   */
  async getMessageStatus(messageId: string) {
    return internalCall('AGENT', `/api/agent/messages/${messageId}`, 'GET');
  }
};

// ============================================
// CARE SERVICE (Support)
// ============================================

export const careService = {
  /**
   * Create support ticket
   */
  async createTicket(data: {
    title: string;
    description: string;
    customer_id: string;
    customer_name?: string;
    customer_phone?: string;
    category: string;
    priority?: 'low' | 'medium' | 'high';
    platform: string;
    metadata?;
  }) {
    return internalCall('CARE', '/api/auto-tickets', 'POST', data);
  },

  /**
   * Get ticket status
   */
  async getTicket(ticketId: string) {
    return internalCall('CARE', `/api/auto-tickets/${ticketId}`, 'GET');
  },

  /**
   * Add message to ticket
   */
  async addMessage(ticketId: string, message: string, from: 'customer' | 'agent') {
    return internalCall('CARE', `/api/auto-tickets/${ticketId}/message`, 'POST', {
      message,
      from
    });
  },

  /**
   * Submit CSAT survey response
   */
  async submitCSAT(data: {
    customer_id: string;
    interaction_type: string;
    interaction_id: string;
    rating: number;
    feedback?: string;
  }) {
    return internalCall('CARE', '/api/csat/respond', 'POST', data);
  },

  /**
   * Send CSAT survey
   */
  async sendCSAT(customerId: string, interactionType: string, interactionId: string) {
    return internalCall('CARE', '/api/csat/send', 'POST', {
      customer_id: customerId,
      interaction_type: interactionType,
      interaction_id: interactionId
    });
  }
};

// ============================================
// MIND SERVICE (AI/ML)
// ============================================

export const mindService = {
  /**
   * Get recommendations
   */
  async recommend(data: {
    user_id?: string;
    type: string;
    context?;
    items?: unknown[];
  }) {
    return internalCall('MIND', '/api/recommend', 'POST', data);
  },

  /**
   * Predict intent
   */
  async predictIntent(userId: string, action: string, entities) {
    return internalCall('MIND', '/api/intent/predict', 'POST', {
      user_id: userId,
      action,
      entities
    });
  },

  /**
   * Fraud check
   */
  async checkFraud(data) {
    return internalCall('MIND', '/api/fraud/check', 'POST', data);
  },

  /**
   * Sentiment analysis
   */
  async analyzeSentiment(text: string) {
    return internalCall('MIND', '/api/sentiment/analyze', 'POST', { text });
  }
};

// ============================================
// INTELLIGENCE SERVICE (Analytics)
// ============================================

export const intelligenceService = {
  /**
   * Track user intent
   */
  async trackIntent(data: {
    user_id: string;
    intent_type: string;
    entities?;
    action: string;
  }) {
    return internalCall('INTELLIGENCE', '/api/intent/track', 'POST', data);
  },

  /**
   * Track attribution
   */
  async trackAttribution(data: {
    event_type: string;
    user_id?: string;
    entities?;
    value?: number;
  }) {
    return internalCall('INTELLIGENCE', '/api/attribution/track', 'POST', data);
  },

  /**
   * Get predictions
   */
  async predict(data: {
    model: string;
    input;
    horizon?: number;
  }) {
    return internalCall('INTELLIGENCE', '/api/predict', 'POST', data);
  },

  /**
   * Get segments
   */
  async getSegments(userId: string) {
    return internalCall('INTELLIGENCE', `/api/segments/${userId}`, 'GET');
  }
};

// ============================================
// DELIVERY SERVICE
// ============================================

export const deliveryService = {
  /**
   * Schedule pickup
   */
  async schedulePickup(data: {
    pickup_id: string;
    pickup_address;
    scheduled_time: string;
    service_type: string;
    customer_phone: string;
  }) {
    return internalCall('DELIVERY', '/api/pickup/schedule', 'POST', data);
  },

  /**
   * Track delivery
   */
  async trackDelivery(trackingId: string) {
    return internalCall('DELIVERY', `/api/track/${trackingId}`, 'GET');
  },

  /**
   * Cancel pickup
   */
  async cancelPickup(pickupId: string) {
    return internalCall('DELIVERY', `/api/pickup/${pickupId}/cancel`, 'POST');
  }
};

// ============================================
// MERCHANT SERVICE
// ============================================

export const merchantService = {
  /**
   * Register loyalty enrollment
   */
  async registerLoyalty(data: {
    user_id: string;
    merchant_id: string;
    source: string;
    tier?: string;
  }) {
    return internalCall('MERCHANT', '/api/loyalty/enroll', 'POST', data);
  },

  /**
   * Award loyalty points
   */
  async awardPoints(data: {
    user_id: string;
    merchant_id: string;
    points: number;
    action: string;
    reference_id?: string;
  }) {
    return internalCall('MERCHANT', '/api/loyalty/earn', 'POST', data);
  },

  /**
   * Sync customer data
   */
  async syncCustomer(customerData) {
    return internalCall('MERCHANT', '/api/customers/sync', 'POST', customerData);
  },

  /**
   * Get merchant analytics
   */
  async getAnalytics(merchantId: string) {
    return internalCall('MERCHANT', `/api/analytics/${merchantId}`, 'GET');
  }
};

// ============================================
// DEFAULT EXPORT (All services)
// ============================================

export const rabtul = {
  auth: authService,
  payment: paymentService,
  wallet: walletService,
  notifications: notificationsService,
  agent: agentService,
  care: careService,
  mind: mindService,
  intelligence: intelligenceService,
  delivery: deliveryService,
  merchant: merchantService
};

export default rabtul;

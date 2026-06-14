/**
 * RABTUL Integration Service
 *
 * Connects ReZ Commerce to RABTUL infrastructure services.
 */

import axios from 'axios';

const {
  AUTH_SERVICE_URL = 'https://rez-auth-service.onrender.com',
  PAYMENT_SERVICE_URL = 'https://rez-payment-service.onrender.com',
  WALLET_SERVICE_URL = 'https://rez-wallet-service.onrender.com',
  ORDER_SERVICE_URL = 'https://rez-order-service.onrender.com',
  NOTIFY_SERVICE_URL = 'https://rez-notifications-service.onrender.com',
  INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '',
} = process.env;

// Internal headers for service-to-service communication
const INTERNAL_HEADERS = {
  'Content-Type': 'application/json',
  'X-Internal-Token': INTERNAL_TOKEN,
};

export class RABTULIntegration {
  // ─── Authentication ───────────────────────────────────────────────

  /**
   * Verify customer token
   */
  static async verifyToken(token: string) {
    try {
      const response = await axios.post(
        `${AUTH_SERVICE_URL}/api/auth/verify`,
        { token },
        { headers: INTERNAL_HEADERS }
      );
      return response.data;
    } catch (error) {
      console.error('RABTUL Auth verification failed:', error);
      return null;
    }
  }

  /**
   * Send OTP for verification
   */
  static async sendOTP(phone: string, purpose: 'login' | 'verify' = 'verify') {
    try {
      const response = await axios.post(
        `${AUTH_SERVICE_URL}/api/auth/otp/send`,
        { phone, purpose },
        { headers: INTERNAL_HEADERS }
      );
      return response.data;
    } catch (error) {
      console.error('OTP send failed:', error);
      return { success: false, error: 'OTP service unavailable' };
    }
  }

  // ─── Payments ───────────────────────────────────────────────

  /**
   * Create payment intent
   */
  static async createPayment(data: {
    orderId: string;
    amount: number;
    currency?: string;
    customerId: string;
    methods?: string[];
  }) {
    try {
      const response = await axios.post(
        `${PAYMENT_SERVICE_URL}/api/payments/create`,
        {
          orderId: data.orderId,
          amount: data.amount,
          currency: data.currency || 'INR',
          customerId: data.customerId,
          paymentMethods: data.methods || ['upi', 'card', 'wallet'],
        },
        { headers: INTERNAL_HEADERS }
      );
      return response.data;
    } catch (error) {
      console.error('Payment creation failed:', error);
      return { success: false, error: 'Payment service unavailable' };
    }
  }

  /**
   * Verify payment webhook
   */
  static async verifyPaymentWebhook(payload: any, signature: string) {
    try {
      const response = await axios.post(
        `${PAYMENT_SERVICE_URL}/api/webhooks/verify`,
        { payload, signature },
        { headers: INTERNAL_HEADERS }
      );
      return response.data;
    } catch (error) {
      return { verified: false };
    }
  }

  // ─── Wallet/Loyalty ───────────────────────────────────────────────

  /**
   * Get customer wallet balance
   */
  static async getWalletBalance(customerId: string) {
    try {
      const response = await axios.get(
        `${WALLET_SERVICE_URL}/api/wallet/${customerId}`,
        { headers: INTERNAL_HEADERS }
      );
      return response.data;
    } catch (error) {
      return { balance: 0, coins: 0 };
    }
  }

  /**
   * Add loyalty points
   */
  static async addPoints(customerId: string, points: number, reason: string) {
    try {
      const response = await axios.post(
        `${WALLET_SERVICE_URL}/api/wallet/points/add`,
        { customerId, points, reason, source: 'commerce' },
        { headers: INTERNAL_HEADERS }
      );
      return response.data;
    } catch (error) {
      console.error('Points addition failed:', error);
      return { success: false };
    }
  }

  /**
   * Redeem loyalty points
   */
  static async redeemPoints(customerId: string, points: number, orderId: string) {
    try {
      const response = await axios.post(
        `${WALLET_SERVICE_URL}/api/wallet/redeem`,
        { customerId, points, orderId },
        { headers: INTERNAL_HEADERS }
      );
      return response.data;
    } catch (error) {
      console.error('Points redemption failed:', error);
      return { success: false, error: 'Redemption failed' };
    }
  }

  // ─── Notifications ───────────────────────────────────────────────

  /**
   * Send push notification
   */
  static async sendPushNotification(data: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, any>;
  }) {
    try {
      const response = await axios.post(
        `${NOTIFY_SERVICE_URL}/api/send/push`,
        {
          to: data.userId,
          notification: { title: data.title, body: data.body },
          data: data.data,
        },
        { headers: INTERNAL_HEADERS }
      );
      return response.data;
    } catch (error) {
      console.error('Push notification failed:', error);
      return { success: false };
    }
  }

  /**
   * Send WhatsApp message
   */
  static async sendWhatsApp(data: {
    phone: string;
    template: string;
    variables: Record<string, string>;
  }) {
    try {
      const response = await axios.post(
        `${NOTIFY_SERVICE_URL}/api/send/whatsapp`,
        {
          to: data.phone,
          template: data.template,
          variables: data.variables,
        },
        { headers: INTERNAL_HEADERS }
      );
      return response.data;
    } catch (error) {
      console.error('WhatsApp send failed:', error);
      return { success: false };
    }
  }

  /**
   * Send email
   */
  static async sendEmail(data: {
    to: string;
    subject: string;
    template: string;
    variables: Record<string, string>;
  }) {
    try {
      const response = await axios.post(
        `${NOTIFY_SERVICE_URL}/api/send/email`,
        {
          to: data.to,
          subject: data.subject,
          template: data.template,
          variables: data.variables,
        },
        { headers: INTERNAL_HEADERS }
      );
      return response.data;
    } catch (error) {
      console.error('Email send failed:', error);
      return { success: false };
    }
  }
}

export default RABTULIntegration;

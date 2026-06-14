/**
 * RABTUL Payment Integration for REZ-Media Services
 *
 * Uses RABTUL Payment as the payment processor for all REZ-Media services.
 * This ensures compliance with payment regulations and security.
 */

import axios from 'axios';

const PAYMENT_URL = process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// Types
interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  metadata?: Record<string, string>;
}

interface RefundRequest {
  paymentId: string;
  amount: number;
  reason: string;
}

interface PaymentMethod {
  id: string;
  type: 'upi' | 'card' | 'wallet';
  last4?: string;
}

class RABTULPaymentIntegration {
  /**
   * Create a payment intent for ad purchases
   */
  async createPaymentIntent(params: {
    userId: string;
    amount: number; // in paise
    currency?: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentIntent> {
    try {
      const response = await axios.post(
        `${PAYMENT_URL}/api/payments/create`,
        {
          userId: params.userId,
          amount: params.amount,
          currency: params.currency || 'INR',
          description: params.description || 'REZ Media Purchase',
          metadata: {
            ...params.metadata,
            source: 'rez-media',
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
        }
      );

      return {
        id: response.data.paymentId,
        amount: response.data.amount,
        currency: response.data.currency || 'INR',
        status: 'pending',
        metadata: response.data.metadata,
      };
    } catch (error) {
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Capture a payment
   */
  async capturePayment(paymentId: string): Promise<PaymentIntent> {
    try {
      const response = await axios.post(
        `${PAYMENT_URL}/api/payments/${paymentId}/capture`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
        }
      );

      return {
        id: response.data.paymentId,
        amount: response.data.amount,
        currency: response.data.currency,
        status: response.data.status === 'captured' ? 'completed' : 'pending',
      };
    } catch (error) {
      throw new Error(`Failed to capture payment: ${error.message}`);
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(request: RefundRequest): Promise<{ refundId: string; status: string }> {
    try {
      const response = await axios.post(
        `${PAYMENT_URL}/api/payments/refund`,
        {
          paymentId: request.paymentId,
          amount: request.amount,
          reason: request.reason,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
        }
      );

      return {
        refundId: response.data.refundId,
        status: response.data.status,
      };
    } catch (error) {
      throw new Error(`Failed to refund payment: ${error.message}`);
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentIntent> {
    try {
      const response = await axios.get(`${PAYMENT_URL}/api/payments/${paymentId}`, {
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      });

      return {
        id: response.data.paymentId,
        amount: response.data.amount,
        currency: response.data.currency,
        status: this.mapPaymentStatus(response.data.status),
        metadata: response.data.metadata,
      };
    } catch (error) {
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  /**
   * List user's payment methods
   */
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const response = await axios.get(`${PAYMENT_URL}/api/payments/methods/${userId}`, {
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      });

      return response.data.methods || [];
    } catch {
      return [];
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * Process webhook
   */
  async processWebhook(webhookData): Promise<{
    processed: boolean;
    paymentId?: string;
    status?: string;
  }> {
    try {
      const response = await axios.post(
        `${PAYMENT_URL}/api/webhooks/process`,
        webhookData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
        }
      );

      return {
        processed: true,
        paymentId: response.data.paymentId,
        status: response.data.status,
      };
    } catch {
      return { processed: false };
    }
  }

  private mapPaymentStatus(status: string): 'pending' | 'completed' | 'failed' {
    switch (status) {
      case 'captured':
      case 'completed':
      case 'success':
        return 'completed';
      case 'failed':
      case 'cancelled':
        return 'failed';
      default:
        return 'pending';
    }
  }
}

// Singleton instance
export const rabtulPayment = new RABTULPaymentIntegration();

// Default export
export default rabtulPayment;

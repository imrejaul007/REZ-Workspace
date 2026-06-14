/**
 * RABTUL Payment Connector
 * Port: 4001
 */
import axios from 'axios';

const PAYMENT_URL = process.env.PAYMENT_URL || 'http://localhost:4001';
const TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

export class PaymentConnector {
  private url: string;
  private token: string;

  constructor(url?: string, token?: string) {
    this.url = url || PAYMENT_URL;
    this.token = token || TOKEN || '';
  }

  private headers() {
    return {
      'X-Internal-Token': this.token,
      'Content-Type': 'application/json'
    };
  }

  // Create order
  async createOrder(params: {
    amount: number;
    currency?: string;
    userId: string;
    merchantId?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    try {
      const res = await axios.post(`${this.url}/api/payments/create-order`, params, { headers: this.headers() });
      return res.data;
    } catch (error) {
      throw new Error(`Payment order creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Verify payment
  async verifyPayment(orderId: string, razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): Promise<any> {
    try {
      const res = await axios.post(`${this.url}/api/payments/verify`, {
        orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature
      }, { headers: this.headers() });
      return res.data;
    } catch (error) {
      throw new Error(`Payment verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Refund
  async refund(paymentId: string, amount?: number, reason?: string): Promise<any> {
    try {
      const res = await axios.post(`${this.url}/api/payments/refund`, {
        paymentId, amount, reason
      }, { headers: this.headers() });
      return res.data;
    } catch (error) {
      throw new Error(`Refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get payment status
  async getPayment(paymentId: string): Promise<any> {
    try {
      const res = await axios.get(`${this.url}/api/payments/${paymentId}`, { headers: this.headers() });
      return res.data;
    } catch (error) {
      throw new Error(`Get payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Webhook handler
  async handleWebhook(event: string, payload: any): Promise<any> {
    try {
      const res = await axios.post(`${this.url}/api/webhooks/handle`, { event, payload }, { headers: this.headers() });
      return res.data;
    } catch (error) {
      throw new Error(`Webhook handling failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const paymentConnector = new PaymentConnector();

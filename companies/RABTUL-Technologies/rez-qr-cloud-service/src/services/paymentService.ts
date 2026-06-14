import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config';
import { Order } from '../models';

export interface PaymentInitResult {
  success: boolean;
  paymentId?: string;
  checkoutUrl?: string;
  orderId?: string;
  amount?: number;
}

export interface PaymentVerifyResult {
  success: boolean;
  status?: string;
  orderId?: string;
}

export class PaymentService {

  /**
   * Initialize payment with Razorpay
   */
  async initiatePayment(order: any): Promise<PaymentInitResult> {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.warn('Razorpay not configured, using mock payment');
      return this.mockInitiatePayment(order);
    }

    try {
      const razorpayOrder = {
        amount: Math.round(order.total * 100), // Razorpay expects paise
        currency: 'INR',
        receipt: `qr_${order._id}`,
        notes: {
          merchantId: order.merchantId.toString(),
          customerPhone: order.customerPhone,
          orderId: order._id.toString(),
        },
      };

      // Create Razorpay order
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

      const response = await axios.post(
        'https://api.razorpay.com/v1/orders',
        razorpayOrder,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const razorpayOrderData = response.data;

      // Update order with payment ID
      order.paymentId = razorpayOrderData.id;
      await order.save();

      return {
        success: true,
        paymentId: razorpayOrderData.id,
        orderId: razorpayOrderData.receipt,
        amount: order.total,
        checkoutUrl: `https://api.razorpay.com/v1/checkout/opacity#prefill[contact]=${order.customerPhone}&prefill[order_id]=${razorpayOrderData.id}`,
      };

    } catch (error: any) {
      console.error('Razorpay error:', error.response?.data || error.message);
      return { success: false };
    }
  }

  /**
   * Verify payment signature
   */
  async verifyPayment(paymentId: string, orderId: string, signature: string): Promise<PaymentVerifyResult> {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      console.warn('Razorpay not configured, using mock verification');
      return this.mockVerifyPayment(paymentId);
    }

    try {
      // Verify signature
      const payload = `${orderId}|${signature}`;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(payload)
        .digest('hex');

      if (signature !== expectedSignature) {
        return { success: false, status: 'invalid_signature' };
      }

      // Check payment status
      const keyId = process.env.RAZORPAY_KEY_ID;
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

      const response = await axios.get(
        `https://api.razorpay.com/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
          },
        }
      );

      const payment = response.data;

      if (payment.status === 'captured') {
        return { success: true, status: 'captured', orderId };
      }

      return { success: false, status: payment.status };

    } catch (error: any) {
      console.error('Razorpay verify error:', error.response?.data || error.message);
      return { success: false };
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<boolean> {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.warn('Razorpay not configured');
      return false;
    }

    try {
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

      await axios.post(
        `https://api.razorpay.com/v1/payments/${paymentId}/refund`,
        {
          amount: amount ? Math.round(amount * 100) : undefined,
          notes: { reason: reason || 'Customer request' },
        },
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return true;
    } catch (error: any) {
      console.error('Razorpay refund error:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Get UPI QR code for payment
   */
  async getUPIQrCode(order: any): Promise<string | null> {
    const keyId = process.env.RAZORPAY_KEY_ID;

    if (!keyId) {
      // Return mock UPI QR code
      return this.getMockUPIQrCode(order);
    }

    try {
      const response = await axios.post(
        'https://api.razorpay.com/v1/qr-code',
        {
          type: 'upi_qr',
          usage: 'single_use',
          amount: Math.round(order.total * 100),
          currency: 'INR',
          description: `Order #${order._id}`,
          customer_id: order.customerPhone,
          close_by: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
          notes: {
            merchantId: order.merchantId.toString(),
            orderId: order._id.toString(),
          },
        },
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${keyId}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.qr_image_url || null;
    } catch (error: any) {
      console.error('UPI QR error:', error.response?.data || error.message);
      return this.getMockUPIQrCode(order);
    }
  }

  /**
   * Mock payment for development
   */
  private async mockInitiatePayment(order: any): Promise<PaymentInitResult> {
    const mockPaymentId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    order.paymentId = mockPaymentId;
    order.paymentStatus = 'pending';
    await order.save();

    return {
      success: true,
      paymentId: mockPaymentId,
      orderId: `qr_${order._id}`,
      amount: order.total,
      checkoutUrl: null, // Will use UPI flow instead
    };
  }

  /**
   * Mock payment verification
   */
  private async mockVerifyPayment(paymentId: string): Promise<PaymentVerifyResult> {
    if (paymentId.startsWith('mock_')) {
      return { success: true, status: 'captured' };
    }
    return { success: false, status: 'failed' };
  }

  /**
   * Generate mock UPI QR code image
   */
  private getMockUPIQrCode(order: any): string {
    // Generate a simple UPI QR code data URL
    const upiString = `upi://pay?pa=merchant@upi&pn=Merchant&am=${order.total}&cu=INR&tn=Order+${order._id}`;
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="white" width="200" height="200"/><text x="100" y="100" text-anchor="middle" font-size="12">UPI QR</text><text x="100" y="120" text-anchor="middle" font-size="10">₹${order.total}</text></svg>`;
  }
}

export const paymentService = new PaymentService();

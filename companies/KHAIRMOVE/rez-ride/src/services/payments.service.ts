import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import crypto from 'crypto';
import { ValidationError, AppError } from '../common/exceptions';

/**
 * Payments - Razorpay + UPI
 *
 * SECURITY: This service handles financial transactions.
 * All payment verification MUST be server-side only.
 */

interface RazorpayPayment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  order_id: string;
  method: string;
  captured_at?: number;
  created_at: number;
}

interface PaymentVerificationResult {
  valid: boolean;
  error?: string;
  payment?: RazorpayPayment;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly RAZORPAY_KEY = process.env.RAZORPAY_KEY_ID;
  private readonly RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET;
  private readonly RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
  private readonly razorpayBaseUrl = 'https://api.razorpay.com/v1';

  /**
   * Verify webhook signature from Razorpay
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    if (!this.RAZORPAY_WEBHOOK_SECRET) {
      this.logger.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  /**
   * Create a Razorpay order for a ride
   */
  async createOrder(
    amount: number,
    rideId: string,
    customerId: string
  ): Promise<{ orderId: string; amount: number }> {
    // Validate amount (prevent negative or zero)
    if (amount <= 0) {
      throw new ValidationError('Invalid amount: must be positive');
    }

    // Amount in paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Validate environment configuration
    if (!this.RAZORPAY_KEY || !this.RAZORPAY_SECRET) {
      this.logger.warn('Razorpay credentials not configured - using test mode');
      // Return test order ID for development
      return {
        orderId: `order_test_${Date.now()}_${rideId}`,
        amount
      };
    }

    try {
      const auth = Buffer.from(`${this.RAZORPAY_KEY}:${this.RAZORPAY_SECRET}`).toString('base64');

      const response = await axios.post(
        `${this.razorpayBaseUrl}/orders`,
        {
          amount: amountInPaise,
          currency: 'INR',
          receipt: `ride_${rideId}`,
          notes: {
            rideId,
            customerId,
            type: 'ride_payment'
          }
        },
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      this.logger.log(`Created Razorpay order: ${response.data.id} for ride: ${rideId}`);

      return {
        orderId: response.data.id,
        amount
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create Razorpay order: ${message}`);
      throw new AppError(`Payment initialization failed: ${message}`, 'PAYMENT_INIT_FAILED');
    }
  }

  /**
   * Verify payment signature and status
   * CRITICAL: This must be called server-side only
   */
  async verifyPayment(
    orderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<PaymentVerificationResult> {
    // Validate inputs
    if (!orderId || !razorpayPaymentId || !razorpaySignature) {
      return { valid: false, error: 'Missing required parameters' };
    }

    // Development mode: skip actual verification
    if (!this.RAZORPAY_KEY || !this.RAZORPAY_SECRET) {
      this.logger.warn('Razorpay credentials not configured - skipping verification in dev mode');
      return { valid: true };
    }

    try {
      // First, verify the signature mathematically
      const expectedSignature = crypto
        .createHmac('sha256', `${orderId}|${razorpayPaymentId}`)
        .update(this.RAZORPAY_SECRET)
        .digest('hex');

      const signatureValid = crypto.timingSafeEqual(
        Buffer.from(razorpaySignature),
        Buffer.from(expectedSignature)
      );

      if (!signatureValid) {
        this.logger.warn(`Signature mismatch for payment: ${razorpayPaymentId}`);
        return { valid: false, error: 'Invalid payment signature' };
      }

      // Second, verify payment status with Razorpay API
      const auth = Buffer.from(`${this.RAZORPAY_KEY}:${this.RAZORPAY_SECRET}`).toString('base64');

      const response = await axios.get(
        `${this.razorpayBaseUrl}/payments/${razorpayPaymentId}`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const payment: RazorpayPayment = response.data;

      // Check payment status
      if (payment.status !== 'captured') {
        this.logger.warn(`Payment not captured: ${payment.status} for payment: ${razorpayPaymentId}`);
        return {
          valid: false,
          error: `Payment status: ${payment.status}`,
          payment
        };
      }

      // Verify order_id matches
      if (payment.order_id !== orderId) {
        this.logger.warn(`Order ID mismatch: expected ${orderId}, got ${payment.order_id}`);
        return { valid: false, error: 'Order ID mismatch', payment };
      }

      this.logger.log(`Payment verified successfully: ${razorpayPaymentId} for order: ${orderId}`);

      return { valid: true, payment };
    } catch (error: any) {
      this.logger.error(`Payment verification failed: ${error.message}`);
      return {
        valid: false,
        error: error.response?.data?.error?.description || error.message
      };
    }
  }

  /**
   * Fetch payment details from Razorpay
   */
  async getPaymentDetails(paymentId: string): Promise<RazorpayPayment | null> {
    if (!this.RAZORPAY_KEY || !this.RAZORPAY_SECRET) {
      return null;
    }

    try {
      const auth = Buffer.from(`${this.RAZORPAY_KEY}:${this.RAZORPAY_SECRET}`).toString('base64');

      const response = await axios.get(
        `${this.razorpayBaseUrl}/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to fetch payment details: ${error.message}`);
      return null;
    }
  }

  /**
   * Process refund for a ride
   */
  async refund(rideId: string, amount: number, paymentId: string): Promise<{ refundId: string; status: string }> {
    if (amount <= 0) {
      throw new ValidationError('Invalid refund amount: must be positive');
    }

    if (!this.RAZORPAY_KEY || !this.RAZORPAY_SECRET) {
      this.logger.warn('Razorpay credentials not configured - returning test refund');
      return {
        refundId: `refund_test_${Date.now()}`,
        status: 'processed'
      };
    }

    try {
      const auth = Buffer.from(`${this.RAZORPAY_KEY}:${this.RAZORPAY_SECRET}`).toString('base64');
      const amountInPaise = Math.round(amount * 100);

      const response = await axios.post(
        `${this.razorpayBaseUrl}/payments/${paymentId}/refund`,
        {
          amount: amountInPaise,
          notes: {
            rideId,
            reason: 'Ride cancellation refund'
          }
        },
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      this.logger.log(`Refund processed: ${response.data.id} for ride: ${rideId}, amount: ${amount}`);

      return {
        refundId: response.data.id,
        status: response.data.status
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Refund failed: ${message}`);
      throw new AppError(`Refund processing failed: ${message}`, 'REFUND_FAILED');
    }
  }

  /**
   * Create UPI payment request
   */
  async createUPI(amount: number, vpa?: string): Promise<{ vpa: string; qrUrl: string }> {
    if (amount <= 0) {
      throw new ValidationError('Invalid amount: must be positive');
    }

    const amountInPaise = Math.round(amount * 100);

    if (!this.RAZORPAY_KEY || !this.RAZORPAY_SECRET) {
      // Development mode
      return {
        vpa: vpa || 'ride@rezpay',
        qrUrl: `upi://pay?pa=ride@rezpay&pn=ReZ%20Ride&am=${amount}&cu=INR`
      };
    }

    try {
      const auth = Buffer.from(`${this.RAZORPAY_KEY}:${this.RAZORPAY_SECRET}`).toString('base64');

      // paymentId not applicable for UPI creation, use vpa for validation
      const validateId = vpa || 'new';

      const response = await axios.post(
        `${this.razorpayBaseUrl}/payments/${validateId}/validate_vpa`,
        {
          vpa
        },
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      return {
        vpa: response.data.vpa,
        qrUrl: `upi://pay?pa=${response.data.vpa}&pn=ReZ%20Ride&am=${amount}&cu=INR`
      };
    } catch (error: any) {
      // Fallback for development
      this.logger.warn(`UPI validation failed: ${error.message}, using default`);
      return {
        vpa: 'ride@rezpay',
        qrUrl: `upi://pay?pa=ride@rezpay&pn=ReZ%20Ride&am=${amount}&cu=INR`
      };
    }
  }

  /**
   * Get payment methods available
   */
  async getPaymentMethods(): Promise<{ methods: string[] }> {
    return {
      methods: ['upi', 'card', 'netbanking', 'wallet', 'emi']
    };
  }
}

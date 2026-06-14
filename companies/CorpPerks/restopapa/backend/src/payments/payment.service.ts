/**
 * RABTUL PAYMENT SERVICE INTEGRATION
 *
 * Migrated from local Razorpay SDK to RABTUL Payment Service
 * See: https://github.com/imrejaul007/RABTUL-Technologies/tree/main/rez-payment-service
 *
 * Migration completed: 2026-05-18
 *
 * RABTUL Service: rez-payment-service (Port 4001)
 * Endpoints used:
 *   - POST /api/payments/create-order
 *   - POST /api/payments/verify
 *   - POST /api/payments/refund
 *
 * Auth: X-Internal-Token header for service-to-service calls
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const RABTUL_PAYMENT_SERVICE_URL = 'http://localhost:4001';
const RABTUL_PAYMENT_ENDPOINTS = {
  CREATE_ORDER: '/api/payments/create-order',
  VERIFY: '/api/payments/verify',
  REFUND: '/api/payments/refund',
} as const;

// Allowed payment amounts in INR (server-side validation)
const MIN_AMOUNT = 1; // ₹1 minimum
const MAX_AMOUNT = 1000000; // ₹10L maximum
const ALLOWED_PURPOSES = ['subscription', 'credits', 'marketplace', 'other'];

// Subscription plan prices (server-side - clients can't set arbitrary amounts)
const PLAN_PRICES = {
  'starter': 499,
  'professional': 1499,
  'enterprise': 4999,
};

interface RABTULOrderResponse {
  success: boolean;
  data?: {
    razorpayOrderId: string;
    amount: number;
    currency: string;
    paymentId?: string;
  };
  error?: string;
}

interface RABTULVerifyResponse {
  success: boolean;
  data?: {
    status: string;
    razorpayPaymentId: string;
  };
  error?: string;
}

interface RABTULRefundResponse {
  success: boolean;
  data?: {
    refundId: string;
    status: string;
    amount: number;
  };
  error?: string;
}

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Get authentication token for RABTUL service-to-service calls
   */
  private getInternalAuthToken(): string {
    const token = this.configService.get<string>('INTERNAL_SERVICE_TOKEN');
    if (!token) {
      throw new Error('INTERNAL_SERVICE_TOKEN not configured - required for RABTUL Payment Service');
    }
    return token;
  }

  /**
   * Make authenticated request to RABTUL Payment Service
   */
  private async callRABTULService<T>(
    endpoint: string,
    body: Record<string, unknown>,
    method: 'POST' | 'GET' = 'POST',
  ): Promise<T> {
    const token = this.getInternalAuthToken();

    const response = await fetch(`${RABTUL_PAYMENT_SERVICE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': token,
        'X-Service-Name': 'restopapa', // Identify this service to RABTUL
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new BadRequestException(
        `RABTUL Payment Service error (${response.status}): ${errorBody}`,
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Create a payment order via RABTUL Payment Service
   *
   * @param userId - User initiating the payment
   * @param amountOrPlan - Amount in INR or plan name ('starter', 'professional', 'enterprise')
   * @param currency - Currency code (default: 'INR')
   * @param purpose - Payment purpose ('subscription', 'credits', 'marketplace', 'other')
   */
  async createOrder(
    userId: string,
    amountOrPlan: number | string,
    currency = 'INR',
    purpose: string,
  ) {
    try {
      // Validate purpose
      if (!ALLOWED_PURPOSES.includes(purpose)) {
        throw new BadRequestException(`Invalid payment purpose: ${purpose}`);
      }

      // Calculate server-side amount
      let amountInPaise: number;

      if (typeof amountOrPlan === 'string') {
        // It's a plan name - get price from server
        const planPrice = PLAN_PRICES[amountOrPlan.toLowerCase()];
        if (!planPrice) {
          throw new BadRequestException(`Unknown subscription plan: ${amountOrPlan}`);
        }
        amountInPaise = planPrice * 100;
      } else {
        // Client sent raw amount - validate strictly
        if (amountOrPlan < MIN_AMOUNT) {
          throw new BadRequestException(`Amount must be at least ₹${MIN_AMOUNT}`);
        }
        if (amountOrPlan > MAX_AMOUNT) {
          throw new BadRequestException(`Amount cannot exceed ₹${MAX_AMOUNT / 100}`);
        }
        amountInPaise = Math.round(amountOrPlan * 100);
      }

      // Call RABTUL Payment Service to create order
      const idempotencyKey = `restopapa_${userId}_${Date.now()}`;
      const response = await this.callRABTULService<RABTULOrderResponse>(
        RABTUL_PAYMENT_ENDPOINTS.CREATE_ORDER,
        {
          userId,
          amount: amountInPaise,
          currency,
          purpose,
          idempotencyKey,
          metadata: {
            sourceService: 'restopapa',
            createdAt: new Date().toISOString(),
          },
        },
      );

      if (!response.success || !response.data) {
        throw new BadRequestException(response.error || 'Failed to create order in RABTUL');
      }

      // Save to local database for record keeping (RABTUL is source of truth)
      const payment = await this.prisma.payment.create({
        data: {
          userId,
          amount: amountInPaise,
          currency,
          paymentGateway: 'razorpay_via_rabtul', // Track via RABTUL
          gatewayOrderId: response.data.razorpayOrderId,
          status: 'pending',
        },
      });

      return {
        paymentId: payment.id,
        razorpayOrderId: response.data.razorpayOrderId,
        amount: response.data.amount,
        currency: response.data.currency,
        // Return client-facing key (RABTUL handles the actual key)
        key: this.configService.get('RAZORPAY_KEY_ID'),
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Payment creation failed: ${error.message}`);
    }
  }

  /**
   * Verify payment via RABTUL Payment Service
   *
   * @param paymentId - Local payment record ID
   * @param razorpayPaymentId - Razorpay payment ID from client
   * @param razorpayOrderId - Razorpay order ID
   * @param razorpaySignature - Payment signature for verification
   */
  async verifyPayment(
    paymentId: string,
    razorpayPaymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string,
  ) {
    try {
      // First verify the payment exists and is pending
      const storedPayment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!storedPayment) {
        throw new BadRequestException('Payment not found');
      }

      if (storedPayment.status === 'completed') {
        throw new BadRequestException('Payment already completed');
      }

      if (storedPayment.status === 'failed') {
        throw new BadRequestException('Payment already failed');
      }

      // Call RABTUL Payment Service to verify payment
      const response = await this.callRABTULService<RABTULVerifyResponse>(
        RABTUL_PAYMENT_ENDPOINTS.VERIFY,
        {
          paymentId: storedPayment.gatewayOrderId,
          razorpayPaymentId,
          razorpayOrderId,
          razorpaySignature,
          userId: storedPayment.userId,
        },
      );

      if (!response.success || !response.data) {
        throw new BadRequestException(response.error || 'Payment verification failed in RABTUL');
      }

      // Update local payment status
      const payment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          gatewayPaymentId: razorpayPaymentId,
          status: 'completed',
          paymentDate: new Date(),
        },
      });

      // Handle post-payment actions
      await this.handlePaymentSuccess(payment);

      return payment;
    } catch (error) {
      if (error instanceof BadRequestException) {
        // Mark payment as failed
        await this.prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'failed' },
        }).catch(() => {}); // Ignore errors in error handler
        throw error;
      }
      throw new BadRequestException(`Payment verification failed: ${error.message}`);
    }
  }

  private async handlePaymentSuccess(payment: {
    userId: string;
    subscriptionPlanId?: string;
  }) {
    // Handle different types of payments
    if (payment.subscriptionPlanId) {
      await this.activateSubscription(payment.userId, payment.subscriptionPlanId);
    }
  }

  private async activateSubscription(userId: string, subscriptionPlanId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: subscriptionPlanId },
    });

    if (!plan) return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        restaurant: {
          update: {
            subscriptionPlan: plan.name,
            subscriptionStatus: 'active',
            subscriptionExpiresAt: expiresAt,
          },
        },
      },
    });
  }

  async getPaymentHistory(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { userId },
        include: {
          subscriptionPlan: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where: { userId } }),
    ]);

    return {
      payments: payments.map(payment => ({
        ...payment,
        amount: payment.amount / 100,
      })),
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total,
      },
    };
  }

  /**
   * Process refund via RABTUL Payment Service
   *
   * @param paymentId - Local payment record ID
   * @param requestedAmount - Optional refund amount (undefined = full refund)
   * @param requestedBy - User/requesting service identifier
   */
  async refundPayment(paymentId: string, requestedAmount?: number, requestedBy?: string) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment || !payment.gatewayPaymentId) {
        throw new BadRequestException('Payment not found or not completed');
      }

      // Check for already refunded first
      if (payment.status === 'refunded') {
        throw new BadRequestException('Payment already refunded');
      }

      // Then check if completed
      if (payment.status !== 'completed') {
        throw new BadRequestException('Only completed payments can be refunded');
      }

      // Validate refund amount - must not exceed original payment
      const maxRefundAmount = payment.amount;
      let refundAmount: number;

      if (requestedAmount !== undefined) {
        refundAmount = Math.round(requestedAmount * 100);
        if (refundAmount > maxRefundAmount) {
          throw new BadRequestException(`Refund amount cannot exceed ₹${maxRefundAmount / 100}`);
        }
        if (refundAmount <= 0) {
          throw new BadRequestException('Refund amount must be positive');
        }
      } else {
        refundAmount = maxRefundAmount; // Full refund
      }

      // Call RABTUL Payment Service to process refund
      const response = await this.callRABTULService<RABTULRefundResponse>(
        RABTUL_PAYMENT_ENDPOINTS.REFUND,
        {
          paymentId: payment.gatewayOrderId,
          razorpayPaymentId: payment.gatewayPaymentId,
          amount: refundAmount,
          reason: requestedBy ? `Requested by: ${requestedBy}` : 'Customer refund',
          metadata: {
            sourceService: 'restopapa',
            requestedBy: requestedBy || 'system',
          },
        },
      );

      if (!response.success || !response.data) {
        throw new BadRequestException(response.error || 'Refund failed in RABTUL');
      }

      // Update local payment status
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'refunded',
        },
      });

      return {
        refundId: response.data.refundId,
        status: response.data.status,
        amount: response.data.amount / 100,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Refund failed: ${error.message}`);
    }
  }

  async getSubscriptionPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async createSubscriptionPlan(planData: {
    name: string;
    price: number;
    durationDays: number;
    features: string[];
  }) {
    // Validate price server-side
    if (planData.price < 0) {
      throw new BadRequestException('Price cannot be negative');
    }

    return this.prisma.subscriptionPlan.create({
      data: {
        name: planData.name,
        features: JSON.stringify(planData.features),
        price: Math.round(planData.price * 100), // Store in paise
        durationDays: planData.durationDays,
      },
    });
  }
}

import axios, { AxiosInstance } from 'axios';
import {
  Invoice,
  IInvoice,
  Subscription
} from '../models';
import {
  InvoiceStatus,
  PaymentStatus,
  SubscriptionStatus,
  DunningState
} from '../types';
import {
  generateId,
  paymentLogger as logger,
  retryWithBackoff
} from '../utils';
import { NotFoundError, ValidationError, AppError, BusinessRuleError } from '../../../../shared/rez-errors/src';

export interface PaymentIntent {
  id: string;
  amount: number;
  status: PaymentStatus;
  paymentMethodId: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
  errorCode?: string;
}

export class PaymentCollector {
  private static instance: PaymentCollector;
  private paymentServiceUrl: string;
  private httpClient: AxiosInstance;
  private serviceToken: string;

  private constructor() {
    this.paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4001';
    this.serviceToken = process.env.INTERNAL_SERVICE_TOKEN || '';

    this.httpClient = axios.create({
      baseURL: this.paymentServiceUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': this.serviceToken
      }
    });

    // Add request interceptor for logging
    this.httpClient.interceptors.request.use(
      config => {
        logger.debug('Payment service request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL
        });
        return config;
      },
      error => {
        logger.error('Payment service request error', { error });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.httpClient.interceptors.response.use(
      response => {
        logger.debug('Payment service response', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      error => {
        logger.error('Payment service response error', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): PaymentCollector {
    if (!PaymentCollector.instance) {
      PaymentCollector.instance = new PaymentCollector();
    }
    return PaymentCollector.instance;
  }

  /**
   * Create a payment intent for an invoice
   */
  async createPaymentIntent(
    invoiceId: string,
    paymentMethodId?: string
  ): Promise<PaymentIntent> {
    const invoice = await Invoice.findOne({ invoiceId });
    if (!invoice) {
      throw new NotFoundError('Invoice', invoiceId);
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BusinessRuleError('Invoice is already paid', 'INVOICE_ALREADY_PAID');
    }

    if (invoice.amountDue <= 0) {
      throw new BusinessRuleError('Invoice has no amount due', 'NO_AMOUNT_DUE');
    }

    try {
      // Call payment service to create payment intent
      const response = await this.httpClient.post('/api/payments/create-intent', {
        amount: invoice.amountDue,
        currency: invoice.currency.toLowerCase(),
        customerId: invoice.customerId,
        paymentMethodId: paymentMethodId || invoice.subscriptionId,
        metadata: {
          invoiceId: invoice.invoiceId,
          subscriptionId: invoice.subscriptionId,
          type: 'subscription'
        }
      });

      const paymentIntent: PaymentIntent = {
        id: response.data.paymentIntentId || response.data.id,
        amount: invoice.amountDue,
        status: PaymentStatus.PENDING,
        paymentMethodId: paymentMethodId || invoice.subscriptionId,
        metadata: response.data
      };

      logger.info('Payment intent created', {
        invoiceId,
        paymentIntentId: paymentIntent.id,
        amount: invoice.amountDue
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to create payment intent', {
        invoiceId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Collect payment for an invoice
   */
  async collectPayment(
    invoiceId: string,
    paymentMethodId?: string
  ): Promise<PaymentResult> {
    const invoice = await Invoice.findOne({ invoiceId });
    if (!invoice) {
      throw new NotFoundError('Invoice', invoiceId);
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return { success: true };
    }

    // Create payment intent
    const paymentIntent = await this.createPaymentIntent(invoiceId, paymentMethodId);

    // Attempt payment with retry
    return this.attemptPayment(invoice, paymentIntent);
  }

  /**
   * Attempt payment with retry logic
   */
  private async attemptPayment(
    invoice: IInvoice,
    paymentIntent: PaymentIntent
  ): Promise<PaymentResult> {
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info('Attempting payment', {
          invoiceId: invoice.invoiceId,
          attempt,
          maxRetries,
          amount: invoice.amountDue
        });

        // Call payment service to confirm payment
        const response = await this.httpClient.post('/api/payments/confirm', {
          paymentIntentId: paymentIntent.id,
          paymentMethodId: paymentIntent.paymentMethodId
        });

        const result = response.data;

        if (result.status === 'succeeded') {
          // Payment successful
          await this.handleSuccessfulPayment(invoice, paymentIntent.id);
          return { success: true, paymentIntentId: paymentIntent.id };
        } else if (result.status === 'requires_action') {
          // 3D Secure or additional action required
          return {
            success: false,
            paymentIntentId: paymentIntent.id,
            error: 'Payment requires additional authentication',
            errorCode: 'requires_action'
          };
        } else {
          // Payment failed
          throw new AppError(result.error?.message || 'Payment failed', 'PAYMENT_FAILED');
        }
      } catch (error) {
        logger.warn('Payment attempt failed', {
          invoiceId: invoice.invoiceId,
          attempt,
          error: error.message
        });

        if (attempt === maxRetries) {
          // All retries exhausted
          await this.handleFailedPayment(invoice, paymentIntent.id, error.message);
          return {
            success: false,
            paymentIntentId: paymentIntent.id,
            error: error.message
          };
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return { success: false, error: 'Max retries exceeded' };
  }

  /**
   * Handle successful payment
   */
  private async handleSuccessfulPayment(
    invoice: IInvoice,
    paymentIntentId: string
  ): Promise<void> {
    const session = invoice.constructor.db!.startSession();
    session.startTransaction();

    try {
      // Update invoice
      invoice.status = InvoiceStatus.PAID;
      invoice.paidAt = new Date();
      invoice.amountPaid = invoice.total;
      invoice.amountDue = 0;
      invoice.paymentAttempts.push({
        id: generateId('pay'),
        amount: invoice.total,
        status: PaymentStatus.SUCCEEDED,
        paymentMethodId: invoice.paymentAttempts[invoice.paymentAttempts.length - 1]?.paymentMethodId,
        paymentIntentId,
        attemptedAt: new Date()
      });
      await invoice.save({ session });

      // Update subscription
      const subscription = await Subscription.findOne({
        subscriptionId: invoice.subscriptionId
      }).session(session);

      if (subscription) {
        subscription.status = SubscriptionStatus.ACTIVE;
        subscription.lastPaymentDate = new Date();
        subscription.dunningState = DunningState.NONE;
        subscription.retryCount = 0;
        subscription.isInGracePeriod = false;
        await subscription.save({ session });
      }

      await session.commitTransaction();

      logger.info('Payment successful', {
        invoiceId: invoice.invoiceId,
        paymentIntentId,
        amount: invoice.total
      });
    } catch (error) {
      await session.abortTransaction();
      logger.error('Failed to handle successful payment', {
        invoiceId: invoice.invoiceId,
        error
      });
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Handle failed payment
   */
  private async handleFailedPayment(
    invoice: IInvoice,
    paymentIntentId: string,
    errorMessage: string
  ): Promise<void> {
    const session = invoice.constructor.db!.startSession();
    session.startTransaction();

    try {
      // Update invoice
      invoice.status = InvoiceStatus.FAILED;
      invoice.paymentAttempts.push({
        id: generateId('pay'),
        amount: invoice.amountDue,
        status: PaymentStatus.FAILED,
        paymentMethodId: invoice.paymentAttempts[invoice.paymentAttempts.length - 1]?.paymentMethodId,
        paymentIntentId,
        errorMessage,
        attemptedAt: new Date(),
        failureReason: errorMessage
      });
      await invoice.save({ session });

      // Update subscription - enter dunning
      const subscription = await Subscription.findOne({
        subscriptionId: invoice.subscriptionId
      }).session(session);

      if (subscription) {
        subscription.status = SubscriptionStatus.PAST_DUE;
        subscription.retryCount += 1;
        subscription.dunningState = subscription.retryCount === 1
          ? DunningState.FIRST_NOTICE
          : subscription.retryCount === 2
          ? DunningState.SECOND_NOTICE
          : DunningState.FINAL_NOTICE;

        subscription.dunningStartedAt = subscription.dunningStartedAt || new Date();

        // Set next retry date
        const retryDelays: Record<string, number> = {
          first_notice: 3 * 24 * 60 * 60 * 1000,
          second_notice: 5 * 24 * 60 * 60 * 1000,
          final_notice: 7 * 24 * 60 * 60 * 1000
        };
        subscription.nextRetryDate = new Date(
          Date.now() + (retryDelays[subscription.dunningState] || 3 * 24 * 60 * 60 * 1000)
        );

        // Enter grace period if applicable
        if (!subscription.isInGracePeriod && subscription.gracePeriodEnd) {
          subscription.isInGracePeriod = new Date() < subscription.gracePeriodEnd;
        }

        await subscription.save({ session });
      }

      await session.commitTransaction();

      logger.warn('Payment failed', {
        invoiceId: invoice.invoiceId,
        paymentIntentId,
        errorMessage,
        dunningState: subscription?.dunningState
      });
    } catch (error) {
      await session.abortTransaction();
      logger.error('Failed to handle failed payment', {
        invoiceId: invoice.invoiceId,
        error
      });
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Retry payment for a subscription
   */
  async retryPayment(subscriptionId: string): Promise<PaymentResult> {
    const subscription = await Subscription.findOne({ subscriptionId });
    if (!subscription) {
      throw new NotFoundError('Subscription', subscriptionId);
    }

    // Get the latest unpaid invoice
    const invoice = await Invoice.findOne({
      subscriptionId,
      status: { $in: [InvoiceStatus.FAILED, InvoiceStatus.PENDING] }
    }).sort({ createdAt: -1 });

    if (!invoice) {
      return { success: true };
    }

    return this.collectPayment(invoice.invoiceId, subscription.paymentMethodId);
  }

  /**
   * Process refund
   */
  async processRefund(
    invoiceId: string,
    amount?: number,
    reason?: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    const invoice = await Invoice.findOne({ invoiceId });
    if (!invoice) {
      throw new NotFoundError('Invoice', invoiceId);
    }

    if (invoice.status !== InvoiceStatus.PAID) {
      throw new BusinessRuleError('Can only refund paid invoices', 'CANNOT_REFUND');
    }

    const refundAmount = amount || invoice.amountPaid;

    if (refundAmount > invoice.amountPaid) {
      throw new ValidationError('Refund amount exceeds paid amount');
    }

    try {
      // Call payment service to process refund
      const response = await this.httpClient.post('/api/payments/refund', {
        paymentIntentId: invoice.paymentAttempts.find(
          p => p.status === PaymentStatus.SUCCEEDED
        )?.paymentIntentId,
        amount: refundAmount,
        reason
      });

      const refundId = response.data.refundId || response.data.id;

      // Update invoice
      invoice.amountPaid -= refundAmount;
      invoice.amountDue = invoice.total - invoice.amountPaid;

      if (invoice.amountPaid === 0) {
        invoice.status = InvoiceStatus.REFUNDED;
      } else {
        invoice.status = InvoiceStatus.PARTIALLY_PAID;
      }

      invoice.paymentAttempts.push({
        id: generateId('refund'),
        amount: -refundAmount,
        status: PaymentStatus.REFUNDED,
        attemptedAt: new Date()
      });

      await invoice.save();

      logger.info('Refund processed', {
        invoiceId,
        refundId,
        amount: refundAmount
      });

      return { success: true, refundId };
    } catch (error) {
      logger.error('Refund failed', {
        invoiceId,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Void an invoice
   */
  async voidInvoice(invoiceId: string, reason: string): Promise<void> {
    const invoice = await Invoice.findOne({ invoiceId });
    if (!invoice) {
      throw new NotFoundError('Invoice', invoiceId);
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BusinessRuleError('Cannot void a paid invoice. Process a refund instead.', 'CANNOT_VOID_PAID');
    }

    await invoice.void(reason);

    logger.info('Invoice voided', { invoiceId, reason });
  }

  /**
   * Get payment methods for a customer
   */
  async getPaymentMethods(customerId: string): Promise<unknown[]> {
    try {
      const response = await this.httpClient.get(`/api/customers/${customerId}/payment-methods`);
      return response.data.paymentMethods || [];
    } catch (error) {
      logger.error('Failed to get payment methods', {
        customerId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Add payment method for a customer
   */
  async addPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.httpClient.post(`/api/customers/${customerId}/payment-methods`, {
        paymentMethodId
      });

      logger.info('Payment method added', { customerId, paymentMethodId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to add payment method', {
        customerId,
        paymentMethodId,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle webhook from payment service
   */
  async handleWebhook(event: {
    type: string;
    data: {
      object: {
        id: string;
        status: string;
        amount: number;
        metadata?: Record<string, unknown>;
      };
    };
  }): Promise<void> {
    const { type, data } = event;
    const paymentIntent = data.object;

    logger.info('Received payment webhook', { type, paymentIntentId: paymentIntent.id });

    switch (type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(paymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(paymentIntent);
        break;
      case 'refund.created':
        await this.handleRefundCreated(paymentIntent);
        break;
      default:
        logger.debug('Unhandled webhook event type', { type });
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent): Promise<void> {
    const metadata = paymentIntent.metadata || {};
    const invoiceId = metadata.invoiceId;

    if (!invoiceId) {
      logger.warn('Payment webhook missing invoice ID');
      return;
    }

    const invoice = await Invoice.findOne({ invoiceId });
    if (!invoice || invoice.status === InvoiceStatus.PAID) {
      return;
    }

    await this.handleSuccessfulPayment(invoice, paymentIntent.id);
  }

  private async handlePaymentIntentFailed(paymentIntent): Promise<void> {
    const metadata = paymentIntent.metadata || {};
    const invoiceId = metadata.invoiceId;

    if (!invoiceId) {
      logger.warn('Payment webhook missing invoice ID');
      return;
    }

    const invoice = await Invoice.findOne({ invoiceId });
    if (!invoice) {
      return;
    }

    await this.handleFailedPayment(
      invoice,
      paymentIntent.id,
      paymentIntent.last_payment_error?.message || 'Payment failed'
    );
  }

  private async handleRefundCreated(paymentIntent): Promise<void> {
    logger.info('Refund created via webhook', {
      refundId: paymentIntent.id,
      amount: paymentIntent.amount
    });
  }
}

// Export singleton instance
export const paymentCollector = PaymentCollector.getInstance();

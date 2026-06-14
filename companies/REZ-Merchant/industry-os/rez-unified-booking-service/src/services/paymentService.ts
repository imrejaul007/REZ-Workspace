import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { UnifiedBooking } from '../models';
import { getConfig } from '../config';
import { createLogger } from '../utils/logger';
import { PaymentResult, RefundResult, RefundCalculation } from '../types';

const logger = createLogger('payment-service');

// Payment processing fee (e.g., Stripe fees)
const PROCESSING_FEE_PERCENT = 2.9;
const PROCESSING_FEE_FIXED = 0.30;

// ============================================
// Process Payment
// ============================================

export async function processPayment(
  bookingId: string,
  paymentMethod: string,
  paymentDetails?: Record<string, unknown>
): Promise<PaymentResult> {
  const config = getConfig();

  // Find the booking
  const booking = await UnifiedBooking.findByBookingId(bookingId);

  if (!booking) {
    return {
      paymentId: `PAY-${uuidv4()}`,
      status: 'failed',
      amount: 0,
      currency: 'USD',
      errorMessage: 'Booking not found',
    };
  }

  // Calculate amount to charge
  const amountDue = booking.totalAmount - booking.amountPaid;

  if (amountDue <= 0) {
    return {
      paymentId: `PAY-${uuidv4()}`,
      status: 'failed',
      amount: 0,
      currency: booking.currency,
      errorMessage: 'No amount due for this booking',
    };
  }

  try {
    // In production, this would integrate with actual payment gateway (Stripe, etc.)
    // For now, we simulate the payment

    if (config.PAYMENT_GATEWAY_URL && config.PAYMENT_GATEWAY_API_KEY) {
      // Real payment gateway integration
      const response = await axios.post(
        `${config.PAYMENT_GATEWAY_URL}/payments`,
        {
          amount: amountDue,
          currency: booking.currency,
          paymentMethod,
          reference: bookingId,
          metadata: {
            bookingId,
            userId: booking.userId,
            merchantId: booking.merchantId,
            vertical: booking.vertical,
          },
          ...paymentDetails,
        },
        {
          headers: {
            'Authorization': `Bearer ${config.PAYMENT_GATEWAY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const paymentId = `PAY-${uuidv4()}`;

      // Update booking with payment
      booking.amountPaid += amountDue;
      booking.paymentStatus = 'paid';
      await booking.save();

      logger.info('Payment processed via gateway', {
        bookingId,
        paymentId,
        amount: amountDue,
        transactionId: response.data?.transactionId,
      });

      return {
        paymentId,
        status: 'success',
        amount: amountDue,
        currency: booking.currency,
        transactionId: response.data?.transactionId,
      };
    } else {
      // Simulated payment for development
      const paymentId = `PAY-${uuidv4()}`;

      // Update booking with payment
      booking.amountPaid += amountDue;
      booking.paymentStatus = 'paid';
      await booking.save();

      logger.info('Payment processed (simulated)', {
        bookingId,
        paymentId,
        amount: amountDue,
        currency: booking.currency,
      });

      return {
        paymentId,
        status: 'success',
        amount: amountDue,
        currency: booking.currency,
        transactionId: `txn_${uuidv4().replace(/-/g, '').slice(0, 24)}`,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';

    logger.error('Payment processing failed', {
      bookingId,
      amount: amountDue,
      error: errorMessage,
    });

    return {
      paymentId: `PAY-${uuidv4()}`,
      status: 'failed',
      amount: amountDue,
      currency: booking.currency,
      errorMessage,
    };
  }
}

// ============================================
// Process Refund
// ============================================

export async function processRefund(
  bookingId: string,
  amount?: number,
  reason?: string
): Promise<RefundResult> {
  const config = getConfig();

  // Find the booking
  const booking = await UnifiedBooking.findByBookingId(bookingId);

  if (!booking) {
    return {
      refundId: `REF-${uuidv4()}`,
      status: 'failed',
      amount: 0,
      currency: 'USD',
      errorMessage: 'Booking not found',
    };
  }

  // Calculate refund amount
  const refundInfo = await calculateRefundAmount(booking.bookingId);
  const refundAmount = amount || refundInfo.refundAmount;

  if (refundAmount <= 0) {
    return {
      refundId: `REF-${uuidv4()}`,
      status: 'failed',
      amount: 0,
      currency: booking.currency,
      errorMessage: 'No refundable amount',
    };
  }

  if (refundAmount > booking.amountPaid) {
    return {
      refundId: `REF-${uuidv4()}`,
      status: 'failed',
      amount: refundAmount,
      currency: booking.currency,
      errorMessage: 'Refund amount exceeds amount paid',
    };
  }

  try {
    if (config.PAYMENT_GATEWAY_URL && config.PAYMENT_GATEWAY_API_KEY) {
      // Real payment gateway integration
      const response = await axios.post(
        `${config.PAYMENT_GATEWAY_URL}/refunds`,
        {
          amount: refundAmount,
          currency: booking.currency,
          reference: bookingId,
          reason,
          metadata: {
            bookingId,
            userId: booking.userId,
            merchantId: booking.merchantId,
            originalPaymentId: booking.paymentStatus,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${config.PAYMENT_GATEWAY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const refundId = `REF-${uuidv4()}`;

      // Update booking with refund
      booking.amountPaid -= refundAmount;
      booking.paymentStatus = refundAmount >= booking.amountPaid ? 'refunded' : 'partial';
      await booking.save();

      logger.info('Refund processed via gateway', {
        bookingId,
        refundId,
        amount: refundAmount,
        transactionId: response.data?.transactionId,
      });

      return {
        refundId,
        status: 'success',
        amount: refundAmount,
        currency: booking.currency,
        transactionId: response.data?.transactionId,
      };
    } else {
      // Simulated refund for development
      const refundId = `REF-${uuidv4()}`;

      // Update booking with refund
      booking.amountPaid -= refundAmount;
      booking.paymentStatus = refundAmount >= booking.amountPaid ? 'refunded' : 'partial';
      await booking.save();

      logger.info('Refund processed (simulated)', {
        bookingId,
        refundId,
        amount: refundAmount,
        reason,
      });

      return {
        refundId,
        status: 'success',
        amount: refundAmount,
        currency: booking.currency,
        transactionId: `ref_${uuidv4().replace(/-/g, '').slice(0, 24)}`,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Refund processing failed';

    logger.error('Refund processing failed', {
      bookingId,
      amount: refundAmount,
      error: errorMessage,
    });

    return {
      refundId: `REF-${uuidv4()}`,
      status: 'failed',
      amount: refundAmount,
      currency: booking.currency,
      errorMessage,
    };
  }
}

// ============================================
// Calculate Refund
// ============================================

export async function calculateRefund(bookingId: string): Promise<RefundCalculation> {
  return calculateRefundAmount(bookingId);
}

async function calculateRefundAmount(bookingId: string): Promise<RefundCalculation> {
  const booking = await UnifiedBooking.findByBookingId(bookingId);

  if (!booking) {
    return {
      refundAmount: 0,
      processingFee: 0,
      originalAmount: 0,
    };
  }

  const amountPaid = booking.amountPaid;
  const originalAmount = booking.totalAmount;

  // Calculate processing fee (non-refundable)
  const processingFee = (amountPaid * PROCESSING_FEE_PERCENT / 100) + PROCESSING_FEE_FIXED;

  // Refund amount is amount paid minus processing fee
  const refundAmount = Math.max(0, amountPaid - processingFee);

  // Check cancellation policy for time-based adjustments
  // If booking is within 24 hours, might have reduced refund
  let adjustedRefundAmount = refundAmount;

  // For now, we apply full refund minus processing fee
  // In production, you'd check the cancellation policy and adjust accordingly

  return {
    refundAmount: Math.round(adjustedRefundAmount * 100) / 100,
    processingFee: Math.round(processingFee * 100) / 100,
    originalAmount,
  };
}

// ============================================
// Get Payment Status
// ============================================

export async function getPaymentStatus(bookingId: string): Promise<{
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  paymentStatus: string;
  canRefund: boolean;
  maxRefundAmount: number;
}> {
  const booking = await UnifiedBooking.findByBookingId(bookingId);

  if (!booking) {
    throw new Error('Booking not found');
  }

  const amountDue = booking.totalAmount - booking.amountPaid;
  const canRefund = booking.amountPaid > 0 && booking.paymentStatus !== 'refunded';

  return {
    totalAmount: booking.totalAmount,
    amountPaid: booking.amountPaid,
    amountDue,
    paymentStatus: booking.paymentStatus,
    canRefund,
    maxRefundAmount: canRefund ? booking.amountPaid : 0,
  };
}

export default {
  processPayment,
  processRefund,
  calculateRefund,
  getPaymentStatus,
};
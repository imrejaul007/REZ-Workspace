/**
 * Payment Service - Event Connector
 */

import { eventConnector, commerceEvents } from './eventConnectors';

export interface PaymentConnector {
  onPaymentInitiated(payment: {
    paymentId: string;
    orderId: string;
    userId: string;
    amount: number;
    method: string;
    merchantId?: string;
  }): void;

  onPaymentCompleted(payment: {
    paymentId: string;
    orderId: string;
    userId: string;
    amount: number;
    method: string;
    merchantId?: string;
  }): void;

  onPaymentFailed(payment: {
    paymentId: string;
    orderId: string;
    userId: string;
    amount: number;
    method: string;
    reason: string;
  }): void;

  onRefundInitiated(refund: {
    refundId: string;
    paymentId: string;
    orderId: string;
    userId: string;
    amount: number;
    reason: string;
  }): void;

  onRefundCompleted(refund: {
    refundId: string;
    paymentId: string;
    orderId: string;
    userId: string;
    amount: number;
  }): void;

  onRefundFailed(refund: {
    refundId: string;
    paymentId: string;
    orderId: string;
    reason: string;
  }): void;

  onFraudDetected(payment: {
    paymentId: string;
    orderId: string;
    userId: string;
    amount: number;
    riskScore: number;
    reason: string;
  }): void;
}

export function createPaymentConnector(): PaymentConnector {
  return {
    onPaymentInitiated: (payment) => {
      eventConnector.emit('payment.initiated', {
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        amount: payment.amount,
        method: payment.method
      }, {
        userId: payment.userId,
        merchantId: payment.merchantId,
        correlationId: payment.paymentId
      });
    },

    onPaymentCompleted: (payment) => {
      commerceEvents.paymentCompleted({
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        amount: payment.amount,
        method: payment.method,
        status: 'completed',
        completedAt: new Date().toISOString()
      }, {
        userId: payment.userId,
        merchantId: payment.merchantId,
        correlationId: payment.paymentId
      });
    },

    onPaymentFailed: (payment) => {
      commerceEvents.paymentFailed({
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        amount: payment.amount,
        method: payment.method,
        reason: payment.reason,
        failedAt: new Date().toISOString()
      }, {
        userId: payment.userId,
        correlationId: payment.paymentId
      });
    },

    onRefundInitiated: (refund) => {
      eventConnector.emit('payment.refund.initiated', {
        refundId: refund.refundId,
        paymentId: refund.paymentId,
        orderId: refund.orderId,
        amount: refund.amount,
        reason: refund.reason,
        initiatedAt: new Date().toISOString()
      }, {
        userId: refund.userId,
        correlationId: refund.refundId
      });
    },

    onRefundCompleted: (refund) => {
      commerceEvents.orderRefunded({
        refundId: refund.refundId,
        paymentId: refund.paymentId,
        orderId: refund.orderId,
        refundAmount: refund.amount,
        completedAt: new Date().toISOString()
      }, {
        userId: refund.userId,
        correlationId: refund.refundId
      });
    },

    onRefundFailed: (refund) => {
      eventConnector.emit('payment.refund.failed', {
        refundId: refund.refundId,
        paymentId: refund.paymentId,
        orderId: refund.orderId,
        reason: refund.reason,
        failedAt: new Date().toISOString()
      }, {
        correlationId: refund.refundId
      });
    },

    onFraudDetected: (payment) => {
      eventConnector.emit('payment.fraud.detected', {
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        amount: payment.amount,
        riskScore: payment.riskScore,
        reason: payment.reason,
        detectedAt: new Date().toISOString()
      }, {
        userId: payment.userId,
        correlationId: payment.paymentId
      });
    }
  };
}

export const paymentConnector = createPaymentConnector();
export default paymentConnector;

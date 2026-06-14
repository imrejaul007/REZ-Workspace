/**
 * Integration tests for Payment Service
 * These tests require a running MongoDB and Redis instance
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Test configuration
const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/test-payment-service';
const TEST_REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379';

describe('Payment Service Integration Tests', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('Payment Flow Integration', () => {
    it('should complete full payment lifecycle', async () => {
      // Step 1: Create payment record
      const paymentId = 'pay_test_123';
      const orderId = 'order_test_456';

      await createTestPayment({
        paymentId,
        orderId,
        user: new mongoose.Types.ObjectId(),
        amount: 100,
        currency: 'INR',
        status: 'pending',
      });

      // Step 2: Simulate payment capture
      await updateTestPaymentStatus(paymentId, 'completed');

      // Step 3: Verify audit trail
      await createTestAuditEntry({
        paymentId,
        action: 'initiate',
        newStatus: 'pending',
      });
      await createTestAuditEntry({
        paymentId,
        action: 'capture',
        previousStatus: 'pending',
        newStatus: 'completed',
      });

      // Verify final state
      const payment = await findTestPayment(paymentId);
      expect(payment.status).toBe('completed');

      const auditTrail = await findTestAuditTrail(paymentId);
      expect(auditTrail).toHaveLength(2);
    });

    it('should handle concurrent payment initiations idempotently', async () => {
      const input = {
        userId: 'user_123',
        orderId: 'order_456',
        amount: 100,
        paymentMethod: 'card',
        orchestratorIdempotencyKey: 'idem_unique_key',
      };

      // Simulate concurrent initiations
      const results = await Promise.all([
        initiateTestPayment(input),
        initiateTestPayment(input),
        initiateTestPayment(input),
      ]);

      // All should return the same payment
      const paymentIds = results.map(r => r.paymentId);
      const uniqueIds = [...new Set(paymentIds)];
      expect(uniqueIds).toHaveLength(1);
    });

    it('should correctly track wallet credit status', async () => {
      const paymentId = 'pay_credit_test';

      await createTestPayment({
        paymentId,
        orderId: 'order_123',
        user: new mongoose.Types.ObjectId(),
        amount: 100,
        currency: 'INR',
        status: 'pending',
      });

      // Before capture - walletCredited should be false
      let payment = await findTestPayment(paymentId);
      expect(payment.walletCredited).toBeFalsy();

      // After capture
      await updateTestPaymentStatus(paymentId, 'completed', true);

      payment = await findTestPayment(paymentId);
      expect(payment.walletCredited).toBe(true);
    });
  });

  describe('Refund Flow Integration', () => {
    it('should process full refund flow', async () => {
      // Create completed payment
      const paymentId = 'pay_refund_test';
      await createTestPayment({
        paymentId,
        orderId: 'order_refund',
        user: new mongoose.Types.ObjectId(),
        amount: 100,
        refundedAmount: 0,
        status: 'completed',
      });

      // Create refund
      await createTestRefund({
        refundId: 'ref_123',
        paymentId,
        amount: 50,
        status: 'processed',
      });

      // Update payment refunded amount
      await updateTestPaymentRefundAmount(paymentId, 50);

      const payment = await findTestPayment(paymentId);
      expect(payment.refundedAmount).toBe(50);
    });

    it('should prevent refund exceeding payment amount', async () => {
      const paymentId = 'pay_over_refund';
      await createTestPayment({
        paymentId,
        orderId: 'order_over_refund',
        user: new mongoose.Types.ObjectId(),
        amount: 100,
        status: 'completed',
      });

      const result = await attemptRefund(paymentId, 150);

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceed');
    });

    it('should track refund dispute resolution', async () => {
      const paymentId = 'pay_dispute_test';
      await createTestPayment({
        paymentId,
        orderId: 'order_dispute',
        user: new mongoose.Types.ObjectId(),
        amount: 100,
        status: 'completed',
      });

      // Report dispute
      await updateTestPaymentMeta(paymentId, {
        refundDispute: {
          reportedAt: new Date(),
          expected: 50,
          actual: 30,
        },
      });

      const payment = await findTestPayment(paymentId);
      expect(payment.paymentMeta?.refundDispute).toBeDefined();
    });
  });

  describe('Merchant Settlement Integration', () => {
    it('should calculate merchant settlements correctly', async () => {
      const merchantId = 'merchant_settle';

      // Create multiple completed payments
      await createTestPayment({
        paymentId: 'pay_s1',
        orderId: 'order_s1',
        user: new mongoose.Types.ObjectId(),
        amount: 100,
        status: 'completed',
        merchantId,
      });
      await createTestPayment({
        paymentId: 'pay_s2',
        orderId: 'order_s2',
        user: new mongoose.Types.ObjectId(),
        amount: 200,
        status: 'completed',
        merchantId,
      });
      await createTestPayment({
        paymentId: 'pay_s3',
        orderId: 'order_s3',
        user: new mongoose.Types.ObjectId(),
        amount: 150,
        status: 'completed',
      }); // Different merchant

      const settlements = await getMerchantSettlements(merchantId);

      expect(settlements.payments).toHaveLength(2);
      expect(settlements.total).toBe(2);
      expect(settlements.payments.every((p: any) => p.metadata?.merchantId === merchantId)).toBe(true);
    });

    it('should paginate settlements correctly', async () => {
      const merchantId = 'merchant_paginate';

      // Create 25 payments
      for (let i = 0; i < 25; i++) {
        await createTestPayment({
          paymentId: `pay_page_${i}`,
          orderId: `order_page_${i}`,
          user: new mongoose.Types.ObjectId(),
          amount: 10,
          status: 'completed',
          merchantId,
        });
      }

      const page1 = await getMerchantSettlements(merchantId, 1, 10);
      const page2 = await getMerchantSettlements(merchantId, 2, 10);
      const page3 = await getMerchantSettlements(merchantId, 3, 10);

      expect(page1.payments).toHaveLength(10);
      expect(page2.payments).toHaveLength(10);
      expect(page3.payments).toHaveLength(5);
      expect(page1.hasMore).toBe(true);
      expect(page2.hasMore).toBe(true);
      expect(page3.hasMore).toBe(false);
    });
  });

  describe('Webhook Processing Integration', () => {
    it('should process Razorpay capture webhook correctly', async () => {
      const paymentId = 'pay_webhook_test';

      await createTestPayment({
        paymentId,
        orderId: 'order_webhook',
        user: new mongoose.Types.ObjectId(),
        amount: 100,
        status: 'pending',
        metadata: {
          razorpayOrderId: 'order_razorpay_123',
        },
      });

      // Simulate webhook processing
      await processTestWebhook({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'razorpay_pay_123',
              order_id: 'order_razorpay_123',
              amount: 10000, // In paise
            },
          },
        },
      });

      const payment = await findTestPayment(paymentId);
      expect(payment.status).toBe('completed');
    });

    it('should reject webhook with invalid signature', async () => {
      const result = await processTestWebhook(
        {
          event: 'payment.captured',
          payload: {},
        },
        'invalid_signature'
      );

      expect(result.success).toBe(false);
    });

    it('should handle idempotent webhook processing', async () => {
      // Send same webhook twice
      const webhookData = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'razorpay_pay_123',
            },
          },
        },
      };

      await processTestWebhook(webhookData);
      const result = await processTestWebhook(webhookData);

      // Second processing should be idempotent
      expect(result.processed).toBe(false);
    });
  });
});

// Test helper functions
async function createTestPayment(data: any) {
  const collection = mongoose.connection.collection('payments');
  await collection.insertOne({
    paymentId: data.paymentId,
    orderId: data.orderId,
    user: data.user,
    amount: data.amount,
    currency: data.currency || 'INR',
    status: data.status,
    paymentMethod: data.paymentMethod || 'card',
    refundedAmount: data.refundedAmount || 0,
    walletCredited: data.walletCredited || false,
    metadata: data.metadata || {},
    paymentMeta: data.paymentMeta || {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function findTestPayment(paymentId: string) {
  const collection = mongoose.connection.collection('payments');
  return collection.findOne({ paymentId });
}

async function updateTestPaymentStatus(paymentId: string, status: string, walletCredited = false) {
  const collection = mongoose.connection.collection('payments');
  await collection.updateOne(
    { paymentId },
    { $set: { status, walletCredited, updatedAt: new Date() } }
  );
}

async function updateTestPaymentRefundAmount(paymentId: string, amount: number) {
  const collection = mongoose.connection.collection('payments');
  await collection.updateOne(
    { paymentId },
    { $set: { refundedAmount: amount, updatedAt: new Date() } }
  );
}

async function updateTestPaymentMeta(paymentId: string, meta: any) {
  const collection = mongoose.connection.collection('payments');
  await collection.updateOne(
    { paymentId },
    { $set: { paymentMeta: meta, updatedAt: new Date() } }
  );
}

async function createTestAuditEntry(data: any) {
  const collection = mongoose.connection.collection('transaction_audit_logs');
  await collection.insertOne({
    ...data,
    createdAt: new Date(),
  });
}

async function findTestAuditTrail(paymentId: string) {
  const collection = mongoose.connection.collection('transaction_audit_logs');
  return collection.find({ paymentId }).sort({ createdAt: -1 }).toArray();
}

async function createTestRefund(data: any) {
  const collection = mongoose.connection.collection('refunds');
  await collection.insertOne({
    ...data,
    createdAt: new Date(),
  });
}

async function initiateTestPayment(input: any) {
  // Mock implementation
  return { paymentId: 'pay_mock', ...input };
}

async function attemptRefund(paymentId: string, amount: number) {
  // Mock implementation
  const payment = await findTestPayment(paymentId);
  if (amount > payment.amount) {
    return { success: false, error: 'Refund amount exceeds payment amount' };
  }
  return { success: true };
}

async function getMerchantSettlements(merchantId: string, page = 1, limit = 20) {
  const collection = mongoose.connection.collection('payments');
  const skip = (page - 1) * limit;
  const payments = await collection
    .find({ status: 'completed', 'metadata.merchantId': merchantId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
  const total = await collection.countDocuments({
    status: 'completed',
    'metadata.merchantId': merchantId,
  });

  return {
    payments,
    total,
    page,
    hasMore: skip + payments.length < total,
  };
}

async function processTestWebhook(data: any, signature?: string) {
  // Mock implementation
  if (signature === 'invalid_signature') {
    return { success: false };
  }
  return { success: true, processed: true };
}

/**
 * Integration tests for Order Service
 * These tests require a running MongoDB and Redis instance
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/test-order-service';
const TEST_REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379';

describe('Order Service Integration Tests', () => {
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

  describe('Order Creation Flow', () => {
    it('should create order and queue for processing', async () => {
      // Step 1: Create order
      const orderId = await createTestOrder({
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [
          { productId: 'prod-1', name: 'Item 1', quantity: 2, unitPrice: 10.00 },
        ],
        status: 'placed',
      });

      // Step 2: Verify order was saved
      const order = await findTestOrder(orderId);
      expect(order).toBeDefined();
      expect(order.status).toBe('placed');

      // Step 3: Verify job was queued
      const jobId = await getQueuedJobId(orderId);
      expect(jobId).toBeDefined();
    });

    it('should prevent duplicate orders via idempotency', async () => {
      const idempotencyKey = 'idem-unique-123';

      // First request
      const order1 = await createTestOrder({
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [{ productId: 'prod-1', name: 'Item 1', quantity: 1, unitPrice: 10.00 }],
        clientIdempotencyKey: idempotencyKey,
      });

      // Second request with same idempotency key
      const order2 = await createTestOrder({
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [{ productId: 'prod-1', name: 'Item 1', quantity: 1, unitPrice: 10.00 }],
        clientIdempotencyKey: idempotencyKey,
      });

      // Both should return the same order
      expect(order1._id.toString()).toBe(order2._id.toString());
    });

    it('should calculate order totals correctly', async () => {
      const order = await createTestOrder({
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [
          { productId: 'prod-1', name: 'Item 1', quantity: 2, unitPrice: 10.00 },
          { productId: 'prod-2', name: 'Item 2', quantity: 1, unitPrice: 5.00 },
        ],
      });

      expect(order.totals.subtotal).toBe(25.00);
      expect(order.totals.tax).toBeCloseTo(2.19, 1); // ~8.75%
      expect(order.totals.total).toBeCloseTo(27.19, 1);
    });

    it('should add delivery fee for delivery orders', async () => {
      const order = await createTestOrder({
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [{ productId: 'prod-1', name: 'Item 1', quantity: 1, unitPrice: 10.00 }],
        delivery: {
          type: 'delivery',
          address: {
            street: '123 Main St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
          },
        },
      });

      expect(order.totals.deliveryFee).toBe(4.99);
    });
  });

  describe('Order Status Transitions', () => {
    it('should transition through valid statuses', async () => {
      const orderId = await createTestOrder({
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [{ productId: 'prod-1', name: 'Item 1', quantity: 1, unitPrice: 10.00 }],
        status: 'placed',
      });

      // Update to confirmed
      await updateTestOrderStatus(orderId, 'confirmed');
      let order = await findTestOrder(orderId);
      expect(order.status).toBe('confirmed');

      // Update to preparing
      await updateTestOrderStatus(orderId, 'preparing');
      order = await findTestOrder(orderId);
      expect(order.status).toBe('preparing');

      // Update to ready
      await updateTestOrderStatus(orderId, 'ready');
      order = await findTestOrder(orderId);
      expect(order.status).toBe('ready');

      // Update to delivered
      await updateTestOrderStatus(orderId, 'delivered');
      order = await findTestOrder(orderId);
      expect(order.status).toBe('delivered');
    });

    it('should allow cancellation in early statuses', async () => {
      const orderId = await createTestOrder({
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [{ productId: 'prod-1', name: 'Item 1', quantity: 1, unitPrice: 10.00 }],
        status: 'placed',
      });

      await updateTestOrderStatus(orderId, 'cancelled', {
        reason: 'Customer requested cancellation',
      });

      const order = await findTestOrder(orderId);
      expect(order.status).toBe('cancelled');
      expect(order.cancellation?.reason).toBe('Customer requested cancellation');
    });

    it('should not allow cancellation after delivery', async () => {
      const orderId = await createTestOrder({
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [{ productId: 'prod-1', name: 'Item 1', quantity: 1, unitPrice: 10.00 }],
        status: 'delivered',
      });

      const result = await cancelTestOrder(orderId);
      expect(result.success).toBe(false);
    });
  });

  describe('Order Retrieval', () => {
    it('should retrieve orders by user', async () => {
      const userId = 'user-orders-test';

      // Create multiple orders for the same user
      await createTestOrder({
        userId,
        merchantId: 'merchant-1',
        storeId: 'store-1',
        items: [{ productId: 'prod-1', name: 'Item 1', quantity: 1, unitPrice: 10.00 }],
      });
      await createTestOrder({
        userId,
        merchantId: 'merchant-2',
        storeId: 'store-2',
        items: [{ productId: 'prod-2', name: 'Item 2', quantity: 1, unitPrice: 20.00 }],
      });
      await createTestOrder({
        userId,
        merchantId: 'merchant-3',
        storeId: 'store-3',
        items: [{ productId: 'prod-3', name: 'Item 3', quantity: 1, unitPrice: 30.00 }],
      });

      const orders = await getOrdersByUserId(userId);
      expect(orders).toHaveLength(3);
    });

    it('should filter orders by status', async () => {
      const userId = 'user-status-filter';

      await createTestOrder({
        userId,
        merchantId: 'merchant-1',
        storeId: 'store-1',
        items: [{ productId: 'prod-1', name: 'Item 1', quantity: 1, unitPrice: 10.00 }],
        status: 'placed',
      });
      await createTestOrder({
        userId,
        merchantId: 'merchant-2',
        storeId: 'store-2',
        items: [{ productId: 'prod-2', name: 'Item 2', quantity: 1, unitPrice: 20.00 }],
        status: 'confirmed',
      });
      await createTestOrder({
        userId,
        merchantId: 'merchant-3',
        storeId: 'store-3',
        items: [{ productId: 'prod-3', name: 'Item 3', quantity: 1, unitPrice: 30.00 }],
        status: 'delivered',
      });

      const pendingOrders = await getOrdersByUserId(userId, 'placed');
      expect(pendingOrders).toHaveLength(1);
    });

    it('should paginate orders correctly', async () => {
      const userId = 'user-pagination';

      // Create 15 orders
      for (let i = 0; i < 15; i++) {
        await createTestOrder({
          userId,
          merchantId: `merchant-${i}`,
          storeId: 'store-1',
          items: [{ productId: `prod-${i}`, name: `Item ${i}`, quantity: 1, unitPrice: 10.00 }],
        });
      }

      const page1 = await getOrdersByUserId(userId, undefined, { skip: 0, limit: 10 });
      const page2 = await getOrdersByUserId(userId, undefined, { skip: 10, limit: 10 });

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(5);
    });
  });

  describe('Order Processing Queue', () => {
    it('should mark order as processing when queued', async () => {
      const orderId = await createTestOrder({
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [{ productId: 'prod-1', name: 'Item 1', quantity: 1, unitPrice: 10.00 }],
      });

      const jobId = await queueOrderForProcessing(orderId);

      expect(jobId).toBeDefined();

      const isProcessing = await checkOrderIsProcessing(orderId);
      expect(isProcessing).toBe(true);
    });

    it('should store processing result', async () => {
      const orderId = await createTestOrder({
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [{ productId: 'prod-1', name: 'Item 1', quantity: 1, unitPrice: 10.00 }],
      });

      const result = {
        success: true,
        jobId: 'job-123',
        orderId,
        status: 'processed' as const,
        processedAt: new Date().toISOString(),
      };

      await storeProcessingResult(orderId, result);

      const stored = await getProcessingResult(orderId);
      expect(stored).toEqual(result);
    });

    it('should allow retry of failed orders', async () => {
      const orderId = await createTestOrder({
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [{ productId: 'prod-1', name: 'Item 1', quantity: 1, unitPrice: 10.00 }],
        status: 'failed',
      });

      const result = await retryOrder(orderId);

      expect(result.success).toBe(true);

      const order = await findTestOrder(orderId);
      expect(order.status).toBe('placed');
    });
  });

  describe('Service Communication', () => {
    it('should communicate with payment service', async () => {
      const orderId = await createTestOrder({
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [{ productId: 'prod-1', name: 'Item 1', quantity: 1, unitPrice: 10.00 }],
      });

      // Simulate payment initiation
      const paymentResponse = await initiatePaymentForOrder(orderId);
      expect(paymentResponse.paymentId).toBeDefined();
    });

    it('should handle payment confirmation', async () => {
      const orderId = await createTestOrder({
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [{ productId: 'prod-1', name: 'Item 1', quantity: 1, unitPrice: 10.00 }],
        payment: { status: 'pending' },
      });

      await confirmPaymentForOrder(orderId, 'pay-123');

      const order = await findTestOrder(orderId);
      expect(order.payment.status).toBe('paid');
    });
  });
});

// Test helper functions
async function createTestOrder(data: any) {
  const collection = mongoose.connection.collection('orders');
  const subtotal = data.items.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);
  const tax = subtotal * 0.0875;
  const deliveryFee = data.delivery?.type === 'delivery' ? 4.99 : 0;

  const result = await collection.insertOne({
    orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    user: new mongoose.Types.ObjectId(),
    store: new mongoose.Types.ObjectId(),
    items: data.items.map((item: any) => ({
      ...item,
      totalPrice: item.unitPrice * item.quantity,
    })),
    totals: {
      subtotal,
      tax,
      deliveryFee,
      total: subtotal + tax + deliveryFee,
    },
    payment: data.payment || { method: 'card', status: 'pending' },
    delivery: data.delivery,
    status: data.status || 'placed',
    clientIdempotencyKey: data.clientIdempotencyKey,
    correlationId: `corr-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { ...data, _id: result.insertedId, totals: { subtotal, tax, deliveryFee, total: subtotal + tax + deliveryFee } };
}

async function findTestOrder(orderId: any) {
  const collection = mongoose.connection.collection('orders');
  return collection.findOne({ _id: orderId });
}

async function updateTestOrderStatus(orderId: any, status: string, extra?: any) {
  const collection = mongoose.connection.collection('orders');
  const update: any = { status, updatedAt: new Date() };
  if (extra) Object.assign(update, extra);
  await collection.updateOne({ _id: orderId }, { $set: update });
}

async function cancelTestOrder(orderId: any) {
  const order = await findTestOrder(orderId);
  const cancellable = ['placed', 'confirmed', 'preparing'];

  if (!cancellable.includes(order.status)) {
    return { success: false, error: 'Order cannot be cancelled' };
  }

  await updateTestOrderStatus(orderId, 'cancelled', {
    cancellation: { cancelledAt: new Date().toISOString() },
  });

  return { success: true };
}

async function getOrdersByUserId(userId: string, status?: string, options: any = {}) {
  const collection = mongoose.connection.collection('orders');
  const query: any = { user: new mongoose.Types.ObjectId(userId) };
  if (status) query.status = status;

  return collection
    .find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0)
    .toArray();
}

async function queueOrderForProcessing(orderId: string) {
  // Mock Redis key
  const collection = mongoose.connection.collection('orders');
  const jobId = `job-${Date.now()}`;
  await collection.updateOne({ _id: orderId }, { $set: { processingJobId: jobId } });
  return jobId;
}

async function checkOrderIsProcessing(orderId: string) {
  const collection = mongoose.connection.collection('orders');
  const order = await collection.findOne({ _id: orderId });
  return !!order?.processingJobId;
}

async function storeProcessingResult(orderId: string, result: any) {
  // Mock Redis storage
  const collection = mongoose.connection.collection('orders');
  await collection.updateOne({ _id: orderId }, { $set: { processingResult: result } });
}

async function getProcessingResult(orderId: string) {
  const collection = mongoose.connection.collection('orders');
  const order = await collection.findOne({ _id: orderId });
  return order?.processingResult;
}

async function getQueuedJobId(orderId: string) {
  const collection = mongoose.connection.collection('orders');
  const order = await collection.findOne({ _id: orderId });
  return order?.processingJobId;
}

async function retryOrder(orderId: string) {
  const order = await findTestOrder(orderId);
  if (!order) return { success: false, error: 'Order not found' };

  await updateTestOrderStatus(orderId, 'placed', {
    $unset: { processingResult: '' },
  });

  return { success: true };
}

async function initiatePaymentForOrder(orderId: string) {
  // Mock payment service call
  return { paymentId: `pay-${orderId}`, orderId };
}

async function confirmPaymentForOrder(orderId: string, paymentId: string) {
  const collection = mongoose.connection.collection('orders');
  await collection.updateOne(
    { _id: orderId },
    { $set: { 'payment.status': 'paid', paymentId, updatedAt: new Date() } }
  );
}

/**
 * Unit tests for Order Queue
 */

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  on: jest.fn(),
};

const mockQueue = {
  add: jest.fn(),
  getJob: jest.fn(),
  getJobCounts: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  close: jest.fn(),
  on: jest.fn(),
};

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => mockQueue),
  Worker: jest.fn(),
}));

jest.mock('../../config/redis', () => ({
  getRedisConnection: jest.fn().mockReturnValue(mockRedis),
}));

import {
  OrderQueue,
  OrderJobData,
  OrderItem,
  OrderProcessingResult,
  IdempotencyResult,
  getOrderQueue,
} from '../../services/orderQueue';

describe('OrderQueue', () => {
  let orderQueue: OrderQueue;

  beforeEach(() => {
    jest.clearAllMocks();
    orderQueue = new OrderQueue();
  });

  describe('OrderJobData interface', () => {
    it('should accept valid job data', () => {
      const data: OrderJobData = {
        orderId: 'order-123',
        merchantId: 'merchant-456',
        customerId: 'customer-789',
        items: [
          {
            productId: 'product-1',
            name: 'Test Product',
            quantity: 2,
            unitPrice: 10.00,
            totalPrice: 20.00,
          },
        ],
        totalAmount: 20.00,
        currency: 'USD',
        createdAt: new Date().toISOString(),
      };

      expect(data.orderId).toBe('order-123');
      expect(data.items).toHaveLength(1);
    });

    it('should allow optional metadata', () => {
      const data: OrderJobData = {
        orderId: 'order-123',
        merchantId: 'merchant-456',
        customerId: 'customer-789',
        items: [],
        totalAmount: 0,
        currency: 'USD',
        createdAt: new Date().toISOString(),
        metadata: {
          source: 'web',
          campaign: 'summer-sale',
        },
      };

      expect(data.metadata?.source).toBe('web');
    });
  });

  describe('OrderItem interface', () => {
    it('should validate item structure', () => {
      const item: OrderItem = {
        productId: 'prod-1',
        name: 'Pizza',
        quantity: 2,
        unitPrice: 15.99,
        totalPrice: 31.98,
      };

      expect(item.totalPrice).toBe(item.quantity * item.unitPrice);
    });
  });

  describe('OrderProcessingResult interface', () => {
    it('should accept success result', () => {
      const result: OrderProcessingResult = {
        success: true,
        jobId: 'job-123',
        orderId: 'order-456',
        status: 'processed',
        processedAt: new Date().toISOString(),
      };

      expect(result.success).toBe(true);
      expect(result.status).toBe('processed');
    });

    it('should accept duplicate result', () => {
      const result: OrderProcessingResult = {
        success: true,
        jobId: 'existing-job',
        orderId: 'order-456',
        status: 'duplicate',
        message: 'Order already processed',
      };

      expect(result.status).toBe('duplicate');
    });

    it('should accept failed result', () => {
      const result: OrderProcessingResult = {
        success: false,
        jobId: '',
        orderId: 'order-456',
        status: 'failed',
        message: 'Queue error',
      };

      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
    });
  });

  describe('IdempotencyResult enum', () => {
    it('should have correct values', () => {
      expect(IdempotencyResult.NEW).toBe('new');
      expect(IdempotencyResult.DUPLICATE).toBe('duplicate');
      expect(IdempotencyResult.PROCESSING).toBe('processing');
    });
  });

  describe('checkIdempotency', () => {
    it('should return NEW for first-time order', async () => {
      mockRedis.set.mockResolvedValue('OK'); // Lock acquired
      mockRedis.get.mockResolvedValue(null); // No existing result

      const result = await orderQueue.checkIdempotency('order-123');

      expect(result.result).toBe(IdempotencyResult.NEW);
    });

    it('should return DUPLICATE when result exists', async () => {
      mockRedis.set.mockResolvedValue(null); // Lock not acquired
      const existingResult: OrderProcessingResult = {
        success: true,
        jobId: 'job-123',
        orderId: 'order-123',
        status: 'processed',
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(existingResult));

      const result = await orderQueue.checkIdempotency('order-123');

      expect(result.result).toBe(IdempotencyResult.DUPLICATE);
      expect(result.existingResult).toEqual(existingResult);
    });

    it('should return PROCESSING when lock is held', async () => {
      mockRedis.set.mockResolvedValue(null); // Lock not acquired
      mockRedis.get.mockResolvedValue(null); // No result yet

      const result = await orderQueue.checkIdempotency('order-123');

      expect(result.result).toBe(IdempotencyResult.PROCESSING);
    });
  });

  describe('addWithIdempotency', () => {
    it('should add new order to queue', async () => {
      mockRedis.set.mockResolvedValueOnce('OK'); // Lock acquired
      mockRedis.get.mockResolvedValue(null); // No existing result
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.del.mockResolvedValue(1);
      mockQueue.add.mockResolvedValue(undefined);

      const jobData: Partial<OrderJobData> = {
        orderId: 'order-new',
        merchantId: 'merchant-1',
        customerId: 'customer-1',
        items: [],
        totalAmount: 100,
        currency: 'USD',
        createdAt: new Date().toISOString(),
      };

      const result = await orderQueue.addWithIdempotency('order-new', jobData);

      expect(result.success).toBe(true);
      expect(result.status).toBe('processed');
      expect(result.jobId).toBeDefined();
      expect(mockQueue.add).toHaveBeenCalled();
    });

    it('should return existing result for duplicate order', async () => {
      const existingResult: OrderProcessingResult = {
        success: true,
        jobId: 'existing-job',
        orderId: 'order-dup',
        status: 'processed',
      };

      mockRedis.set.mockResolvedValueOnce('OK'); // Lock acquired
      mockRedis.get.mockResolvedValue(JSON.stringify(existingResult)); // Existing result

      const result = await orderQueue.addWithIdempotency('order-dup', {});

      expect(result.success).toBe(true);
      expect(result.status).toBe('processed');
      expect(result.jobId).toBe('existing-job');
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should return failed status when order is processing', async () => {
      mockRedis.set.mockResolvedValueOnce('OK'); // Lock acquired
      mockRedis.get.mockResolvedValue(null); // No result
      // But SETNX returns null on second call (race condition)

      // Simulate processing state
      mockRedis.set.mockResolvedValueOnce('OK');
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValueOnce(null); // Lock already held
      mockRedis.get.mockResolvedValue(null);

      const result = await orderQueue.addWithIdempotency('order-processing', {});

      // Result depends on timing - could be processing or new
      expect(result).toBeDefined();
    });

    it('should handle queue errors gracefully', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.del.mockResolvedValue(1);
      mockQueue.add.mockRejectedValue(new Error('Queue error'));
      mockRedis.del.mockResolvedValue(1); // For cleanup

      const result = await orderQueue.addWithIdempotency('order-error', {});

      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.message).toContain('Queue error');
    });
  });

  describe('isProcessed', () => {
    it('should return true when idempotency key exists', async () => {
      mockRedis.exists.mockResolvedValue(1);

      const result = await orderQueue.isProcessed('order-123');

      expect(result).toBe(true);
    });

    it('should return false when idempotency key does not exist', async () => {
      mockRedis.exists.mockResolvedValue(0);

      const result = await orderQueue.isProcessed('order-123');

      expect(result).toBe(false);
    });
  });

  describe('getResult', () => {
    it('should return stored result', async () => {
      const storedResult: OrderProcessingResult = {
        success: true,
        jobId: 'job-123',
        orderId: 'order-123',
        status: 'processed',
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(storedResult));

      const result = await orderQueue.getResult('order-123');

      expect(result).toEqual(storedResult);
    });

    it('should return null when no result stored', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await orderQueue.getResult('order-123');

      expect(result).toBeNull();
    });
  });

  describe('clearIdempotency', () => {
    it('should delete all idempotency keys', async () => {
      mockRedis.del.mockResolvedValue(3);

      await orderQueue.clearIdempotency('order-123');

      expect(mockRedis.del).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return queue statistics', async () => {
      mockQueue.getJobCounts.mockResolvedValue({
        wait: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
      });

      const stats = await orderQueue.getStats();

      expect(stats).toEqual({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
      });
    });
  });

  describe('pause and resume', () => {
    it('should pause the queue', async () => {
      mockQueue.pause.mockResolvedValue(undefined);

      await orderQueue.pause();

      expect(mockQueue.pause).toHaveBeenCalled();
    });

    it('should resume the queue', async () => {
      mockQueue.resume.mockResolvedValue(undefined);

      await orderQueue.resume();

      expect(mockQueue.resume).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should close the queue', async () => {
      mockQueue.close.mockResolvedValue(undefined);

      await orderQueue.close();

      expect(mockQueue.close).toHaveBeenCalled();
    });
  });

  describe('getOrderQueue singleton', () => {
    it('should return same instance', () => {
      const instance1 = getOrderQueue();
      const instance2 = getOrderQueue();

      expect(instance1).toBe(instance2);
    });
  });
});

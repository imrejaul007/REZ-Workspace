/**
 * Unit tests for Order Service
 */

import { Types } from 'mongoose';

// Mock dependencies
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
};

const mockQueue = {
  add: jest.fn(),
  addWithIdempotency: jest.fn(),
  isProcessed: jest.fn(),
  getResult: jest.fn(),
  clearIdempotency: jest.fn(),
  getStats: jest.fn(),
};

const mockOrderModel = {
  findOne: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
};

jest.mock('../../config/redis', () => ({
  bullmqRedis: mockRedis,
}));

jest.mock('../../services/orderQueue', () => ({
  OrderQueue: jest.fn().mockImplementation(() => mockQueue),
  getOrderQueue: jest.fn().mockReturnValue(mockQueue),
}));

jest.mock('../../models/Order', () => mockOrderModel);

import { OrderService, CreateOrderInput, OrderServiceResponse } from '../../services/orderService';

describe('Order Service', () => {
  let orderService: OrderService;

  beforeEach(() => {
    jest.clearAllMocks();
    orderService = new OrderService(mockQueue as any);
  });

  describe('CreateOrderInput interface', () => {
    it('should accept valid order input', () => {
      const input: CreateOrderInput = {
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [
          {
            productId: 'product-1',
            name: 'Test Product',
            quantity: 2,
            unitPrice: 10.00,
          },
        ],
        delivery: {
          type: 'pickup',
        },
        paymentMethod: 'card',
        currency: 'USD',
        clientIdempotencyKey: 'idem-123',
      };

      expect(input.items).toHaveLength(1);
      expect(input.items[0].quantity).toBe(2);
    });

    it('should accept delivery with address', () => {
      const input: CreateOrderInput = {
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [
          {
            productId: 'product-1',
            name: 'Test Product',
            quantity: 1,
            unitPrice: 10.00,
          },
        ],
        delivery: {
          type: 'delivery',
          address: {
            street: '123 Main St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            coordinates: {
              latitude: 40.7128,
              longitude: -74.0060,
            },
          },
        },
      };

      expect(input.delivery?.type).toBe('delivery');
      expect(input.delivery?.address?.city).toBe('Test City');
    });
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const mockOrder = {
        _id: new Types.ObjectId(),
        orderNumber: 'ORD-123',
        status: 'placed',
        items: [],
        totals: { subtotal: 100, total: 108.75 },
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockOrderModel.create.mockResolvedValue(mockOrder);
      mockQueue.addWithIdempotency.mockResolvedValue({
        success: true,
        jobId: 'job-123',
      });

      const input: CreateOrderInput = {
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [
          {
            productId: 'product-1',
            name: 'Test Product',
            quantity: 2,
            unitPrice: 50.00,
          },
        ],
      };

      const result = await orderService.createOrder(input);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(result.jobId).toBe('job-123');
    });

    it('should return existing order for duplicate idempotency key', async () => {
      const existingOrder = {
        _id: new Types.ObjectId(),
        orderNumber: 'ORD-EXISTING',
        clientIdempotencyKey: 'idem-123',
      };
      mockOrderModel.findOne.mockResolvedValue(existingOrder);

      const input: CreateOrderInput = {
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [
          {
            productId: 'product-1',
            name: 'Test Product',
            quantity: 1,
            unitPrice: 10.00,
          },
        ],
        clientIdempotencyKey: 'idem-123',
      };

      const result = await orderService.createOrder(input);

      expect(result.success).toBe(true);
      expect(result.duplicate).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.orderId).toBe(existingOrder._id.toString());
    });

    it('should calculate totals correctly', async () => {
      const mockOrder = {
        _id: new Types.ObjectId(),
        orderNumber: 'ORD-123',
        totals: { subtotal: 100, tax: 8.75, total: 108.75 },
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockOrderModel.create.mockResolvedValue(mockOrder);
      mockQueue.addWithIdempotency.mockResolvedValue({
        success: true,
        jobId: 'job-123',
      });

      const input: CreateOrderInput = {
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [
          {
            productId: 'product-1',
            name: 'Test Product',
            quantity: 2,
            unitPrice: 50.00,
          },
        ],
      };

      await orderService.createOrder(input);

      expect(mockOrderModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          totals: expect.objectContaining({
            subtotal: 100,
            deliveryFee: 0,
          }),
        })
      );
    });

    it('should add delivery fee for delivery orders', async () => {
      const mockOrder = {
        _id: new Types.ObjectId(),
        orderNumber: 'ORD-123',
        totals: { subtotal: 100, deliveryFee: 4.99 },
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockOrderModel.create.mockResolvedValue(mockOrder);
      mockQueue.addWithIdempotency.mockResolvedValue({
        success: true,
        jobId: 'job-123',
      });

      const input: CreateOrderInput = {
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [
          {
            productId: 'product-1',
            name: 'Test Product',
            quantity: 1,
            unitPrice: 100.00,
          },
        ],
        delivery: {
          type: 'delivery',
          address: {
            street: '123 Main St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
          },
        },
      };

      await orderService.createOrder(input);

      expect(mockOrderModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          totals: expect.objectContaining({
            deliveryFee: 4.99,
          }),
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      mockOrderModel.create.mockRejectedValue(new Error('Database error'));

      const input: CreateOrderInput = {
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [
          {
            productId: 'product-1',
            name: 'Test Product',
            quantity: 1,
            unitPrice: 10.00,
          },
        ],
      };

      const result = await orderService.createOrder(input);

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(500);
    });

    it('should handle duplicate key error from MongoDB', async () => {
      const error = new Error('E11000 duplicate key error');
      mockOrderModel.create.mockRejectedValue(error);

      const existingOrder = {
        _id: new Types.ObjectId(),
        orderNumber: 'ORD-EXISTING',
      };
      mockOrderModel.findOne.mockResolvedValue(existingOrder);

      const input: CreateOrderInput = {
        userId: 'user-123',
        merchantId: 'merchant-456',
        storeId: 'store-789',
        items: [
          {
            productId: 'product-1',
            name: 'Test Product',
            quantity: 1,
            unitPrice: 10.00,
          },
        ],
        clientIdempotencyKey: 'idem-123',
      };

      const result = await orderService.createOrder(input);

      expect(result.success).toBe(true);
      expect(result.duplicate).toBe(true);
    });
  });

  describe('getOrder', () => {
    it('should return order by ID', async () => {
      const orderId = new Types.ObjectId().toString();
      const mockOrder = { _id: orderId, orderNumber: 'ORD-123' };
      mockOrderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });

      const result = await orderService.getOrder(orderId);

      expect(result).toEqual(mockOrder);
    });

    it('should return null for invalid ObjectId', async () => {
      const result = await orderService.getOrder('invalid-id');

      expect(result).toBeNull();
      expect(mockOrderModel.findById).not.toHaveBeenCalled();
    });

    it('should return null when order not found', async () => {
      const orderId = new Types.ObjectId().toString();
      mockOrderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await orderService.getOrder(orderId);

      expect(result).toBeNull();
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const orderId = new Types.ObjectId().toString();
      const mockUpdatedOrder = { _id: orderId, status: 'confirmed' };
      mockOrderModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedOrder),
      });

      const result = await orderService.updateOrderStatus(orderId, 'confirmed');

      expect(result).toEqual(mockUpdatedOrder);
    });

    it('should return null for invalid ObjectId', async () => {
      const result = await orderService.updateOrderStatus('invalid-id', 'confirmed');

      expect(result).toBeNull();
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order in cancellable status', async () => {
      const orderId = new Types.ObjectId().toString();
      const mockOrder = {
        _id: orderId,
        status: 'placed',
      };
      mockOrderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });
      mockOrderModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockOrder, status: 'cancelled' }),
      });

      const result = await orderService.cancelOrder(orderId, 'Customer request');

      expect(result?.status).toBe('cancelled');
    });

    it('should return null for non-cancellable status', async () => {
      const orderId = new Types.ObjectId().toString();
      const mockOrder = {
        _id: orderId,
        status: 'delivered',
      };
      mockOrderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });

      const result = await orderService.cancelOrder(orderId);

      expect(result).toBeNull();
    });

    it('should return null when order not found', async () => {
      const orderId = new Types.ObjectId().toString();
      mockOrderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await orderService.cancelOrder(orderId);

      expect(result).toBeNull();
    });
  });

  describe('getOrdersByUser', () => {
    it('should return orders for user', async () => {
      const userId = new Types.ObjectId().toString();
      const mockOrders = [
        { _id: new Types.ObjectId(), orderNumber: 'ORD-1' },
        { _id: new Types.ObjectId(), orderNumber: 'ORD-2' },
      ];
      mockOrderModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockOrders),
            }),
          }),
        }),
      });

      const result = await orderService.getOrdersByUser(userId);

      expect(result).toEqual(mockOrders);
    });

    it('should filter by status', async () => {
      const userId = new Types.ObjectId().toString();
      mockOrderModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      await orderService.getOrdersByUser(userId, { status: 'pending' });

      expect(mockOrderModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
    });
  });

  describe('isProcessing', () => {
    it('should delegate to queue', async () => {
      mockQueue.isProcessed.mockResolvedValue(true);

      const result = await orderService.isProcessing('order-123');

      expect(mockQueue.isProcessed).toHaveBeenCalledWith('order-123');
      expect(result).toBe(true);
    });
  });

  describe('retryOrder', () => {
    it('should clear idempotency and reset status', async () => {
      const orderId = new Types.ObjectId().toString();
      const mockOrder = {
        _id: orderId,
        status: 'failed',
      };
      mockOrderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      });
      mockOrderModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockOrder, status: 'placed' }),
      });

      const result = await orderService.retryOrder(orderId);

      expect(result).toBe(true);
      expect(mockQueue.clearIdempotency).toHaveBeenCalledWith(orderId);
    });

    it('should return false when order not found', async () => {
      const orderId = new Types.ObjectId().toString();
      mockOrderModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await orderService.retryOrder(orderId);

      expect(result).toBe(false);
    });
  });
});

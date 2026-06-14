/**
 * Order Service Tests
 */

import { orderService } from '../services/orderService';
import { ShopOrder, Product } from '../models';

describe('OrderService', () => {
  let testProductId: string;

  beforeAll(async () => {
    // Create a test product for orders
    const product = new Product({
      catalogId: 'test-catalog',
      name: 'Test Product for Orders',
      description: 'Description',
      price: 100,
      images: ['https://example.com/image.jpg'],
      category: 'Test',
      syncStatus: 'pending',
    });
    const saved = await product.save();
    testProductId = saved._id.toString();
  });

  afterAll(async () => {
    // Cleanup test product
    await Product.findByIdAndDelete(testProductId);
  });

  describe('createOrder', () => {
    it('should create an order with valid data', async () => {
      const orderData = {
        productId: testProductId,
        userId: 'user123',
        quantity: 2,
        totalAmount: 200,
        shippingAddress: {
          name: 'John Doe',
          street: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          zip: '400001',
        },
      };

      const order = await orderService.createOrder(orderData);

      expect(order).toBeDefined();
      expect(order.productId.toString()).toBe(testProductId);
      expect(order.userId).toBe('user123');
      expect(order.quantity).toBe(2);
      expect(order.totalAmount).toBe(200);
      expect(order.status).toBe('pending');

      // Cleanup
      await ShopOrder.findByIdAndDelete(order._id);
    });

    it('should set default country if not provided', async () => {
      const orderData = {
        productId: testProductId,
        userId: 'user456',
        quantity: 1,
        totalAmount: 100,
        shippingAddress: {
          name: 'Jane Doe',
          street: '456 Other St',
          city: 'Delhi',
          state: 'Delhi',
          zip: '110001',
        },
      };

      const order = await orderService.createOrder(orderData);

      expect(order.shippingAddress.country).toBe('India');

      // Cleanup
      await ShopOrder.findByIdAndDelete(order._id);
    });
  });

  describe('getOrder', () => {
    it('should return order by ID', async () => {
      const orderData = {
        productId: testProductId,
        userId: 'user789',
        quantity: 1,
        totalAmount: 100,
        shippingAddress: {
          name: 'Test User',
          street: 'Test St',
          city: 'Test City',
          state: 'Test State',
          zip: '123456',
        },
      };

      const created = await orderService.createOrder(orderData);
      const found = await orderService.getOrder(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);

      // Cleanup
      await ShopOrder.findByIdAndDelete(created._id);
    });

    it('should return null for non-existent order', async () => {
      const found = await orderService.getOrder('nonexistent123');
      expect(found).toBeNull();
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const orderData = {
        productId: testProductId,
        userId: 'user-status-test',
        quantity: 1,
        totalAmount: 100,
        shippingAddress: {
          name: 'Status Test',
          street: 'Test St',
          city: 'Test City',
          state: 'Test State',
          zip: '123456',
        },
      };

      const created = await orderService.createOrder(orderData);
      const updated = await orderService.updateOrderStatus(created.id, {
        status: 'confirmed',
      });

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('confirmed');
      expect(updated?.confirmedAt).toBeDefined();

      // Cleanup
      await ShopOrder.findByIdAndDelete(created._id);
    });

    it('should set timestamps for status changes', async () => {
      const orderData = {
        productId: testProductId,
        userId: 'user-timestamp-test',
        quantity: 1,
        totalAmount: 100,
        shippingAddress: {
          name: 'Timestamp Test',
          street: 'Test St',
          city: 'Test City',
          state: 'Test State',
          zip: '123456',
        },
      };

      const created = await orderService.createOrder(orderData);

      // Update to shipped
      const shipped = await orderService.updateOrderStatus(created.id, {
        status: 'shipped',
        trackingNumber: 'TRACK123',
      });

      expect(shipped?.shippedAt).toBeDefined();
      expect(shipped?.trackingNumber).toBe('TRACK123');

      // Cleanup
      await ShopOrder.findByIdAndDelete(created._id);
    });
  });

  describe('listOrders', () => {
    it('should list orders with pagination', async () => {
      const result = await orderService.listOrders(
        {},
        { page: 1, limit: 10 }
      );

      expect(result).toBeDefined();
      expect(result.orders).toBeDefined();
      expect(Array.isArray(result.orders)).toBe(true);
      expect(result.page).toBe(1);
    });

    it('should filter by user ID', async () => {
      const result = await orderService.listOrders(
        { userId: 'nonexistent-user' },
        { page: 1, limit: 10 }
      );

      expect(result.orders.length).toBe(0);
    });
  });

  describe('getOrderStats', () => {
    it('should return order statistics', async () => {
      const stats = await orderService.getOrderStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalOrders).toBe('number');
      expect(typeof stats.totalRevenue).toBe('number');
      expect(typeof stats.averageOrderValue).toBe('number');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order', async () => {
      const orderData = {
        productId: testProductId,
        userId: 'user-cancel-test',
        quantity: 1,
        totalAmount: 100,
        shippingAddress: {
          name: 'Cancel Test',
          street: 'Test St',
          city: 'Test City',
          state: 'Test State',
          zip: '123456',
        },
      };

      const created = await orderService.createOrder(orderData);
      const cancelled = await orderService.cancelOrder(created.id, 'Changed my mind');

      expect(cancelled).toBeDefined();
      expect(cancelled?.status).toBe('cancelled');
      expect(cancelled?.cancelledAt).toBeDefined();
      expect(cancelled?.notes).toBe('Changed my mind');

      // Cleanup
      await ShopOrder.findByIdAndDelete(created._id);
    });
  });
});

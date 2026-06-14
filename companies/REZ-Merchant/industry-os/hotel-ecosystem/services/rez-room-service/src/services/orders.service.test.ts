import { describe, it, expect, beforeEach } from 'vitest';
import { RoomServiceOrdersService } from './orders.service';

describe('RoomServiceOrdersService', () => {
  let service: RoomServiceOrdersService;

  beforeEach(() => {
    service = new RoomServiceOrdersService();
  });

  describe('createOrder', () => {
    it('should create a room service order', async () => {
      const order = await service.createOrder(
        'hotel-1',
        '101',
        'John Doe',
        [
          { itemId: 'burger', name: 'Burger', quantity: 2, price: 299 },
          { itemId: 'coke', name: 'Coke', quantity: 2, price: 99 },
        ],
        undefined,
        'Extra cheese please'
      );

      expect(order.orderId).toBeDefined();
      expect(order.status).toBe('pending');
      expect(order.subtotal).toBe(796); // 2*299 + 2*99
      expect(order.total).toBeGreaterThan(order.subtotal); // Plus taxes
      expect(order.estimatedDelivery).toBeDefined();
    });

    it('should calculate taxes correctly', async () => {
      const order = await service.createOrder(
        'hotel-1',
        '101',
        'John Doe',
        [{ itemId: 'pizza', name: 'Pizza', quantity: 1, price: 499 }]
      );

      expect(order.taxes.sgst).toBeGreaterThan(0);
      expect(order.taxes.cgst).toBeGreaterThan(0);
      expect(order.taxes.serviceCharge).toBeGreaterThan(0);
    });
  });

  describe('order lifecycle', () => {
    it('should transition through order states', async () => {
      const order = await service.createOrder(
        'hotel-1',
        '101',
        'John Doe',
        [{ itemId: 'pasta', name: 'Pasta', quantity: 1, price: 349 }]
      );

      // Confirm
      const confirmed = await service.confirmOrder(order.orderId);
      expect(confirmed.status).toBe('confirmed');

      // Prepare
      const preparing = await service.startPreparing(confirmed.orderId, 'kitchen-1');
      expect(preparing.status).toBe('preparing');

      // Ready
      const ready = await service.markReady(preparing.orderId);
      expect(ready.status).toBe('ready');

      // Deliver
      const delivered = await service.markDelivered(ready.orderId);
      expect(delivered.status).toBe('delivered');
    });

    it('should allow cancellation before delivery', async () => {
      const order = await service.createOrder(
        'hotel-1',
        '101',
        'John Doe',
        [{ itemId: 'soup', name: 'Soup', quantity: 1, price: 149 }]
      );

      const cancelled = await service.cancelOrder(order.orderId, 'Changed my mind');
      expect(cancelled.status).toBe('cancelled');
    });

    it('should not allow cancellation after delivery', async () => {
      const order = await service.createOrder(
        'hotel-1',
        '101',
        'John Doe',
        [{ itemId: 'salad', name: 'Salad', quantity: 1, price: 199 }]
      );

      await service.markDelivered(order.orderId);

      await expect(service.cancelOrder(order.orderId)).rejects.toThrow('Cannot cancel delivered order');
    });
  });

  describe('discounts', () => {
    it('should apply percentage discount', async () => {
      const order = await service.createOrder(
        'hotel-1',
        '101',
        'John Doe',
        [{ itemId: 'steak', name: 'Steak', quantity: 1, price: 999 }]
      );

      const discounted = await service.applyDiscount(order.orderId, 'WELCOME10', 'percentage', 10);
      expect(discounted.discount.amount).toBeGreaterThan(0);
      expect(discounted.discount.type).toBe('percentage');
    });

    it('should apply fixed discount', async () => {
      const order = await service.createOrder(
        'hotel-1',
        '101',
        'John Doe',
        [{ itemId: 'biryani', name: 'Biryani', quantity: 1, price: 399 }]
      );

      const discounted = await service.applyDiscount(order.orderId, 'FLAT100', 'fixed', 100);
      expect(discounted.discount.amount).toBe(100);
    });
  });

  describe('getOrdersByRoom', () => {
    it('should get orders for a specific room', async () => {
      await service.createOrder('hotel-1', '101', 'John', [{ itemId: 'a', name: 'A', quantity: 1, price: 100 }]);
      await service.createOrder('hotel-1', '101', 'Jane', [{ itemId: 'b', name: 'B', quantity: 1, price: 200 }]);
      await service.createOrder('hotel-1', '102', 'Bob', [{ itemId: 'c', name: 'C', quantity: 1, price: 300 }]);

      const orders = await service.getOrdersByRoom('hotel-1', '101');
      expect(orders.length).toBe(2);
      expect(orders.every(o => o.roomNumber === '101')).toBe(true);
    });
  });

  describe('getKitchenStatus', () => {
    it('should return kitchen status', async () => {
      await service.createOrder('hotel-1', '101', 'John', [{ itemId: 'a', name: 'A', quantity: 1, price: 100 }]);
      await service.createOrder('hotel-1', '102', 'Jane', [{ itemId: 'b', name: 'B', quantity: 1, price: 200 }]);

      const status = await service.getKitchenStatus('hotel-1');

      expect(status.orders.length).toBe(2);
      expect(status.stations).toBeDefined();
      expect(Array.isArray(status.stations)).toBe(true);
      expect(typeof status.avgWaitTime).toBe('number');
    });
  });

  describe('getDailyStats', () => {
    it('should return daily statistics', async () => {
      await service.createOrder('hotel-1', '101', 'John', [{ itemId: 'a', name: 'A', quantity: 1, price: 100 }]);
      await service.createOrder('hotel-1', '102', 'Jane', [{ itemId: 'b', name: 'B', quantity: 1, price: 200 }]);

      const stats = await service.getDailyStats('hotel-1');

      expect(stats.totalOrders).toBeGreaterThanOrEqual(2);
      expect(stats.revenue).toBeGreaterThanOrEqual(0);
      expect(stats.avgOrderValue).toBeGreaterThanOrEqual(0);
    });
  });
});

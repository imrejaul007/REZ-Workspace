import { describe, it, expect, beforeEach } from 'vitest';
import { LaundryService } from './laundry.service';

describe('LaundryService', () => {
  let service: LaundryService;

  beforeEach(() => {
    service = new LaundryService();
  });

  describe('createOrder', () => {
    it('should create a laundry order', async () => {
      const order = await service.createOrder(
        'hotel-1',
        'John Doe',
        '9876543210',
        [
          { category: 'garment', name: 'Shirt', quantity: 3, condition: 'good' },
        ],
        'full_service',
        '101',
        'normal'
      );

      expect(order.orderId).toBeDefined();
      expect(order.status).toBe('pending');
      expect(order.subtotal).toBeGreaterThan(0);
      expect(order.total).toBeGreaterThan(order.subtotal);
    });

    it('should calculate price based on items', async () => {
      const order = await service.createOrder(
        'hotel-1',
        'John Doe',
        '9876543210',
        [
          { category: 'garment', name: 'Shirt', quantity: 2, condition: 'good' },
          { category: 'blanket', name: 'Blanket', quantity: 1, condition: 'good' },
        ],
        'full_service'
      );

      // Should have higher price for blanket
      expect(order.subtotal).toBeGreaterThan(0);
    });

    it('should apply rush priority multiplier', async () => {
      const normal = await service.createOrder(
        'hotel-1',
        'John Doe',
        '9876543210',
        [{ category: 'garment', name: 'Shirt', quantity: 1, condition: 'good' }],
        'full_service',
        undefined,
        'normal'
      );

      const rush = await service.createOrder(
        'hotel-1',
        'John Doe',
        '9876543210',
        [{ category: 'garment', name: 'Shirt', quantity: 1, condition: 'good' }],
        'full_service',
        undefined,
        'rush'
      );

      expect(rush.subtotal).toBeGreaterThan(normal.subtotal);
    });
  });

  describe('order lifecycle', () => {
    it('should transition through order states', async () => {
      const order = await service.createOrder(
        'hotel-1',
        'John Doe',
        '9876543210',
        [{ category: 'garment', name: 'Shirt', quantity: 1, condition: 'good' }],
        'full_service'
      );

      // Pickup
      const pickedUp = await service.markPickedUp(order.orderId);
      expect(pickedUp.status).toBe('washing');

      // Ready
      const ready = await service.markReady(pickedUp.orderId);
      expect(ready.status).toBe('ready');
      expect(ready.completedAt).toBeDefined();

      // Delivered
      const delivered = await service.markDelivered(ready.orderId);
      expect(delivered.status).toBe('delivered');
      expect(delivered.deliveredAt).toBeDefined();
    });

    it('should not allow cancellation after delivery', async () => {
      const order = await service.createOrder(
        'hotel-1',
        'John Doe',
        '9876543210',
        [{ category: 'garment', name: 'Shirt', quantity: 1, condition: 'good' }],
        'full_service'
      );

      await service.markDelivered(order.orderId);

      await expect(service.cancelOrder(order.orderId)).rejects.toThrow('Cannot cancel this order');
    });
  });

  describe('payment', () => {
    it('should process payment', async () => {
      const order = await service.createOrder(
        'hotel-1',
        'John Doe',
        '9876543210',
        [{ category: 'garment', name: 'Shirt', quantity: 1, condition: 'good' }],
        'full_service'
      );

      const paid = await service.processPayment(order.orderId, 'card');
      expect(paid.paymentStatus).toBe('paid');
      expect(paid.paymentMethod).toBe('card');
    });
  });

  describe('getRoomOrders', () => {
    it('should get orders for a specific room', async () => {
      await service.createOrder('hotel-1', 'John', '111', [{ category: 'garment', name: 'A', quantity: 1, condition: 'good' }], 'self_service', '101');
      await service.createOrder('hotel-1', 'Jane', '222', [{ category: 'garment', name: 'B', quantity: 1, condition: 'good' }], 'self_service', '102');

      const room101 = await service.getRoomOrders('hotel-1', '101');
      expect(room101.length).toBe(1);
      expect(room101[0].roomNumber).toBe('101');
    });
  });

  describe('machine management', () => {
    it('should return machine status', async () => {
      const machines = await service.getMachineStatus();
      expect(machines.length).toBe(9); // 5 washers + 4 dryers
    });

    it('should have correct machine types', async () => {
      const machines = await service.getMachineStatus();
      const washers = machines.filter(m => m.type === 'washer');
      const dryers = machines.filter(m => m.type === 'dryer');

      expect(washers.length).toBe(5);
      expect(dryers.length).toBe(4);
    });
  });

  describe('daily stats', () => {
    it('should return daily statistics', async () => {
      await service.createOrder('hotel-1', 'John', '111', [{ category: 'garment', name: 'A', quantity: 1, condition: 'good' }], 'self_service');
      await service.createOrder('hotel-1', 'Jane', '222', [{ category: 'garment', name: 'B', quantity: 1, condition: 'good' }], 'full_service');

      const stats = await service.getDailyStats('hotel-1');

      expect(stats.totalOrders).toBeGreaterThanOrEqual(2);
      expect(stats.byServiceType).toBeDefined();
      expect(stats.popularItems).toBeDefined();
    });
  });
});

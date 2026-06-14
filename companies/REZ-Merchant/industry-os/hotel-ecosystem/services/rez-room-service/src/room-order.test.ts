import { describe, it, expect, beforeEach } from 'vitest';
import {
  getMenu,
  getMenuItem,
  createOrder,
  getOrder,
  getOrders,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
} from './services/room-order.service.js';

describe('Room Service - Order Management', () => {
  const testOrderRequest = {
    hotelId: 'h1',
    roomId: 'R101',
    guestId: 'G001',
    guestName: 'John Doe',
    orderType: 'room_service' as const,
    items: [
      { menuItemId: 'm1', quantity: 2 },
      { menuItemId: 'm8', quantity: 1 },
    ],
    specialInstructions: 'Extra napkins please',
  };

  describe('getMenu', () => {
    it('should return available menu items', () => {
      const menu = getMenu();
      expect(menu.length).toBeGreaterThan(0);
      expect(menu.every((item) => item.isAvailable)).toBe(true);
    });

    it('should include breakfast items', () => {
      const menu = getMenu();
      const breakfastItems = menu.filter((item) => item.category === 'Breakfast');
      expect(breakfastItems.length).toBeGreaterThan(0);
    });
  });

  describe('getMenuItem', () => {
    it('should return menu item by ID', () => {
      const item = getMenuItem('m1');
      expect(item).toBeDefined();
      expect(item?.name).toBe('Continental Breakfast');
    });

    it('should return undefined for non-existent item', () => {
      const item = getMenuItem('nonexistent');
      expect(item).toBeUndefined();
    });
  });

  describe('createOrder', () => {
    it('should create a new order', () => {
      const order = createOrder(testOrderRequest);
      expect(order.id).toBeDefined();
      expect(order.orderNumber).toContain('RS');
      expect(order.guestName).toBe('John Doe');
      expect(order.status).toBe('pending');
    });

    it('should calculate correct totals', () => {
      const order = createOrder(testOrderRequest);
      // Continental Breakfast x2 = 900, Espresso x1 = 120
      expect(order.subtotal).toBe(1020);
      expect(order.tax).toBe(122); // 12% GST
      expect(order.total).toBe(1142);
    });

    it('should include order items with details', () => {
      const order = createOrder(testOrderRequest);
      expect(order.items).toHaveLength(2);
      expect(order.items[0].name).toBe('Continental Breakfast');
      expect(order.items[0].quantity).toBe(2);
    });

    it('should set estimated delivery time', () => {
      const order = createOrder(testOrderRequest);
      expect(order.estimatedDelivery).toBeDefined();
      const deliveryTime = new Date(order.estimatedDelivery!);
      expect(deliveryTime.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('getOrder', () => {
    it('should retrieve order by ID', () => {
      const created = createOrder(testOrderRequest);
      const found = getOrder(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should return undefined for non-existent order', () => {
      const found = getOrder('nonexistent-id');
      expect(found).toBeUndefined();
    });
  });

  describe('getOrders', () => {
    it('should return all orders', () => {
      const order1 = createOrder({ ...testOrderRequest, guestName: 'Guest 1' });
      const order2 = createOrder({ ...testOrderRequest, guestName: 'Guest 2' });
      const orders = getOrders();
      expect(orders.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by hotel ID', () => {
      createOrder(testOrderRequest);
      const orders = getOrders({ hotelId: 'h1' });
      expect(orders.every((o) => o.hotelId === 'h1')).toBe(true);
    });

    it('should filter by status', () => {
      const order = createOrder(testOrderRequest);
      updateOrderStatus(order.id, 'preparing');
      const orders = getOrders({ status: 'preparing' });
      expect(orders.every((o) => o.status === 'preparing')).toBe(true);
    });

    it('should filter by guest ID', () => {
      const order = createOrder({ ...testOrderRequest, guestId: 'VIP-001' });
      const orders = getOrders({ guestId: 'VIP-001' });
      expect(orders).toHaveLength(1);
      expect(orders[0].guestId).toBe('VIP-001');
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', () => {
      const order = createOrder(testOrderRequest);
      const updated = updateOrderStatus(order.id, 'preparing');
      expect(updated?.status).toBe('preparing');
    });

    it('should return undefined for non-existent order', () => {
      const updated = updateOrderStatus('nonexistent', 'preparing');
      expect(updated).toBeUndefined();
    });
  });

  describe('cancelOrder', () => {
    it('should cancel a pending order', () => {
      const order = createOrder(testOrderRequest);
      const cancelled = cancelOrder(order.id);
      expect(cancelled?.status).toBe('cancelled');
    });

    it('should not cancel a delivered order', () => {
      const order = createOrder(testOrderRequest);
      updateOrderStatus(order.id, 'delivered');
      const cancelled = cancelOrder(order.id);
      expect(cancelled).toBeUndefined();
    });

    it('should not cancel an already cancelled order', () => {
      const order = createOrder(testOrderRequest);
      cancelOrder(order.id);
      const cancelled = cancelOrder(order.id);
      expect(cancelled).toBeUndefined();
    });
  });

  describe('getOrderStats', () => {
    it('should return statistics for a hotel', () => {
      const uniqueHotelId = 'h-test-stats-' + Date.now();
      const order1 = createOrder({ ...testOrderRequest, hotelId: uniqueHotelId });
      const order2 = createOrder({ ...testOrderRequest, hotelId: uniqueHotelId });
      updateOrderStatus(order1.id, 'delivered');

      const stats = getOrderStats(uniqueHotelId);
      expect(stats.totalOrders).toBe(2);
      expect(stats.completedOrders).toBe(1);
    });

    it('should calculate total revenue', () => {
      const uniqueHotelId = 'h-test-revenue-' + Date.now();
      const order = createOrder({ ...testOrderRequest, hotelId: uniqueHotelId });
      updateOrderStatus(order.id, 'delivered');
      const stats = getOrderStats(uniqueHotelId);
      expect(stats.totalRevenue).toBe(order.total);
    });
  });
});

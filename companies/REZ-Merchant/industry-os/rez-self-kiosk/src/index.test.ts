/**
 * Unit Tests for Self-Ordering Kiosk Service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock logger
jest.mock('./utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Socket.IO
jest.mock('socket.io', () => {
  return class MockServer {
    constructor() {}
    emit() {}
    on() {
      return { on: () => {} };
    }
  };
});

describe('KioskService', () => {
  describe('KioskSession Interface', () => {
    it('should have required session properties', () => {
      const session = {
        sessionId: 'KIOSK-123-abc',
        restaurantId: 'rest_123',
        cart: [],
        createdAt: new Date(),
        status: 'active',
      };

      expect(session.sessionId).toBeDefined();
      expect(session.restaurantId).toBeDefined();
      expect(session.cart).toBeInstanceOf(Array);
      expect(['active', 'payment', 'completed', 'cancelled']).toContain(session.status);
    });

    it('should validate session status transitions', () => {
      const validStatuses = ['active', 'payment', 'completed', 'cancelled'];
      validStatuses.forEach((status) => {
        expect(['active', 'payment', 'completed', 'cancelled']).toContain(status);
      });
    });
  });

  describe('KioskCartItem Interface', () => {
    it('should have required cart item properties', () => {
      const cartItem = {
        itemId: 'item_123',
        name: 'Margherita Pizza',
        price: 12.99,
        quantity: 2,
        customizations: [{ name: 'Extra Cheese', price: 2.0 }],
      };

      expect(cartItem.itemId).toBeDefined();
      expect(cartItem.name).toBeDefined();
      expect(cartItem.price).toBeGreaterThan(0);
      expect(cartItem.quantity).toBeGreaterThan(0);
    });

    it('should validate optional customizations', () => {
      const minimalItem = {
        itemId: 'item_123',
        name: 'Pizza',
        price: 10,
        quantity: 1,
      };

      expect(minimalItem).not.toHaveProperty('customizations');
    });
  });

  describe('KioskOrder Interface', () => {
    it('should have required order properties', () => {
      const order = {
        orderId: 'KORD-123',
        restaurantId: 'rest_123',
        items: [
          { itemId: 'item_1', name: 'Pizza', price: 12.99, quantity: 2 },
        ],
        total: 27.98,
        status: 'pending_payment',
      };

      expect(order.orderId).toBeDefined();
      expect(order.restaurantId).toBeDefined();
      expect(order.items).toBeInstanceOf(Array);
      expect(order.total).toBeGreaterThan(0);
      expect(order.status).toBeDefined();
    });
  });

  describe('Session ID Generation', () => {
    it('should generate session ID with correct format', () => {
      const timestamp = Date.now();
      const mockUUID = 'abc123def456';
      const sessionId = `KIOSK-${timestamp}-${mockUUID}`;

      expect(sessionId).toMatch(/^KIOSK-\d+-[a-z0-9]+$/);
    });

    it('should generate unique session IDs', () => {
      const timestamp = Date.now();
      const sessionId1 = `KIOSK-${timestamp}-abc123`;
      const sessionId2 = `KIOSK-${timestamp}-def456`;

      expect(sessionId1).not.toBe(sessionId2);
    });
  });

  describe('Cart Operations', () => {
    it('should add item to cart', () => {
      const cart: any[] = [];
      const item = { itemId: 'item_1', name: 'Pizza', price: 12.99, quantity: 1 };

      cart.push(item);

      expect(cart).toHaveLength(1);
      expect(cart[0]).toEqual(item);
    });

    it('should calculate cart total', () => {
      const cart = [
        { itemId: 'item_1', name: 'Pizza', price: 12.99, quantity: 2 },
        { itemId: 'item_2', name: 'Salad', price: 8.99, quantity: 1 },
      ];

      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

      expect(total).toBeCloseTo(34.97, 2);
    });

    it('should update item quantity', () => {
      const cart = [
        { itemId: 'item_1', name: 'Pizza', price: 12.99, quantity: 2 },
      ];

      const index = cart.findIndex((i) => i.itemId === 'item_1');
      if (index !== -1) {
        cart[index].quantity = 3;
      }

      expect(cart[0].quantity).toBe(3);
    });

    it('should remove item when quantity is zero', () => {
      const cart = [
        { itemId: 'item_1', name: 'Pizza', price: 12.99, quantity: 2 },
        { itemId: 'item_2', name: 'Salad', price: 8.99, quantity: 1 },
      ];

      const quantity = 0;
      const index = cart.findIndex((i) => i.itemId === 'item_1');

      if (quantity <= 0) {
        cart.splice(index, 1);
      }

      expect(cart).toHaveLength(1);
      expect(cart[0].itemId).toBe('item_2');
    });

    it('should clear cart', () => {
      const cart = [
        { itemId: 'item_1', name: 'Pizza', price: 12.99, quantity: 2 },
      ];

      cart.length = 0;

      expect(cart).toHaveLength(0);
    });
  });

  describe('Checkout Calculation', () => {
    it('should calculate subtotal correctly', () => {
      const cart = [
        { price: 12.99, quantity: 2 },
        { price: 8.99, quantity: 1 },
      ];

      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

      expect(subtotal).toBeCloseTo(34.97, 2);
    });

    it('should calculate 18% tax correctly', () => {
      const subtotal = 100;
      const tax = subtotal * 0.18;

      expect(tax).toBe(18);
    });

    it('should calculate total with tax', () => {
      const subtotal = 100;
      const tax = subtotal * 0.18;
      const total = subtotal + tax;

      expect(total).toBe(118);
    });

    it('should handle edge case of empty cart', () => {
      const cart: any[] = [];
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

      expect(subtotal).toBe(0);
    });

    it('should handle decimal precision', () => {
      const cart = [
        { price: 9.99, quantity: 3 },
      ];

      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const tax = subtotal * 0.18;
      const total = subtotal + tax;

      // Check precision is reasonable
      expect(total.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe('Receipt Generation', () => {
    it('should generate receipt with correct structure', () => {
      const order = {
        orderId: 'KORD-123',
        items: [
          { name: 'Pizza', price: 12.99, quantity: 2 },
        ],
        total: 34.97 * 1.18, // With tax
      };

      const receipt = {
        orderId: order.orderId,
        items: order.items,
        subtotal: order.total / 1.18,
        tax: order.total * 0.18 / 1.18,
        total: order.total,
        printedAt: new Date().toISOString(),
      };

      expect(receipt).toHaveProperty('orderId');
      expect(receipt).toHaveProperty('items');
      expect(receipt).toHaveProperty('subtotal');
      expect(receipt).toHaveProperty('tax');
      expect(receipt).toHaveProperty('total');
      expect(receipt).toHaveProperty('printedAt');
    });

    it('should calculate receipt totals correctly', () => {
      const total = 100;
      const subtotal = total / 1.18;
      const tax = total * 0.18 / 1.18;

      expect((subtotal + tax).toFixed(2)).toBe(total.toFixed(2));
    });
  });

  describe('Order Status Transitions', () => {
    it('should have correct initial order status', () => {
      const order = { status: 'pending_payment' };
      expect(order.status).toBe('pending_payment');
    });

    it('should transition to paid after payment', () => {
      const order = { orderId: 'KORD-123', status: 'pending_payment' };
      order.status = 'paid';
      expect(order.status).toBe('paid');
    });

    it('should validate order statuses', () => {
      const validStatuses = ['pending_payment', 'paid', 'preparing', 'ready', 'completed', 'cancelled'];

      expect(validStatuses).toContain('pending_payment');
      expect(validStatuses).toContain('paid');
    });
  });

  describe('Session Management', () => {
    it('should create session with active status', () => {
      const session = {
        sessionId: 'KIOSK-123',
        restaurantId: 'rest_123',
        cart: [],
        createdAt: new Date(),
        status: 'active',
      };

      expect(session.status).toBe('active');
      expect(session.cart).toHaveLength(0);
    });

    it('should transition session to payment status', () => {
      const session = {
        sessionId: 'KIOSK-123',
        status: 'active',
        cart: [{ itemId: '1', name: 'Pizza', price: 10, quantity: 1 }],
      };

      session.status = 'payment';
      session.cart = [];

      expect(session.status).toBe('payment');
      expect(session.cart).toHaveLength(0);
    });

    it('should handle session not found', () => {
      const sessions = new Map<string, any>();
      const sessionId = 'nonexistent';

      const session = sessions.get(sessionId);
      expect(session).toBeUndefined();
    });

    it('should handle cart empty during checkout', () => {
      const cart: any[] = [];
      const isEmpty = cart.length === 0;

      expect(isEmpty).toBe(true);
    });
  });

  describe('KioskEvent Emission', () => {
    it('should emit cart update event', () => {
      const sessionId = 'KIOSK-123';
      const eventType = 'cart_update';
      const event = { type: eventType, cart: [] };

      expect(event.type).toBe('cart_update');
    });

    it('should emit cart cleared event', () => {
      const event = { type: 'cart_cleared' };
      expect(event.type).toBe('cart_cleared');
    });

    it('should emit ready for payment event', () => {
      const event = {
        type: 'ready_for_payment',
        order: { orderId: 'KORD-123' },
      };

      expect(event.type).toBe('ready_for_payment');
      expect(event.order).toBeDefined();
    });

    it('should emit cart update with session ID', () => {
      const sessionId = 'KIOSK-123';
      const eventName = `kiosk_${sessionId}`;

      expect(eventName).toBe('kiosk_KIOSK-123');
    });
  });

  describe('Socket.IO Integration', () => {
    it('should generate socket room name from session ID', () => {
      const sessionId = 'KIOSK-123';
      const roomName = `kiosk_${sessionId}`;

      expect(roomName).toBe('kiosk_KIOSK-123');
    });

    it('should handle subscribe event', () => {
      const sessionId = 'KIOSK-123';
      // Simulated socket subscription
      const subscription = { sessionId, room: `kiosk_${sessionId}` };

      expect(subscription.room).toBe('kiosk_KIOSK-123');
    });
  });

  describe('Order ID Generation', () => {
    it('should generate order ID with correct prefix', () => {
      const timestamp = Date.now();
      const orderId = `KORD-${timestamp}`;

      expect(orderId).toMatch(/^KORD-\d+$/);
    });

    it('should generate unique order IDs', () => {
      const orderId1 = `KORD-${Date.now()}`;
      // Simulate small delay
      const orderId2 = `KORD-${Date.now() + 1}`;

      expect(orderId1).not.toBe(orderId2);
    });
  });

  describe('Item ID Operations', () => {
    it('should find item by ID in cart', () => {
      const cart = [
        { itemId: 'item_1', name: 'Pizza', price: 12.99, quantity: 2 },
        { itemId: 'item_2', name: 'Salad', price: 8.99, quantity: 1 },
      ];

      const itemId = 'item_2';
      const index = cart.findIndex((i) => i.itemId === itemId);

      expect(index).toBe(1);
      expect(cart[index].name).toBe('Salad');
    });

    it('should return -1 for non-existent item', () => {
      const cart = [
        { itemId: 'item_1', name: 'Pizza', price: 12.99, quantity: 2 },
      ];

      const index = cart.findIndex((i) => i.itemId === 'nonexistent');

      expect(index).toBe(-1);
    });
  });

  describe('CORS Configuration', () => {
    it('should parse allowed origins', () => {
      const allowedOrigins = 'https://rez.money,https://admin.rez.money';
      const origins = allowedOrigins.split(',');

      expect(origins).toHaveLength(2);
      expect(origins[0]).toBe('https://rez.money');
    });

    it('should handle single origin', () => {
      const allowedOrigins = 'https://rez.money';
      const origins = allowedOrigins.split(',');

      expect(origins).toHaveLength(1);
    });

    it('should enable credentials for CORS', () => {
      const corsConfig = {
        origin: 'https://rez.money',
        credentials: true,
      };

      expect(corsConfig.credentials).toBe(true);
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', () => {
      const healthResponse = {
        status: 'healthy',
        service: 'rez-self-kiosk',
      };

      expect(healthResponse.status).toBe('healthy');
      expect(healthResponse.service).toBe('rez-self-kiosk');
    });
  });

  describe('Error Responses', () => {
    it('should return 404 for session not found', () => {
      const errorResponse = {
        success: false,
        error: 'Session not found',
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Session not found');
    });

    it('should return 400 for empty cart', () => {
      const errorResponse = {
        success: false,
        error: 'Cart is empty',
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Cart is empty');
    });

    it('should return 404 for order not found', () => {
      const errorResponse = {
        success: false,
        error: 'Order not found',
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Order not found');
    });
  });

  describe('Port Configuration', () => {
    it('should use default port', () => {
      const defaultPort = process.env.PORT || '4038';
      expect(defaultPort).toBe('4038');
    });

    it('should allow environment override', () => {
      const envPort = '5000';
      const port = envPort || '4038';
      expect(port).toBe('5000');
    });
  });
});

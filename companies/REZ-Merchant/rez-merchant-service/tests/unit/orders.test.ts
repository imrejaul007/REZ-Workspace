/**
 * Unit Tests - Order Service
 */

import { describe, test, expect } from '@jest/globals';

// Order status transitions
const ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: ['completed', 'refunded'],
  cancelled: [],
  refunded: [],
  completed: [],
};

function canTransitionOrder(current: string, next: string): boolean {
  return ORDER_TRANSITIONS[current]?.includes(next) || false;
}

// Order amount calculation
function calculateOrderTotal(items: { price: number; quantity: number; discount?: number }[]): {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const tax = Math.round((subtotal - discount) * 0.18);
  return {
    subtotal,
    discount,
    tax,
    total: subtotal - discount + tax,
  };
}

describe('Order Status Transitions', () => {
  test('pending -> confirmed', () => {
    expect(canTransitionOrder('pending', 'confirmed')).toBe(true);
  });

  test('pending -> delivered (invalid)', () => {
    expect(canTransitionOrder('pending', 'delivered')).toBe(false);
  });

  test('delivered -> pending (invalid)', () => {
    expect(canTransitionOrder('delivered', 'pending')).toBe(false);
  });

  test('cancelled is terminal', () => {
    expect(canTransitionOrder('cancelled', 'pending')).toBe(false);
  });

  test('completed is terminal', () => {
    expect(canTransitionOrder('completed', 'refunded')).toBe(false);
  });
});

describe('Order Calculations', () => {
  test('calculates correct subtotal', () => {
    const items = [
      { price: 100, quantity: 2 },
      { price: 50, quantity: 3 },
    ];
    const { subtotal } = calculateOrderTotal(items);
    expect(subtotal).toBe(350);
  });

  test('applies item discounts', () => {
    const items = [
      { price: 200, quantity: 1, discount: 20 },
    ];
    const { discount } = calculateOrderTotal(items);
    expect(discount).toBe(20);
  });

  test('calculates 18% GST', () => {
    const items = [{ price: 1000, quantity: 1 }];
    const { tax } = calculateOrderTotal(items);
    expect(tax).toBe(180);
  });

  test('handles empty order', () => {
    const { subtotal } = calculateOrderTotal([]);
    expect(subtotal).toBe(0);
  });
});

describe('Order Validation', () => {
  test('validates phone format', () => {
    const phoneRegex = /^[6-9]\d{9}$/;
    expect(phoneRegex.test('9876543210')).toBe(true);
    expect(phoneRegex.test('12345')).toBe(false);
  });

  test('validates email format', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test('test@example.com')).toBe(true);
    expect(emailRegex.test('invalid')).toBe(false);
  });
});

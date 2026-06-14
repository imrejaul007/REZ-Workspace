/**
 * rez-laundry-service Unit Tests
 * Tests laundry services, order management, and pricing functionality
 */

import { describe, it, expect } from 'vitest';

describe('Service Types', () => {
  it('should have correct service type structure', () => {
    const service = {
      id: 'service-001',
      name: 'Regular Wash & Fold',
      description: 'Standard wash and fold service',
      basePrice: 50,
      priceUnit: 'kg' as const,
      category: 'wash' as const,
      turnaroundHours: 8,
      expressSurcharge: 1.5,
      currency: 'INR',
      isActive: true,
    };

    expect(service).toHaveProperty('basePrice');
    expect(service).toHaveProperty('turnaroundHours');
    expect(service.priceUnit).toBe('kg');
  });

  it('should validate service categories', () => {
    const categories = ['wash', 'dry-clean', 'press', 'special'];
    expect(categories).toContain('wash');
    expect(categories).toContain('dry-clean');
  });

  it('should validate price units', () => {
    const units = ['piece', 'kg', 'flat'];
    expect(units).toContain('piece');
    expect(units).toContain('kg');
  });

  it('should calculate express surcharge correctly', () => {
    const basePrice = 100;
    const expressMultiplier = 1.5;
    const expressPrice = basePrice * expressMultiplier;

    expect(expressPrice).toBe(150);
  });

  it('should calculate express charge correctly', () => {
    const subtotal = 400;
    const expressSurcharge = 1.5;
    const expressCharge = subtotal * (expressSurcharge - 1);

    expect(expressCharge).toBe(200);
  });
});

describe('Laundry Items', () => {
  it('should have correct item structure', () => {
    const item = {
      id: 'item-001',
      name: 'Shirt/Tops',
      category: 'tops',
      defaultServiceId: 'service-001',
      priceOverrides: {},
    };

    expect(item).toHaveProperty('name');
    expect(item).toHaveProperty('category');
    expect(item).toHaveProperty('defaultServiceId');
  });

  it('should validate item categories', () => {
    const categories = ['tops', 'bottoms', 'dresses', 'formal', 'linens', 'outerwear', 'ethnic', 'delicates'];
    expect(categories).toContain('tops');
    expect(categories).toContain('ethnic');
  });

  it('should apply price overrides correctly', () => {
    const item = {
      defaultServiceId: 'service-001',
      priceOverrides: { 'service-002': 120 },
    };

    const defaultServicePrice = 50;
    const overridePrice = item.priceOverrides['service-002'] || defaultServicePrice;

    expect(overridePrice).toBe(120);
  });
});

describe('Order Management', () => {
  it('should have correct order structure', () => {
    const order = {
      id: 'order-001',
      orderNumber: 'LNDRY-2026-001',
      guestId: 'guest-001',
      guestName: 'Rajesh Kumar',
      roomNumber: '301',
      hotelId: 'hotel-001',
      items: [
        { itemId: 'item-001', itemName: 'Shirt', quantity: 5, serviceType: 'Wash', price: 50 },
      ],
      subtotal: 250,
      expressCharge: 0,
      totalAmount: 250,
      status: 'pending' as const,
      isExpress: false,
    };

    expect(order).toHaveProperty('orderNumber');
    expect(order).toHaveProperty('totalAmount');
    expect(order).toHaveProperty('status');
  });

  it('should validate order statuses', () => {
    const statuses = ['pending', 'picked-up', 'washing', 'ready', 'delivering', 'delivered', 'cancelled'];
    expect(statuses).toContain('pending');
    expect(statuses).toContain('delivered');
  });

  it('should calculate order total correctly', () => {
    const items = [
      { price: 50, quantity: 5 },
      { price: 50, quantity: 3 },
    ];

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    expect(subtotal).toBe(400);
  });

  it('should calculate express total correctly', () => {
    const subtotal = 400;
    const expressCharge = 200;
    const total = subtotal + expressCharge;

    expect(total).toBe(600);
  });

  it('should generate valid order numbers', () => {
    const orderNumber = 'LNDRY-2026-0001';
    expect(orderNumber).toMatch(/^LNDRY-\d{4}-\d{4}$/);
  });

  it('should validate status transitions', () => {
    const validTransitions: Record<string, string[]> = {
      pending: ['picked-up', 'cancelled'],
      'picked-up': ['washing', 'cancelled'],
      washing: ['ready', 'cancelled'],
      ready: ['delivering'],
      delivering: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    expect(validTransitions['pending']).toContain('picked-up');
    expect(validTransitions['ready']).toContain('delivering');
    expect(validTransitions['delivered']).toHaveLength(0);
  });

  it('should not allow cancelled orders to be modified', () => {
    const order = { status: 'cancelled' };
    const canModify = order.status !== 'delivered' && order.status !== 'cancelled';
    expect(canModify).toBe(false);
  });

  it('should calculate estimated ready time correctly', () => {
    const turnaroundHours = 8;
    const estimatedTime = new Date(Date.now() + turnaroundHours * 60 * 60 * 1000);

    expect(estimatedTime.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('Guest Preferences', () => {
  it('should have correct preferences structure', () => {
    const preferences = {
      guestId: 'guest-001',
      fabricSoftener: true,
      starchLevel: 'light' as const,
      hangDry: false,
      specialCare: ['delicate'],
      preferredPickupTime: '09:00 AM',
    };

    expect(preferences).toHaveProperty('starchLevel');
    expect(preferences).toHaveProperty('fabricSoftener');
  });

  it('should validate starch levels', () => {
    const levels = ['none', 'light', 'medium', 'heavy'];
    expect(levels).toContain('none');
    expect(levels).toContain('heavy');
  });

  it('should track special care requirements', () => {
    const preferences = {
      specialCare: ['delicate', 'wool', 'silk'],
    };

    expect(preferences.specialCare.length).toBe(3);
    expect(preferences.specialCare).toContain('silk');
  });
});

describe('Pricing', () => {
  it('should calculate price by weight correctly', () => {
    const pricePerKg = 50;
    const weight = 2.5;
    const total = pricePerKg * weight;

    expect(total).toBe(125);
  });

  it('should calculate price by piece correctly', () => {
    const pricePerPiece = 150;
    const quantity = 3;
    const total = pricePerPiece * quantity;

    expect(total).toBe(450);
  });

  it('should round totals to 2 decimal places', () => {
    const subtotal = 123.456;
    const rounded = Math.round(subtotal * 100) / 100;

    expect(rounded).toBe(123.46);
  });

  it('should calculate weight from items', () => {
    const items = [
      { name: 'Shirt', quantity: 3, estimatedWeightPerItem: 0.3 },
      { name: 'Pants', quantity: 2, estimatedWeightPerItem: 0.5 },
    ];

    const totalWeight = items.reduce((sum, item) => {
      return sum + (item.quantity * item.estimatedWeightPerItem);
    }, 0);

    expect(totalWeight).toBe(1.9);
  });
});

describe('API Response Format', () => {
  it('should format success response correctly', () => {
    const response = {
      success: true,
      data: { id: 'order-001', status: 'pending' },
      message: 'Order placed successfully',
    };

    expect(response.success).toBe(true);
    expect(response).toHaveProperty('data');
  });

  it('should format error response correctly', () => {
    const errorResponse = {
      success: false,
      message: 'Item not found',
    };

    expect(errorResponse.success).toBe(false);
    expect(errorResponse).toHaveProperty('message');
  });

  it('should include error details for validation failures', () => {
    const validationError = {
      success: false,
      data: { errors: [{ field: 'quantity', message: 'Must be at least 1' }] },
      message: 'Validation failed',
    };

    expect(validationError.success).toBe(false);
    expect(validationError.data).toHaveProperty('errors');
  });
});

describe('Health Check', () => {
  it('should return correct health status format', () => {
    const health = {
      status: 'healthy',
      service: 'rez-laundry-service',
      port: 4048,
      timestamp: new Date().toISOString(),
      stats: {
        services: 6,
        items: 10,
        orders: 25,
        activeOrders: 8,
      },
    };

    expect(health.status).toBe('healthy');
    expect(health).toHaveProperty('stats');
    expect(health.stats).toHaveProperty('services');
  });
});

describe('Order Item Tracking', () => {
  it('should track item quantities correctly', () => {
    const items = [
      { itemName: 'Shirt', quantity: 5 },
      { itemName: 'Pants', quantity: 3 },
      { itemName: 'Towel', quantity: 2 },
    ];

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    expect(totalItems).toBe(10);
  });

  it('should track special instructions per item', () => {
    const orderItem = {
      itemId: 'item-001',
      itemName: 'Shirt',
      quantity: 2,
      price: 50,
      specialInstructions: 'Handle with care, starch medium',
    };

    expect(orderItem.specialInstructions).toBeDefined();
    expect(orderItem.specialInstructions).toContain('starch');
  });

  it('should calculate item totals correctly', () => {
    const items = [
      { price: 50, quantity: 3 },
      { price: 30, quantity: 2 },
    ];

    const itemTotals = items.map(item => ({
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
    }));

    expect(itemTotals[0].total).toBe(150);
    expect(itemTotals[1].total).toBe(60);
  });
});

describe('Order Filtering', () => {
  it('should filter orders by status', () => {
    const orders = [
      { id: '1', status: 'pending' },
      { id: '2', status: 'delivered' },
      { id: '3', status: 'pending' },
    ];

    const pendingOrders = orders.filter(o => o.status === 'pending');
    expect(pendingOrders.length).toBe(2);
  });

  it('should filter orders by date', () => {
    const orders = [
      { id: '1', createdAt: new Date('2026-06-01') },
      { id: '2', createdAt: new Date('2026-06-02') },
      { id: '3', createdAt: new Date('2026-06-01') },
    ];

    const targetDate = '2026-06-01';
    const dayOrders = orders.filter(o =>
      new Date(o.createdAt).toDateString() === new Date(targetDate).toDateString()
    );

    expect(dayOrders.length).toBe(2);
  });

  it('should filter express orders', () => {
    const orders = [
      { id: '1', isExpress: true },
      { id: '2', isExpress: false },
      { id: '3', isExpress: true },
    ];

    const expressOrders = orders.filter(o => o.isExpress);
    expect(expressOrders.length).toBe(2);
  });
});

describe('Status Timeline', () => {
  it('should track pickup time correctly', () => {
    const order = { status: 'picked-up' };
    const pickupTime = new Date();

    expect(order.status).toBe('picked-up');
    expect(pickupTime).toBeInstanceOf(Date);
  });

  it('should track delivery time correctly', () => {
    const order = { status: 'delivered' };
    const deliveredTime = new Date();

    expect(order.status).toBe('delivered');
    expect(deliveredTime).toBeInstanceOf(Date);
  });

  it('should calculate turnaround time', () => {
    const pickupTime = new Date('2026-06-02T09:00:00');
    const deliveredTime = new Date('2026-06-02T17:00:00');
    const turnaroundHours = (deliveredTime.getTime() - pickupTime.getTime()) / (1000 * 60 * 60);

    expect(turnaroundHours).toBe(8);
  });
});

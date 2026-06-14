/**
 * REZ Laundry Service
 * Port: 4048
 *
 * Laundry Management providing:
 * - Laundry pickup and delivery
 * - Service types (wash, dry clean, press, iron)
 * - Order tracking
 * - Pricing management
 * - Guest preferences
 */

import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = parseInt(process.env.PORT || '4048', 10);

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// IN-MEMORY STORES
// ============================================

interface ServiceType {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  priceUnit: 'piece' | 'kg' | 'flat';
  category: 'wash' | 'dry-clean' | 'press' | 'special';
  turnaroundHours: number;
  expressSurcharge: number;
  currency: string;
  isActive: boolean;
}

interface LaundryItem {
  id: string;
  name: string;
  category: string;
  defaultServiceId: string;
  priceOverrides: Record<string, number>;
}

interface Order {
  id: string;
  orderNumber: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  hotelId: string;
  hotelName: string;
  items: OrderItem[];
  serviceType: string;
  weight?: number;
  subtotal: number;
  expressCharge: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'picked-up' | 'washing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  isExpress: boolean;
  pickupTime?: Date;
  estimatedReadyTime: Date;
  deliveredTime?: Date;
  specialInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  serviceType: string;
  price: number;
  specialInstructions?: string;
}

interface GuestPreferences {
  guestId: string;
  preferredPickupTime?: string;
  fabricSoftener: boolean;
  starchLevel: 'none' | 'light' | 'medium' | 'heavy';
  hangDry: boolean;
  specialCare: string[];
}

// In-memory stores
const serviceTypes: Map<string, ServiceType> = new Map();
const laundryItems: Map<string, LaundryItem> = new Map();
const orders: Map<string, Order> = new Map();
const guestPreferences: Map<string, GuestPreferences> = new Map();

// Seed demo service types
const demoServices: ServiceType[] = [
  {
    id: 'service-001',
    name: 'Regular Wash & Fold',
    description: 'Standard wash and fold service',
    basePrice: 50,
    priceUnit: 'kg',
    category: 'wash',
    turnaroundHours: 8,
    expressSurcharge: 1.5,
    currency: 'INR',
    isActive: true,
  },
  {
    id: 'service-002',
    name: 'Dry Cleaning',
    description: 'Professional dry cleaning for delicate fabrics',
    basePrice: 150,
    priceUnit: 'piece',
    category: 'dry-clean',
    turnaroundHours: 24,
    expressSurcharge: 1.75,
    currency: 'INR',
    isActive: true,
  },
  {
    id: 'service-003',
    name: 'Pressing Only',
    description: 'Steam press service only',
    basePrice: 30,
    priceUnit: 'piece',
    category: 'press',
    turnaroundHours: 2,
    expressSurcharge: 1.5,
    currency: 'INR',
    isActive: true,
  },
  {
    id: 'service-004',
    name: 'Express Service',
    description: 'Same-day express laundry service (3 hours)',
    basePrice: 75,
    priceUnit: 'kg',
    category: 'wash',
    turnaroundHours: 3,
    expressSurcharge: 2.0,
    currency: 'INR',
    isActive: true,
  },
  {
    id: 'service-005',
    name: 'Stain Treatment',
    description: 'Specialized stain removal treatment',
    basePrice: 100,
    priceUnit: 'piece',
    category: 'special',
    turnaroundHours: 4,
    expressSurcharge: 1.5,
    currency: 'INR',
    isActive: true,
  },
  {
    id: 'service-006',
    name: 'Leather/Suede Cleaning',
    description: 'Specialized cleaning for leather and suede items',
    basePrice: 500,
    priceUnit: 'piece',
    category: 'dry-clean',
    turnaroundHours: 48,
    expressSurcharge: 2.0,
    currency: 'INR',
    isActive: true,
  },
];

demoServices.forEach(s => serviceTypes.set(s.id, s));

// Seed demo laundry items
const demoItems: LaundryItem[] = [
  { id: 'item-001', name: 'Shirt/Tops', category: 'tops', defaultServiceId: 'service-001', priceOverrides: { 'service-002': 120 } },
  { id: 'item-002', name: 'Pants/Trousers', category: 'bottoms', defaultServiceId: 'service-001', priceOverrides: { 'service-002': 150 } },
  { id: 'item-003', name: 'Dress', category: 'dresses', defaultServiceId: 'service-002', priceOverrides: {} },
  { id: 'item-004', name: 'Suit/Jacket', category: 'formal', defaultServiceId: 'service-002', priceOverrides: {} },
  { id: 'item-005', name: 'Bed Sheet', category: 'linens', defaultServiceId: 'service-001', priceOverrides: {} },
  { id: 'item-006', name: 'Towel', category: 'linens', defaultServiceId: 'service-001', priceOverrides: {} },
  { id: 'item-007', name: 'Blazer/Coat', category: 'outerwear', defaultServiceId: 'service-002', priceOverrides: {} },
  { id: 'item-008', name: 'Saree', category: 'ethnic', defaultServiceId: 'service-002', priceOverrides: {} },
  { id: 'item-009', name: 'Kurta', category: 'ethnic', defaultServiceId: 'service-001', priceOverrides: {} },
  { id: 'item-010', name: 'Delicate Lingerie', category: 'delicates', defaultServiceId: 'service-002', priceOverrides: {} },
];

demoItems.forEach(i => laundryItems.set(i.id, i));

// Seed demo order
const demoOrder: Order = {
  id: 'order-001',
  orderNumber: 'LNDRY-2026-001',
  guestId: 'guest-001',
  guestName: 'Rajesh Kumar',
  roomNumber: '301',
  hotelId: 'hotel-001',
  hotelName: 'Grand Plaza Mumbai',
  items: [
    { itemId: 'item-001', itemName: 'Shirt/Tops', quantity: 5, serviceType: 'service-001', price: 50 },
    { itemId: 'item-002', itemName: 'Pants/Trousers', quantity: 3, serviceType: 'service-001', price: 50 },
  ],
  serviceType: 'service-001',
  weight: 2.5,
  subtotal: 400,
  expressCharge: 0,
  totalAmount: 400,
  currency: 'INR',
  status: 'delivered',
  isExpress: false,
  estimatedReadyTime: new Date('2026-06-02T16:00:00'),
  deliveredTime: new Date('2026-06-02T15:30:00'),
  createdAt: new Date('2026-06-02T08:00:00'),
  updatedAt: new Date('2026-06-02T15:30:00'),
};

orders.set(demoOrder.id, demoOrder);

// ============================================
// ZOD SCHEMAS
// ============================================

const CreateOrderSchema = z.object({
  guestId: z.string(),
  guestName: z.string().min(2),
  roomNumber: z.string(),
  hotelId: z.string(),
  hotelName: z.string(),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().min(1),
    serviceType: z.string(),
    specialInstructions: z.string().optional(),
  })).min(1),
  isExpress: z.boolean().default(false),
  weight: z.number().positive().optional(),
  specialInstructions: z.string().optional(),
});

const UpdateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'picked-up', 'washing', 'ready', 'delivering', 'delivered', 'cancelled']),
});

const GuestPreferencesSchema = z.object({
  fabricSoftener: z.boolean().default(true),
  starchLevel: z.enum(['none', 'light', 'medium', 'heavy']).default('none'),
  hangDry: z.boolean().default(false),
  specialCare: z.array(z.string()).default([]),
  preferredPickupTime: z.string().optional(),
});

const ServiceTypeSchema = z.object({
  name: z.string().min(2),
  description: z.string(),
  basePrice: z.number().positive(),
  priceUnit: z.enum(['piece', 'kg', 'flat']),
  category: z.enum(['wash', 'dry-clean', 'press', 'special']),
  turnaroundHours: z.number().positive(),
  expressSurcharge: z.number().min(1).default(1.5),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `LNDRY-${year}-${random}`;
}

function calculateEstimatedReady(serviceId: string, isExpress: boolean): Date {
  const service = serviceTypes.get(serviceId);
  if (!service) {
    return new Date(Date.now() + 8 * 60 * 60 * 1000); // Default 8 hours
  }

  const baseHours = isExpress ? service.turnaroundHours : service.turnaroundHours * 2;
  return new Date(Date.now() + baseHours * 60 * 60 * 1000);
}

function calculateOrderTotal(items: OrderItem[], serviceId: string, isExpress: boolean): { subtotal: number; expressCharge: number; total: number } {
  const service = serviceTypes.get(serviceId);

  const subtotal = items.reduce((sum, item) => {
    const price = service?.basePrice || item.price;
    return sum + (price * item.quantity);
  }, 0);

  const expressCharge = isExpress && service ? subtotal * (service.expressSurcharge - 1) : 0;
  const total = subtotal + expressCharge;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    expressCharge: Math.round(expressCharge * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

function formatResponse<T>(success: boolean, data?: T, message?: string) {
  return { success, data, message };
}

// ============================================
// SERVICE TYPES ENDPOINTS
// ============================================

/**
 * GET /api/services
 * List all service types
 */
app.get('/api/services', (req, res) => {
  const { category, isActive } = req.query;

  let serviceList = Array.from(serviceTypes.values());

  if (category) {
    serviceList = serviceList.filter(s => s.category === category);
  }
  if (isActive === 'true') {
    serviceList = serviceList.filter(s => s.isActive);
  }

  res.json(formatResponse(true, {
    services: serviceList,
    count: serviceList.length,
  }));
});

/**
 * GET /api/services/:id
 * Get service type details
 */
app.get('/api/services/:id', (req, res) => {
  const service = serviceTypes.get(req.params.id);

  if (!service) {
    return res.status(404).json(formatResponse(false, undefined, 'Service type not found'));
  }

  res.json(formatResponse(true, service));
});

/**
 * POST /api/services
 * Create a new service type
 */
app.post('/api/services', (req, res) => {
  try {
    const data = ServiceTypeSchema.parse(req.body);

    const service: ServiceType = {
      id: `service_${uuidv4().slice(0, 8)}`,
      ...data,
      currency: 'INR',
      isActive: true,
    };

    serviceTypes.set(service.id, service);

    res.status(201).json(formatResponse(true, service, 'Service type created successfully'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(formatResponse(false, { errors: error.errors }, 'Validation failed'));
    }
    res.status(500).json(formatResponse(false, undefined, 'Failed to create service type'));
  }
});

// ============================================
// LAUNDRY ITEMS ENDPOINTS
// ============================================

/**
 * GET /api/items
 * List all laundry items
 */
app.get('/api/items', (req, res) => {
  const { category } = req.query;

  let itemList = Array.from(laundryItems.values());

  if (category) {
    itemList = itemList.filter(i => i.category === category);
  }

  // Add default prices to items
  const itemsWithPrices = itemList.map(item => {
    const service = serviceTypes.get(item.defaultServiceId);
    return {
      ...item,
      defaultPrice: service?.basePrice || 0,
    };
  });

  res.json(formatResponse(true, {
    items: itemsWithPrices,
    count: itemList.length,
  }));
});

/**
 * GET /api/items/:id
 * Get laundry item details
 */
app.get('/api/items/:id', (req, res) => {
  const item = laundryItems.get(req.params.id);

  if (!item) {
    return res.status(404).json(formatResponse(false, undefined, 'Item not found'));
  }

  const service = serviceTypes.get(item.defaultServiceId);

  res.json(formatResponse(true, {
    ...item,
    defaultPrice: service?.basePrice || 0,
    defaultService: service,
  }));
});

// ============================================
// ORDERS ENDPOINTS
// ============================================

/**
 * POST /api/orders
 * Create a new laundry order
 */
app.post('/api/orders', (req, res) => {
  try {
    const data = CreateOrderSchema.parse(req.body);

    // Build order items with prices
    const orderItems: OrderItem[] = [];
    let serviceId = '';

    for (const item of data.items) {
      const laundryItem = laundryItems.get(item.itemId);
      if (!laundryItem) {
        return res.status(404).json(formatResponse(false, undefined, `Item ${item.itemId} not found`));
      }

      const service = serviceTypes.get(item.serviceType);
      if (!service) {
        return res.status(404).json(formatResponse(false, undefined, `Service ${item.serviceType} not found`));
      }

      if (!serviceId) serviceId = item.serviceType;

      orderItems.push({
        itemId: laundryItem.id,
        itemName: laundryItem.name,
        quantity: item.quantity,
        serviceType: service.name,
        price: service.basePrice,
        specialInstructions: item.specialInstructions,
      });
    }

    const { subtotal, expressCharge, total } = calculateOrderTotal(orderItems, serviceId, data.isExpress);
    const estimatedReadyTime = calculateEstimatedReady(serviceId, data.isExpress);

    const order: Order = {
      id: `order_${uuidv4().slice(0, 8)}`,
      orderNumber: generateOrderNumber(),
      guestId: data.guestId,
      guestName: data.guestName,
      roomNumber: data.roomNumber,
      hotelId: data.hotelId,
      hotelName: data.hotelName,
      items: orderItems,
      serviceType: serviceId,
      weight: data.weight,
      subtotal,
      expressCharge,
      totalAmount: total,
      currency: 'INR',
      status: 'pending',
      isExpress: data.isExpress,
      estimatedReadyTime,
      specialInstructions: data.specialInstructions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    orders.set(order.id, order);

    res.status(201).json(formatResponse(true, {
      order,
      message: `Order ${order.orderNumber} placed. Estimated ready: ${estimatedReadyTime.toLocaleTimeString()}`,
    }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(formatResponse(false, { errors: error.errors }, 'Validation failed'));
    }
    res.status(500).json(formatResponse(false, undefined, 'Failed to create order'));
  }
});

/**
 * GET /api/orders
 * List orders with filters
 */
app.get('/api/orders', (req, res) => {
  const { guestId, hotelId, status, date, isExpress } = req.query;

  let orderList = Array.from(orders.values());

  if (guestId) {
    orderList = orderList.filter(o => o.guestId === guestId);
  }
  if (hotelId) {
    orderList = orderList.filter(o => o.hotelId === hotelId);
  }
  if (status) {
    orderList = orderList.filter(o => o.status === status);
  }
  if (date) {
    const targetDate = new Date(date as string).toDateString();
    orderList = orderList.filter(o => new Date(o.createdAt).toDateString() === targetDate);
  }
  if (isExpress === 'true') {
    orderList = orderList.filter(o => o.isExpress);
  }

  orderList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json(formatResponse(true, {
    orders: orderList,
    count: orderList.length,
  }));
});

/**
 * GET /api/orders/:id
 * Get order details
 */
app.get('/api/orders/:id', (req, res) => {
  const order = orders.get(req.params.id);

  if (!order) {
    return res.status(404).json(formatResponse(false, undefined, 'Order not found'));
  }

  res.json(formatResponse(true, order));
});

/**
 * GET /api/orders/number/:orderNumber
 * Get order by order number
 */
app.get('/api/orders/number/:orderNumber', (req, res) => {
  const order = Array.from(orders.values()).find(o => o.orderNumber === req.params.orderNumber);

  if (!order) {
    return res.status(404).json(formatResponse(false, undefined, 'Order not found'));
  }

  res.json(formatResponse(true, order));
});

/**
 * PUT /api/orders/:id
 * Update order
 */
app.put('/api/orders/:id', (req, res) => {
  const order = orders.get(req.params.id);

  if (!order) {
    return res.status(404).json(formatResponse(false, undefined, 'Order not found'));
  }

  if (order.status === 'delivered' || order.status === 'cancelled') {
    return res.status(400).json(formatResponse(false, undefined, 'Cannot modify completed or cancelled order'));
  }

  const { items, isExpress, weight, specialInstructions } = req.body;

  if (items) {
    const updatedItems: OrderItem[] = [];
    for (const item of items) {
      const laundryItem = laundryItems.get(item.itemId);
      const service = serviceTypes.get(item.serviceType);

      if (laundryItem && service) {
        updatedItems.push({
          itemId: laundryItem.id,
          itemName: laundryItem.name,
          quantity: item.quantity,
          serviceType: service.name,
          price: service.basePrice,
          specialInstructions: item.specialInstructions,
        });
      }
    }

    order.items = updatedItems;
    const { subtotal, expressCharge, total } = calculateOrderTotal(updatedItems, order.serviceType, isExpress ?? order.isExpress);
    order.subtotal = subtotal;
    order.expressCharge = expressCharge;
    order.totalAmount = total;
  }

  if (isExpress !== undefined) order.isExpress = isExpress;
  if (weight !== undefined) order.weight = weight;
  if (specialInstructions !== undefined) order.specialInstructions = specialInstructions;

  order.updatedAt = new Date();
  orders.set(order.id, order);

  res.json(formatResponse(true, order, 'Order updated successfully'));
});

/**
 * PUT /api/orders/:id/status
 * Update order status
 */
app.put('/api/orders/:id/status', (req, res) => {
  try {
    const order = orders.get(req.params.id);

    if (!order) {
      return res.status(404).json(formatResponse(false, undefined, 'Order not found'));
    }

    const data = UpdateOrderStatusSchema.parse(req.body);

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      pending: ['picked-up', 'cancelled'],
      'picked-up': ['washing', 'cancelled'],
      washing: ['ready', 'cancelled'],
      ready: ['delivering'],
      delivering: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[order.status].includes(data.status)) {
      return res.status(400).json(formatResponse(false, undefined,
        `Invalid status transition from ${order.status} to ${data.status}`));
    }

    order.status = data.status;
    order.updatedAt = new Date();

    if (data.status === 'picked-up') {
      order.pickupTime = new Date();
    }
    if (data.status === 'delivered') {
      order.deliveredTime = new Date();
    }

    orders.set(order.id, order);

    res.json(formatResponse(true, order, `Order status updated to ${data.status}`));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(formatResponse(false, { errors: error.errors }, 'Validation failed'));
    }
    res.status(500).json(formatResponse(false, undefined, 'Status update failed'));
  }
});

/**
 * POST /api/orders/:id/cancel
 * Cancel an order
 */
app.post('/api/orders/:id/cancel', (req, res) => {
  const order = orders.get(req.params.id);

  if (!order) {
    return res.status(404).json(formatResponse(false, undefined, 'Order not found'));
  }

  if (order.status === 'delivered' || order.status === 'cancelled') {
    return res.status(400).json(formatResponse(false, undefined, 'Order cannot be cancelled'));
  }

  if (order.status === 'washing' || order.status === 'delivering') {
    return res.status(400).json(formatResponse(false, undefined, 'Order is being processed and cannot be cancelled'));
  }

  order.status = 'cancelled';
  order.updatedAt = new Date();

  orders.set(order.id, order);

  res.json(formatResponse(true, order, 'Order cancelled successfully'));
});

// ============================================
// GUEST PREFERENCES ENDPOINTS
// ============================================

/**
 * POST /api/preferences
 * Set guest laundry preferences
 */
app.post('/api/preferences', (req, res) => {
  try {
    const guestId = req.body.guestId as string;
    if (!guestId) {
      return res.status(400).json(formatResponse(false, undefined, 'Guest ID required'));
    }

    const data = GuestPreferencesSchema.parse(req.body);

    const preferences: GuestPreferences = {
      guestId,
      fabricSoftener: data.fabricSoftener,
      starchLevel: data.starchLevel,
      hangDry: data.hangDry,
      specialCare: data.specialCare,
      preferredPickupTime: data.preferredPickupTime,
    };

    guestPreferences.set(guestId, preferences);

    res.status(201).json(formatResponse(true, preferences, 'Preferences saved successfully'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(formatResponse(false, { errors: error.errors }, 'Validation failed'));
    }
    res.status(500).json(formatResponse(false, undefined, 'Failed to save preferences'));
  }
});

/**
 * GET /api/preferences/:guestId
 * Get guest preferences
 */
app.get('/api/preferences/:guestId', (req, res) => {
  const preferences = guestPreferences.get(req.params.guestId);

  if (!preferences) {
    return res.status(404).json(formatResponse(false, undefined, 'Preferences not found'));
  }

  res.json(formatResponse(true, preferences));
});

// ============================================
// PRICING ENDPOINTS
// ============================================

/**
 * GET /api/pricing/estimate
 * Get price estimate for items
 */
app.get('/api/pricing/estimate', (req, res) => {
  const { items, serviceId, isExpress } = req.query;

  if (!items || !serviceId) {
    return res.status(400).json(formatResponse(false, undefined, 'Items and service ID required'));
  }

  const service = serviceTypes.get(serviceId as string);
  if (!service) {
    return res.status(404).json(formatResponse(false, undefined, 'Service not found'));
  }

  try {
    const itemList = JSON.parse(items as string);

    const orderItems: OrderItem[] = itemList.map((item: { itemId: string; quantity: number }) => {
      const laundryItem = laundryItems.get(item.itemId);
      return {
        itemId: item.itemId,
        itemName: laundryItem?.name || 'Unknown',
        quantity: item.quantity,
        serviceType: service.name,
        price: service.basePrice,
      };
    });

    const { subtotal, expressCharge, total } = calculateOrderTotal(orderItems, serviceId as string, isExpress === 'true');

    res.json(formatResponse(true, {
      items: orderItems,
      service: {
        id: service.id,
        name: service.name,
        turnaroundHours: service.turnaroundHours,
      },
      subtotal,
      expressCharge: isExpress === 'true' ? expressCharge : 0,
      totalAmount: isExpress === 'true' ? total : subtotal,
      currency: 'INR',
      estimatedReady: calculateEstimatedReady(serviceId as string, isExpress === 'true'),
    }));
  } catch {
    res.status(400).json(formatResponse(false, undefined, 'Invalid items format'));
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-laundry-service',
    port: PORT,
    timestamp: new Date().toISOString(),
    stats: {
      services: serviceTypes.size,
      items: laundryItems.size,
      orders: orders.size,
      activeOrders: Array.from(orders.values()).filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length,
    },
  });
});

app.get('/ready', (_req, res) => {
  res.json({
    ready: true,
    service: 'rez-laundry-service',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║       REZ Laundry Service - Port ${PORT}              ║
╠═══════════════════════════════════════════════════════╣
║  Laundry Pickup & Delivery                          ║
║  Wash, Dry Clean & Press Services                   ║
║  Order Tracking                                     ║
║  Express Service                                   ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export default app;

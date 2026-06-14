import { v4 as uuidv4 } from 'uuid';
import { MenuItem } from '../models/menu.model';

export interface RoomServiceOrder {
  orderId: string;
  hotelId: string;
  roomNumber: string;
  guestName: string;
  items: {
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
    customizations?: string[];
  }[];
  subtotal: number;
  taxes: {
    sgst: number;
    cgst: number;
    serviceCharge: number;
    totalTaxes: number;
  };
  discount: {
    code?: string;
    type: 'percentage' | 'fixed';
    value: number;
    amount: number;
  };
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'room_charge' | 'card' | 'upi' | 'cash';
  specialInstructions?: string;
  dietaryFlags?: string[];
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KitchenStation {
  stationId: string;
  name: string;
  type: 'grill' | 'saute' | 'fry' | 'cold' | 'dessert' | 'beverage' | 'main';
  capacity: number;
  currentOrders: number;
  avgPrepTime: number;
  items: string[]; // item IDs this station handles
}

export class RoomServiceOrdersService {
  private orders: Map<string, RoomServiceOrder> = new Map();
  private kitchenStations: Map<string, KitchenStation> = new Map();

  constructor() {
    this.initializeKitchenStations();
  }

  private initializeKitchenStations() {
    const stations: KitchenStation[] = [
      { stationId: 'grill-1', name: 'Grill Station 1', type: 'grill', capacity: 5, currentOrders: 0, avgPrepTime: 15, items: [] },
      { stationId: 'saute-1', name: 'Sauté Station 1', type: 'saute', capacity: 4, currentOrders: 0, avgPrepTime: 12, items: [] },
      { stationId: 'fry-1', name: 'Fry Station 1', type: 'fry', capacity: 6, currentOrders: 0, avgPrepTime: 8, items: [] },
      { stationId: 'cold-1', name: 'Cold Kitchen', type: 'cold', capacity: 4, currentOrders: 0, avgPrepTime: 6, items: [] },
      { stationId: 'dessert-1', name: 'Dessert Station', type: 'dessert', capacity: 3, currentOrders: 0, avgPrepTime: 10, items: [] },
      { stationId: 'beverage-1', name: 'Beverage Bar', type: 'beverage', capacity: 8, currentOrders: 0, avgPrepTime: 3, items: [] },
      { stationId: 'main-1', name: 'Main Kitchen', type: 'main', capacity: 6, currentOrders: 0, avgPrepTime: 20, items: [] },
    ];

    stations.forEach(s => this.kitchenStations.set(s.stationId, s));
  }

  async createOrder(
    hotelId: string,
    roomNumber: string,
    guestName: string,
    items: { itemId: string; name: string; quantity: number; price: number; notes?: string }[],
    dietaryFlags?: string[],
    specialInstructions?: string
  ): Promise<RoomServiceOrder> {
    const orderId = `RS-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Calculate taxes (GST 2.5% each + 10% service charge)
    const sgst = subtotal * 0.025;
    const cgst = subtotal * 0.025;
    const serviceCharge = subtotal * 0.10;
    const totalTaxes = sgst + cgst + serviceCharge;

    const total = subtotal + totalTaxes;

    // Estimate delivery time based on items
    const estimatedMinutes = this.calculatePrepTime(items) + 10; // +10 min delivery
    const estimatedDelivery = new Date(Date.now() + estimatedMinutes * 60 * 1000);

    const order: RoomServiceOrder = {
      orderId,
      hotelId,
      roomNumber,
      guestName,
      items,
      subtotal,
      taxes: { sgst, cgst, serviceCharge, totalTaxes },
      discount: { type: 'percentage', value: 0, amount: 0 },
      total,
      status: 'pending',
      paymentStatus: 'pending',
      dietaryFlags,
      specialInstructions,
      estimatedDelivery,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.orders.set(orderId, order);

    return order;
  }

  async confirmOrder(orderId: string): Promise<RoomServiceOrder> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    order.status = 'confirmed';
    order.updatedAt = new Date();
    this.orders.set(orderId, order);

    return order;
  }

  async startPreparing(orderId: string, assignedTo?: string): Promise<RoomServiceOrder> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    order.status = 'preparing';
    order.assignedTo = assignedTo;
    order.updatedAt = new Date();

    this.orders.set(orderId, order);
    return order;
  }

  async markReady(orderId: string): Promise<RoomServiceOrder> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    order.status = 'ready';
    order.updatedAt = new Date();
    this.orders.set(orderId, order);

    return order;
  }

  async markDelivered(orderId: string): Promise<RoomServiceOrder> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    order.status = 'delivered';
    order.paymentStatus = 'paid'; // Room charge typically settles at checkout
    order.actualDelivery = new Date();
    order.updatedAt = new Date();

    this.orders.set(orderId, order);
    return order;
  }

  async cancelOrder(orderId: string, reason?: string): Promise<RoomServiceOrder> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    if (order.status === 'delivered') {
      throw new Error('Cannot cancel delivered order');
    }

    order.status = 'cancelled';
    order.specialInstructions = reason ? `${order.specialInstructions || ''} [Cancelled: ${reason}]` : order.specialInstructions;
    order.updatedAt = new Date();

    this.orders.set(orderId, order);
    return order;
  }

  async applyDiscount(orderId: string, code: string, type: 'percentage' | 'fixed', value: number): Promise<RoomServiceOrder> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    const discountAmount = type === 'percentage'
      ? order.subtotal * (value / 100)
      : Math.min(value, order.subtotal);

    order.discount = { code, type, value, amount: discountAmount };
    order.total = order.subtotal + order.taxes.totalTaxes - discountAmount;
    order.updatedAt = new Date();

    this.orders.set(orderId, order);
    return order;
  }

  async processPayment(orderId: string, method: 'room_charge' | 'card' | 'upi' | 'cash'): Promise<RoomServiceOrder> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    order.paymentMethod = method;
    order.paymentStatus = 'paid';
    order.updatedAt = new Date();

    this.orders.set(orderId, order);
    return order;
  }

  async getOrder(orderId: string): Promise<RoomServiceOrder | undefined> {
    return this.orders.get(orderId);
  }

  async getActiveOrders(hotelId: string): Promise<RoomServiceOrder[]> {
    return Array.from(this.orders.values()).filter(
      o => o.hotelId === hotelId && !['delivered', 'cancelled'].includes(o.status)
    );
  }

  async getOrdersByRoom(hotelId: string, roomNumber: string): Promise<RoomServiceOrder[]> {
    return Array.from(this.orders.values())
      .filter(o => o.hotelId === hotelId && o.roomNumber === roomNumber)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getKitchenStatus(hotelId: string): Promise<{
    orders: RoomServiceOrder[];
    stations: KitchenStation[];
    avgWaitTime: number;
  }> {
    const activeOrders = await this.getActiveOrders(hotelId);
    const stations = Array.from(this.kitchenStations.values());

    // Update station current orders
    stations.forEach(station => {
      station.currentOrders = activeOrders.filter(o => o.assignedTo === station.stationId).length;
    });

    const avgWaitTime = activeOrders.length > 0
      ? activeOrders.reduce((sum, o) => {
          const wait = (Date.now() - o.createdAt.getTime()) / 60000;
          return sum + wait;
        }, 0) / activeOrders.length
      : 0;

    return { orders: activeOrders, stations, avgWaitTime };
  }

  async getDailyStats(hotelId: string, date: Date = new Date()): Promise<{
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    revenue: number;
    avgOrderValue: number;
    avgPrepTime: number;
    popularItems: { itemId: string; name: string; quantity: number }[];
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dayOrders = Array.from(this.orders.values()).filter(
      o => o.hotelId === hotelId &&
           o.createdAt >= startOfDay &&
           o.createdAt <= endOfDay
    );

    const completedOrders = dayOrders.filter(o => o.status === 'delivered');
    const cancelledOrders = dayOrders.filter(o => o.status === 'cancelled');
    const revenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

    // Count popular items
    const itemCounts = new Map<string, { name: string; quantity: number }>();
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        const existing = itemCounts.get(item.itemId) || { name: item.name, quantity: 0 };
        existing.quantity += item.quantity;
        itemCounts.set(item.itemId, existing);
      });
    });

    const popularItems = Array.from(itemCounts.entries())
      .map(([itemId, data]) => ({ itemId, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalOrders: dayOrders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      revenue,
      avgOrderValue: completedOrders.length > 0 ? revenue / completedOrders.length : 0,
      avgPrepTime: 12, // Mock value
      popularItems,
    };
  }

  private calculatePrepTime(items: { itemId: string; quantity: number }[]): number {
    // Base prep times by item type (mock)
    const baseTimes: Record<string, number> = {
      beverage: 3,
      starter: 8,
      main: 15,
      dessert: 10,
      combo: 20,
    };

    return Math.max(...items.map(i => (baseTimes[i.itemId] || 10) * i.quantity));
  }
}
